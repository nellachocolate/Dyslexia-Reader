document.addEventListener("DOMContentLoaded", async () => {
  const shared = globalThis.DyslexiaReaderShared;
  const form = document.getElementById("settingsForm");
  const rateInput = document.getElementById("ttsRate");
  const rateValue = document.getElementById("ttsRateValue");
  const saveStatus = document.getElementById("saveStatus");
  const voiceSelect = document.getElementById("voiceName");

  const settings = await shared.getStoredSettings();
  await populateVoiceOptions(settings.voiceName);

  document.getElementById("openAiApiKey").value = settings.openAiApiKey;
  document.getElementById("aiModel").value = settings.aiModel;
  rateInput.value = String(settings.ttsRate);
  rateValue.textContent = settings.ttsRate.toFixed(1) + "x";
  voiceSelect.value = settings.voiceName;

  rateInput.addEventListener("input", () => {
    rateValue.textContent = Number(rateInput.value).toFixed(1) + "x";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    await shared.saveSettings({
      openAiApiKey: document.getElementById("openAiApiKey").value,
      aiModel: document.getElementById("aiModel").value,
      ttsRate: Number(rateInput.value),
      voiceName: voiceSelect.value
    });

    saveStatus.textContent = "Settings saved.";
    window.setTimeout(() => {
      saveStatus.textContent = "";
    }, 1600);
  });
});

async function populateVoiceOptions(selectedVoice) {
  const voiceSelect = document.getElementById("voiceName");
  const voices = await loadVoices();

  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = voice.name + " (" + voice.lang + ")";
    if (voice.name === selectedVoice) {
      option.selected = true;
    }
    voiceSelect.appendChild(option);
  });
}

function loadVoices() {
  return new Promise((resolve) => {
    const available = window.speechSynthesis.getVoices();
    if (available.length) {
      resolve(available);
      return;
    }

    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 1200);
  });
}
