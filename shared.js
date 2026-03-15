(function initSharedScope() {
  const SETTINGS_KEY = "dyslexiaReaderSettings";

  const DEFAULT_SETTINGS = Object.freeze({
    hoverDictionary: true,
    sentenceHighlighting: true,
    syllableShower: false,
    aiRewrite: true,
    textScale: 100,
    ttsRate: 1,
    voiceName: "",
    aiModel: "gpt-5-mini",
    openAiApiKey: ""
  });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeSettings(raw) {
    const next = Object.assign({}, DEFAULT_SETTINGS, raw || {});

    next.hoverDictionary = Boolean(next.hoverDictionary);
    next.sentenceHighlighting = Boolean(next.sentenceHighlighting);
    next.syllableShower = Boolean(next.syllableShower);
    next.aiRewrite = Boolean(next.aiRewrite);
    next.textScale = Math.round(clamp(Number(next.textScale) || DEFAULT_SETTINGS.textScale, 80, 200));
    next.ttsRate = clamp(Number(next.ttsRate) || DEFAULT_SETTINGS.ttsRate, 0.7, 1.4);
    next.voiceName = typeof next.voiceName === "string" ? next.voiceName : "";
    next.aiModel = typeof next.aiModel === "string" && next.aiModel.trim()
      ? next.aiModel.trim()
      : DEFAULT_SETTINGS.aiModel;
    next.openAiApiKey = typeof next.openAiApiKey === "string" ? next.openAiApiKey.trim() : "";

    return next;
  }

  function getStoredSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([SETTINGS_KEY], (items) => {
        resolve(normalizeSettings(items[SETTINGS_KEY]));
      });
    });
  }

  function saveSettings(partial) {
    return getStoredSettings().then((current) => {
      const merged = normalizeSettings(Object.assign({}, current, partial || {}));

      return new Promise((resolve) => {
        chrome.storage.local.set({ [SETTINGS_KEY]: merged }, () => resolve(merged));
      });
    });
  }

  globalThis.DyslexiaReaderShared = {
    DEFAULT_SETTINGS,
    SETTINGS_KEY,
    getStoredSettings,
    normalizeSettings,
    saveSettings
  };
}());
