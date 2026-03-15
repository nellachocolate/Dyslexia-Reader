(function initContentScript() {
  const shared = globalThis.DyslexiaReaderShared;
  const LETTER_PATTERN = /[A-Za-z'-]/;
  const TEXT_WORD_PATTERN = /[A-Za-z][A-Za-z'-]{2,}/g;
  const SYLLABLE_SEPARATOR = "\u00b7";
  const UI_ROOT_ID = "dr-reader-root";
  const BLOCK_TAGS = new Set([
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "DD",
    "DIV",
    "DL",
    "FIGCAPTION",
    "FOOTER",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "LI",
    "MAIN",
    "NAV",
    "P",
    "SECTION",
    "TD",
    "TH"
  ]);
  const BLENDS = new Set([
    "bl", "br", "ch", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "ph",
    "pl", "pr", "sc", "sh", "sk", "sl", "sm", "sn", "sp", "st", "sw",
    "th", "tr", "tw", "wh", "wr", "qu"
  ]);
  const SKIP_SELECTOR = [
    "#" + UI_ROOT_ID,
    "script",
    "style",
    "noscript",
    "textarea",
    "input",
    "select",
    "option",
    "button",
    "code",
    "pre",
    "svg",
    "math",
    "[contenteditable='']",
    "[contenteditable='true']"
  ].join(",");

  const state = {
    settings: shared.DEFAULT_SETTINGS,
    currentSentence: null,
    focusUpdateFrame: 0,
    hoverLookupToken: 0,
    hoverTimer: 0,
    lastSelectionText: "",
    lastSelectionRect: null,
    rewriteBusy: false,
    syllableReplacements: [],
    syllableObserver: null,
    performingSyllableMutation: false
  };

  let uiRoot;
  let tooltipEl;
  let focusLayerEl;
  let focusBoxesEl;
  let rewriteButtonEl;
  let rewritePanelEl;

  setup().catch(() => {});

  async function setup() {
    buildUi();
    state.settings = await shared.getStoredSettings();
    applySettings(state.settings);
    bindEvents();
  }

  function buildUi() {
    uiRoot = document.createElement("div");
    uiRoot.id = UI_ROOT_ID;

    tooltipEl = document.createElement("div");
    tooltipEl.className = "dr-tooltip dr-hidden";

    focusLayerEl = document.createElement("div");
    focusLayerEl.className = "dr-focus-layer dr-hidden";

    const focusMaskEl = document.createElement("div");
    focusMaskEl.className = "dr-focus-mask";
    focusBoxesEl = document.createElement("div");

    const focusCaptionEl = document.createElement("div");
    focusCaptionEl.className = "dr-focus-caption";
    focusCaptionEl.textContent = "Sentence focus is active";

    focusLayerEl.appendChild(focusMaskEl);
    focusLayerEl.appendChild(focusBoxesEl);
    focusLayerEl.appendChild(focusCaptionEl);

    rewriteButtonEl = document.createElement("button");
    rewriteButtonEl.className = "dr-rewrite-button dr-hidden";
    rewriteButtonEl.type = "button";
    rewriteButtonEl.textContent = "Simplify with AI";
    rewriteButtonEl.addEventListener("click", onRewriteButtonClick);

    rewritePanelEl = document.createElement("div");
    rewritePanelEl.className = "dr-rewrite-panel dr-hidden";

    uiRoot.appendChild(tooltipEl);
    uiRoot.appendChild(focusLayerEl);
    uiRoot.appendChild(rewriteButtonEl);
    uiRoot.appendChild(rewritePanelEl);
    document.documentElement.appendChild(uiRoot);
  }

  function bindEvents() {
    document.addEventListener("mousemove", onDocumentMouseMove, true);
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("selectionchange", onSelectionChange, true);
    document.addEventListener("keydown", onDocumentKeyDown, true);
    window.addEventListener("scroll", scheduleFocusUpdate, true);
    window.addEventListener("resize", scheduleFocusUpdate, true);
    chrome.storage.onChanged.addListener(onStorageChanged);
  }

  function onStorageChanged(changes, areaName) {
    if (areaName !== "local" || !changes[shared.SETTINGS_KEY]) {
      return;
    }

    applySettings(shared.normalizeSettings(changes[shared.SETTINGS_KEY].newValue));
  }

  function applySettings(nextSettings) {
    state.settings = nextSettings;

    if (state.settings.syllableShower) {
      enableSyllableMode();
    } else {
      disableSyllableMode();
    }

    if (!state.settings.hoverDictionary) {
      hideTooltip();
    }

    if (!state.settings.sentenceHighlighting) {
      clearSentenceFocus(true);
    }

    if (!state.settings.aiRewrite) {
      hideRewriteUi();
    }
  }

  function onDocumentMouseMove(event) {
    if (!state.settings.hoverDictionary || isUiTarget(event.target)) {
      hideTooltip();
      return;
    }

    window.clearTimeout(state.hoverTimer);
    const clientX = event.clientX;
    const clientY = event.clientY;
    const token = ++state.hoverLookupToken;

    state.hoverTimer = window.setTimeout(async () => {
      const wordDetails = getWordAtPoint(clientX, clientY);

      if (!wordDetails) {
        hideTooltip();
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: "lookup-definition",
        word: wordDetails.word
      });

      if (token !== state.hoverLookupToken) {
        return;
      }

      if (!response || !response.ok || !response.definition) {
        renderTooltip({
          word: wordDetails.word,
          meaning: "No dictionary definition was found for this word."
        }, clientX, clientY);
        return;
      }

      renderTooltip(response.definition, clientX, clientY);
    }, 260);
  }

  function onDocumentClick(event) {
    if (isUiTarget(event.target)) {
      return;
    }

    if (state.settings.sentenceHighlighting && event.button === 0 && !hasActiveSelection()) {
      const sentenceDetails = getSentenceRangeFromPoint(event.clientX, event.clientY);

      if (sentenceDetails) {
        if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select")) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        activateSentenceFocus(sentenceDetails);
        return;
      }
    }

    if (!rewritePanelEl.classList.contains("dr-hidden")) {
      hideRewriteUi();
    }
  }

  function onSelectionChange() {
    if (!state.settings.aiRewrite) {
      hideRewriteUi();
      return;
    }

    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      rewriteButtonEl.classList.add("dr-hidden");
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().replace(/\s+/g, " ").trim();

    if (!selectedText || selectedText.length < 4 || isUiTarget(range.commonAncestorContainer)) {
      rewriteButtonEl.classList.add("dr-hidden");
      return;
    }

    const rect = range.getBoundingClientRect();

    if (!rect || (!rect.width && !rect.height)) {
      rewriteButtonEl.classList.add("dr-hidden");
      return;
    }

    state.lastSelectionText = selectedText;
    state.lastSelectionRect = rect;
    positionRewriteButton(rect);
  }

  function onDocumentKeyDown(event) {
    if (event.key === "Escape") {
      hideTooltip();
      hideRewriteUi();
      clearSentenceFocus(true);
    }
  }

  async function onRewriteButtonClick() {
    if (!state.lastSelectionText || state.rewriteBusy) {
      return;
    }

    state.rewriteBusy = true;
    renderRewritePanel({
      title: "Simplifying selection",
      subtitle: "This uses your configured OpenAI model.",
      body: "Working on a simpler rewrite..."
    });

    const response = await chrome.runtime.sendMessage({
      type: "rewrite-simple",
      text: state.lastSelectionText
    });

    state.rewriteBusy = false;

    if (!response || !response.ok) {
      renderRewritePanel({
        title: "Rewrite unavailable",
        subtitle: "Check your API key or model in the extension settings.",
        body: response && response.error ? response.error : "The simplification request failed.",
        error: true
      });
      return;
    }

    renderRewritePanel({
      title: "Simplified text",
      subtitle: "Generated with " + response.model,
      body: response.rewrite,
      showCopy: true
    });
  }

  function activateSentenceFocus(sentenceDetails) {
    clearSentenceFocus(false);
    state.currentSentence = sentenceDetails;
    focusLayerEl.classList.remove("dr-hidden");
    updateFocusOverlay();
    speakSentence(sentenceDetails.text);
  }

  function clearSentenceFocus(cancelSpeech) {
    state.currentSentence = null;
    focusLayerEl.classList.add("dr-hidden");
    focusBoxesEl.innerHTML = "";

    if (cancelSpeech && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function scheduleFocusUpdate() {
    if (!state.currentSentence || state.focusUpdateFrame) {
      return;
    }

    state.focusUpdateFrame = window.requestAnimationFrame(() => {
      state.focusUpdateFrame = 0;
      updateFocusOverlay();
    });
  }

  function updateFocusOverlay() {
    if (!state.currentSentence) {
      focusLayerEl.classList.add("dr-hidden");
      return;
    }

    const rects = Array.from(state.currentSentence.range.getClientRects())
      .filter((rect) => rect.width > 1 && rect.height > 1);

    if (!rects.length) {
      focusLayerEl.classList.add("dr-hidden");
      return;
    }

    focusLayerEl.classList.remove("dr-hidden");
    focusBoxesEl.innerHTML = "";

    rects.forEach((rect) => {
      const box = document.createElement("div");
      box.className = "dr-focus-box";
      box.style.left = Math.max(4, rect.left - 6) + "px";
      box.style.top = Math.max(4, rect.top - 4) + "px";
      box.style.width = Math.min(window.innerWidth - 8, rect.width + 12) + "px";
      box.style.height = rect.height + 8 + "px";
      focusBoxesEl.appendChild(box);
    });
  }

  function renderTooltip(definition, x, y) {
    tooltipEl.textContent = "";

    const title = document.createElement("div");
    title.className = "dr-tooltip-word";
    title.textContent = definition.word || "";

    if (definition.phonetic) {
      const phonetic = document.createElement("span");
      phonetic.className = "dr-tooltip-meta";
      phonetic.textContent = definition.phonetic;
      title.appendChild(phonetic);
    }

    const body = document.createElement("div");
    body.className = "dr-tooltip-body";

    if (definition.partOfSpeech) {
      const part = document.createElement("div");
      part.className = "dr-tooltip-meta";
      part.textContent = definition.partOfSpeech;
      body.appendChild(part);
    }

    const meaning = document.createElement("div");
    meaning.textContent = definition.meaning || "";
    body.appendChild(meaning);

    tooltipEl.appendChild(title);
    tooltipEl.appendChild(body);

    if (definition.example) {
      const example = document.createElement("div");
      example.className = "dr-tooltip-example";
      example.textContent = "Example: " + definition.example;
      tooltipEl.appendChild(example);
    }

    tooltipEl.classList.remove("dr-hidden");
    positionFloatingCard(tooltipEl, x + 18, y + 18);
  }

  function hideTooltip() {
    tooltipEl.classList.add("dr-hidden");
  }

  function positionRewriteButton(rect) {
    rewriteButtonEl.classList.remove("dr-hidden");
    positionFloatingCard(rewriteButtonEl, rect.right + 10, rect.bottom + 10);
  }

  function renderRewritePanel(config) {
    rewritePanelEl.textContent = "";

    const title = document.createElement("h3");
    title.className = "dr-panel-title";
    title.textContent = config.title;

    const subtitle = document.createElement("p");
    subtitle.className = "dr-panel-subtitle";
    subtitle.textContent = config.subtitle;

    const body = document.createElement("p");
    body.className = "dr-panel-text";
    if (config.error) {
      body.classList.add("dr-panel-error");
    }
    body.textContent = config.body;

    rewritePanelEl.appendChild(title);
    rewritePanelEl.appendChild(subtitle);
    rewritePanelEl.appendChild(body);

    if (config.showCopy) {
      const actions = document.createElement("div");
      actions.className = "dr-panel-actions";

      const copyButton = document.createElement("button");
      copyButton.className = "dr-panel-primary";
      copyButton.type = "button";
      copyButton.textContent = "Copy rewrite";
      copyButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText(config.body);
        copyButton.textContent = "Copied";
        window.setTimeout(() => {
          copyButton.textContent = "Copy rewrite";
        }, 1200);
      });

      const closeButton = document.createElement("button");
      closeButton.className = "dr-panel-secondary";
      closeButton.type = "button";
      closeButton.textContent = "Close";
      closeButton.addEventListener("click", hideRewriteUi);

      actions.appendChild(copyButton);
      actions.appendChild(closeButton);
      rewritePanelEl.appendChild(actions);
    }

    rewritePanelEl.classList.remove("dr-hidden");

    if (state.lastSelectionRect) {
      positionFloatingCard(rewritePanelEl, state.lastSelectionRect.left, state.lastSelectionRect.bottom + 52);
    } else {
      positionFloatingCard(rewritePanelEl, window.innerWidth - 420, 24);
    }
  }

  function hideRewriteUi() {
    rewriteButtonEl.classList.add("dr-hidden");
    rewritePanelEl.classList.add("dr-hidden");
    state.rewriteBusy = false;
  }

  function positionFloatingCard(element, preferredX, preferredY) {
    const width = element.offsetWidth || 280;
    const height = element.offsetHeight || 64;
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const maxY = Math.max(8, window.innerHeight - height - 8);
    const x = Math.max(8, Math.min(maxX, preferredX));
    const y = Math.max(8, Math.min(maxY, preferredY));

    element.style.left = x + "px";
    element.style.top = y + "px";
  }

  function getWordAtPoint(clientX, clientY) {
    const caret = getCaretPositionFromPoint(clientX, clientY);

    if (!caret || caret.node.nodeType !== Node.TEXT_NODE || !caret.node.nodeValue) {
      return null;
    }

    const text = caret.node.nodeValue;
    let index = Math.min(caret.offset, text.length - 1);

    if (index < 0) {
      return null;
    }

    if (!LETTER_PATTERN.test(text[index] || "")) {
      index -= 1;
    }

    if (index < 0 || !LETTER_PATTERN.test(text[index] || "")) {
      return null;
    }

    let start = index;
    let end = index + 1;

    while (start > 0 && LETTER_PATTERN.test(text[start - 1])) {
      start -= 1;
    }

    while (end < text.length && LETTER_PATTERN.test(text[end])) {
      end += 1;
    }

    const word = text
      .slice(start, end)
      .split(SYLLABLE_SEPARATOR)
      .join("")
      .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");

    if (word.length < 2) {
      return null;
    }

    return { word };
  }

  function getSentenceRangeFromPoint(clientX, clientY) {
    const caret = getCaretPositionFromPoint(clientX, clientY);

    if (!caret || caret.node.nodeType !== Node.TEXT_NODE || !caret.node.parentElement) {
      return null;
    }

    const container = getSentenceContainer(caret.node.parentElement);

    if (!container) {
      return null;
    }

    const fragments = collectTextFragments(container);

    if (!fragments.length) {
      return null;
    }

    const fragment = fragments.find((item) => item.node === caret.node);

    if (!fragment) {
      return null;
    }

    const text = fragments.map((item) => item.text).join("");
    const clickIndex = fragment.start + Math.min(caret.offset, fragment.text.length);
    const sentenceStart = findSentenceStart(text, clickIndex);
    const sentenceEnd = findSentenceEnd(text, clickIndex);
    const startPosition = resolvePosition(fragments, sentenceStart);
    const endPosition = resolvePosition(fragments, sentenceEnd);

    if (!startPosition || !endPosition) {
      return null;
    }

    const range = document.createRange();
    range.setStart(startPosition.node, startPosition.offset);
    range.setEnd(endPosition.node, endPosition.offset);

    const sentenceText = range.toString().split(SYLLABLE_SEPARATOR).join("").replace(/\s+/g, " ").trim();

    if (!sentenceText) {
      return null;
    }

    return { range, text: sentenceText };
  }

  function getSentenceContainer(startElement) {
    let current = startElement;

    while (current && current !== document.body) {
      if (shouldSkipElement(current)) {
        return null;
      }

      if (BLOCK_TAGS.has(current.tagName)) {
        return current;
      }

      const styles = window.getComputedStyle(current);
      if (styles.display === "block" || styles.display === "list-item" || styles.display === "table-cell") {
        return current;
      }

      current = current.parentElement;
    }

    return document.body;
  }

  function collectTextFragments(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (shouldSkipReadableTextNode(node)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const fragments = [];
    let cursor = 0;
    let node;

    while ((node = walker.nextNode())) {
      const value = node.nodeValue || "";
      fragments.push({
        node,
        text: value,
        start: cursor,
        end: cursor + value.length
      });
      cursor += value.length;
    }

    return fragments;
  }

  function findSentenceStart(text, index) {
    let cursor = Math.max(0, index);

    while (cursor > 0) {
      const char = text[cursor - 1];
      if (/[.!?]/.test(char)) {
        break;
      }
      if (char === "\n" && text[cursor - 2] === "\n") {
        break;
      }
      cursor -= 1;
    }

    while (cursor < text.length && /\s/.test(text[cursor])) {
      cursor += 1;
    }

    return cursor;
  }

  function findSentenceEnd(text, index) {
    let cursor = Math.max(0, index);

    while (cursor < text.length) {
      const char = text[cursor];
      if (/[.!?]/.test(char)) {
        cursor += 1;
        break;
      }
      if (char === "\n" && text[cursor + 1] === "\n") {
        break;
      }
      cursor += 1;
    }

    while (cursor < text.length && /["')\]]/.test(text[cursor])) {
      cursor += 1;
    }

    return cursor;
  }

  function resolvePosition(fragments, index) {
    for (let i = 0; i < fragments.length; i += 1) {
      const fragment = fragments[i];
      if (index >= fragment.start && index <= fragment.end) {
        return {
          node: fragment.node,
          offset: Math.max(0, Math.min(fragment.text.length, index - fragment.start))
        };
      }
    }

    const last = fragments[fragments.length - 1];

    if (!last) {
      return null;
    }

    return {
      node: last.node,
      offset: last.text.length
    };
  }

  function getCaretPositionFromPoint(clientX, clientY) {
    if (document.caretPositionFromPoint) {
      const caret = document.caretPositionFromPoint(clientX, clientY);
      if (caret) {
        return {
          node: caret.offsetNode,
          offset: caret.offset
        };
      }
    }

    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(clientX, clientY);
      if (range) {
        return {
          node: range.startContainer,
          offset: range.startOffset
        };
      }
    }

    return null;
  }

  function speakSentence(text) {
    if (!("speechSynthesis" in window) || !text) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = state.settings.ttsRate;

    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
      return null;
    }

    if (state.settings.voiceName) {
      const exactVoice = voices.find((voice) => voice.name === state.settings.voiceName);
      if (exactVoice) {
        return exactVoice;
      }
    }

    return voices.find((voice) => /^en/i.test(voice.lang)) || voices[0];
  }

  function enableSyllableMode() {
    if (state.syllableObserver) {
      return;
    }

    clearSentenceFocus(true);
    state.performingSyllableMutation = true;
    transformNodeTree(document.body);
    state.performingSyllableMutation = false;

    state.syllableObserver = new MutationObserver((mutations) => {
      if (state.performingSyllableMutation) {
        return;
      }

      state.performingSyllableMutation = true;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            replaceTextNodeWithSyllables(node);
            return;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (element.matches(".dr-syllable-node") || element.closest("#" + UI_ROOT_ID)) {
              return;
            }
            transformNodeTree(element);
          }
        });
      });

      state.performingSyllableMutation = false;
    });

    state.syllableObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function disableSyllableMode() {
    if (state.syllableObserver) {
      state.syllableObserver.disconnect();
      state.syllableObserver = null;
    }

    for (let i = state.syllableReplacements.length - 1; i >= 0; i -= 1) {
      const replacement = state.syllableReplacements[i];
      if (replacement.wrapper.isConnected) {
        replacement.wrapper.replaceWith(replacement.original);
      }
    }

    state.syllableReplacements = [];
  }

  function transformNodeTree(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (shouldSkipTextNode(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
      nodes.push(node);
    }

    nodes.forEach(replaceTextNodeWithSyllables);
  }

  function replaceTextNodeWithSyllables(node) {
    if (shouldSkipTextNode(node)) {
      return;
    }

    const transformedText = syllabifyText(node.nodeValue || "");

    if (!transformedText || transformedText === node.nodeValue) {
      return;
    }

    const wrapper = document.createElement("span");
    wrapper.className = "dr-syllable-node";
    wrapper.textContent = transformedText;

    node.parentNode.replaceChild(wrapper, node);
    state.syllableReplacements.push({
      wrapper,
      original: node
    });
  }

  function shouldSkipTextNode(node) {
    if (!node || !node.parentNode || !node.nodeValue || !TEXT_WORD_PATTERN.test(node.nodeValue)) {
      TEXT_WORD_PATTERN.lastIndex = 0;
      return true;
    }

    TEXT_WORD_PATTERN.lastIndex = 0;

    const parent = node.parentElement;

    if (!parent) {
      return true;
    }

    if (parent.closest(SKIP_SELECTOR)) {
      return true;
    }

    const styles = window.getComputedStyle(parent);
    return styles.display === "none" || styles.visibility === "hidden";
  }

  function syllabifyText(text) {
    return text.replace(/[A-Za-z][A-Za-z'-]{2,}/g, (word) => syllabifyWord(word));
  }

  function syllabifyWord(word) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");

    if (clean.length < 5) {
      return word;
    }

    const vowels = "aeiouy";
    const parts = [];
    let start = 0;

    for (let i = 1; i < clean.length - 1; i += 1) {
      const current = clean[i];
      const previous = clean[i - 1];
      const next = clean[i + 1];

      if (!vowels.includes(current)) {
        continue;
      }

      if (vowels.includes(previous) || vowels.includes(next)) {
        continue;
      }

      let splitIndex = i + 1;

      if (i + 2 < clean.length && !vowels.includes(clean[i + 1]) && vowels.includes(clean[i + 2])) {
        const pair = clean.slice(i + 1, i + 3);
        if (!BLENDS.has(pair)) {
          splitIndex = i + 2;
        }
      }

      if (splitIndex > start + 1 && clean.length - splitIndex > 1) {
        parts.push(word.slice(start, splitIndex));
        start = splitIndex;
      }
    }

    parts.push(word.slice(start));

    const joined = parts.filter(Boolean).join(SYLLABLE_SEPARATOR);
    return joined.includes(SYLLABLE_SEPARATOR) ? joined : word;
  }

  function shouldSkipElement(element) {
    return Boolean(element && element.closest(SKIP_SELECTOR));
  }

  function shouldSkipReadableTextNode(node) {
    if (!node || !node.parentNode || !node.nodeValue) {
      return true;
    }

    const parent = node.parentElement;

    if (!parent || parent.closest(SKIP_SELECTOR)) {
      return true;
    }

    const styles = window.getComputedStyle(parent);
    return styles.display === "none" || styles.visibility === "hidden";
  }

  function hasActiveSelection() {
    const selection = window.getSelection();
    return Boolean(selection && !selection.isCollapsed && selection.toString().trim());
  }

  function isUiTarget(target) {
    const node = target instanceof Node ? target : null;
    if (!node) {
      return false;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      return node.closest("#" + UI_ROOT_ID) !== null;
    }

    return node.parentElement ? node.parentElement.closest("#" + UI_ROOT_ID) !== null : false;
  }
}());
