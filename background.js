importScripts("shared.js");

const {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  getStoredSettings
} = globalThis.DyslexiaReaderShared;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([SETTINGS_KEY], (items) => {
    if (!items[SETTINGS_KEY]) {
      chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then((payload) => sendResponse({ ok: true, ...payload }))
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown extension error."
      });
    });

  return true;
});

async function handleMessage(message) {
  if (!message || typeof message.type !== "string") {
    throw new Error("Unsupported message.");
  }

  if (message.type === "lookup-definition") {
    return lookupDefinition(message.word);
  }

  if (message.type === "rewrite-simple") {
    return rewriteSimpleText(message.text);
  }

  throw new Error("Unknown message type.");
}

async function lookupDefinition(word) {
  const cleanWord = sanitizeWord(word);

  if (!cleanWord) {
    return { definition: null };
  }

  const url = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(cleanWord.toLowerCase());
  const response = await fetch(url);

  if (response.status === 404) {
    return { definition: null };
  }

  if (!response.ok) {
    throw new Error("Dictionary lookup failed.");
  }

  const entries = await response.json();
  const firstEntry = Array.isArray(entries) ? entries[0] : null;

  if (!firstEntry || !Array.isArray(firstEntry.meanings) || !firstEntry.meanings.length) {
    return { definition: null };
  }

  const firstMeaning = firstEntry.meanings.find((meaning) => Array.isArray(meaning.definitions) && meaning.definitions.length);

  if (!firstMeaning) {
    return { definition: null };
  }

  return {
    definition: {
      word: firstEntry.word || cleanWord,
      phonetic: firstEntry.phonetic || "",
      partOfSpeech: firstMeaning.partOfSpeech || "",
      meaning: firstMeaning.definitions[0].definition || "No definition available.",
      example: firstMeaning.definitions[0].example || ""
    }
  };
}

async function rewriteSimpleText(text) {
  const normalizedText = typeof text === "string" ? text.trim() : "";

  if (!normalizedText) {
    throw new Error("Select some text to simplify first.");
  }

  const settings = await getStoredSettings();

  if (!settings.openAiApiKey) {
    throw new Error("Add your OpenAI API key in the extension settings first.");
  }

  const payload = {
    model: settings.aiModel,
    reasoning: {
      effort: "low"
    },
    max_output_tokens: 220,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "Rewrite the user's selected text in simpler, clearer language for an adult reader with dyslexia. Keep the original meaning, use short sentences, preserve key facts, and return only the simplified rewrite."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: normalizedText
          }
        ]
      }
    ]
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + settings.openAiApiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = data && data.error && data.error.message ? data.error.message : "OpenAI request failed.";
    throw new Error(apiError);
  }

  const rewrite = extractResponseText(data).trim();

  if (!rewrite) {
    throw new Error("The AI response did not include rewritten text.");
  }

  return {
    rewrite,
    model: settings.aiModel
  };
}

function extractResponseText(data) {
  if (!data) {
    return "";
  }

  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  if (Array.isArray(data.output)) {
    return data.output
      .flatMap((item) => Array.isArray(item.content) ? item.content : [])
      .filter((part) => part && part.type === "output_text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n\n");
  }

  if (Array.isArray(data.choices)) {
    return data.choices
      .map((choice) => choice && choice.message && typeof choice.message.content === "string" ? choice.message.content : "")
      .filter(Boolean)
      .join("\n\n");
  }

  return "";
}

function sanitizeWord(word) {
  if (typeof word !== "string") {
    return "";
  }

  return word
    .replace(/\u00b7/g, "")
    .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "")
    .trim();
}
