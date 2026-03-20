document.addEventListener("DOMContentLoaded", async () => {
  const shared = globalThis.DyslexiaReaderShared;
  const statusEl = document.getElementById("status");
  const pageEnabledInput = document.getElementById("pageEnabled");
  const textScaleInput = document.getElementById("textScale");
  const textScaleValue = document.getElementById("textScaleValue");
  const lineSpacingInput = document.getElementById("lineSpacing");
  const lineSpacingValue = document.getElementById("lineSpacingValue");
  const wordSpacingInput = document.getElementById("wordSpacing");
  const wordSpacingValue = document.getElementById("wordSpacingValue");
  const toggleIds = [
    "hoverDictionary",
    "sentenceHighlighting",
    "sentenceTextToSpeech",
    "syllableShower",
    "aiRewrite"
  ];

  const activeTabId = await getActiveTabId();
  let settings = await shared.getStoredSettings();
  let currentPageState = activeTabId ? await getPageState(activeTabId) : null;

  pageEnabledInput.checked = Boolean(currentPageState && currentPageState.pageEnabled);
  pageEnabledInput.addEventListener("change", async () => {
    if (!activeTabId) {
      pageEnabledInput.checked = false;
      renderStatus(settings, null, "This tab does not support page controls.");
      return;
    }

    const updatedState = await sendTabMessage(activeTabId, {
      type: "set-page-enabled",
      enabled: pageEnabledInput.checked
    });

    if (!updatedState || !updatedState.ok) {
      pageEnabledInput.checked = false;
      renderStatus(settings, null, "Unable to update this page.");
      return;
    }

    currentPageState = updatedState;
    renderStatus(settings, currentPageState);
  });

  textScaleInput.value = String(settings.textScale);
  textScaleValue.textContent = settings.textScale + "%";
  textScaleInput.addEventListener("input", async () => {
    const textScale = Number(textScaleInput.value);
    textScaleValue.textContent = textScale + "%";
    settings = await shared.saveSettings({ textScale });
    renderStatus(settings, currentPageState);
  });

  lineSpacingInput.value = String(settings.lineSpacing);
  lineSpacingValue.textContent = settings.lineSpacing + "%";
  lineSpacingInput.addEventListener("input", async () => {
    const lineSpacing = Number(lineSpacingInput.value);
    lineSpacingValue.textContent = lineSpacing + "%";
    settings = await shared.saveSettings({ lineSpacing });
    renderStatus(settings, currentPageState);
  });

  wordSpacingInput.value = String(settings.wordSpacing);
  wordSpacingValue.textContent = settings.wordSpacing + "%";
  wordSpacingInput.addEventListener("input", async () => {
    const wordSpacing = Number(wordSpacingInput.value);
    wordSpacingValue.textContent = wordSpacing + "%";
    settings = await shared.saveSettings({ wordSpacing });
    renderStatus(settings, currentPageState);
  });

  toggleIds.forEach((id) => {
    const input = document.getElementById(id);
    input.checked = Boolean(settings[id]);
    input.addEventListener("change", async () => {
      settings = await shared.saveSettings({ [id]: input.checked });
      renderStatus(settings, currentPageState);
    });
  });

  document.getElementById("openOptions").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  renderStatus(settings, currentPageState);

  function renderStatus(currentSettings, currentPageState, overrideMessage) {
    if (overrideMessage) {
      statusEl.textContent = overrideMessage;
      return;
    }

    if (!currentPageState || !currentPageState.pageEnabled) {
      statusEl.textContent = "This page is off. Turn on the page toggle to use the tools here.";
      return;
    }

    statusEl.textContent = currentSettings.openAiApiKey
      ? "This page is on. AI rewrite is ready."
      : "This page is on. AI rewrite needs an OpenAI API key in settings.";
  }
});

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] && typeof tabs[0].id === "number" ? tabs[0].id : null;
}

async function getPageState(tabId) {
  const response = await sendTabMessage(tabId, { type: "get-page-state" });
  return response && response.ok ? response : null;
}

async function sendTabMessage(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    return null;
  }
}
