document.addEventListener("DOMContentLoaded", async () => {
  const shared = globalThis.DyslexiaReaderShared;
  const statusEl = document.getElementById("status");
  const toggleIds = [
    "hoverDictionary",
    "sentenceHighlighting",
    "syllableShower",
    "aiRewrite"
  ];

  const settings = await shared.getStoredSettings();
  toggleIds.forEach((id) => {
    const input = document.getElementById(id);
    input.checked = Boolean(settings[id]);
    input.addEventListener("change", async () => {
      const updated = await shared.saveSettings({ [id]: input.checked });
      renderStatus(updated);
    });
  });

  document.getElementById("openOptions").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  renderStatus(settings);

  function renderStatus(currentSettings) {
    statusEl.textContent = currentSettings.openAiApiKey
      ? "AI rewrite is ready."
      : "AI rewrite needs an OpenAI API key in settings.";
  }
});
