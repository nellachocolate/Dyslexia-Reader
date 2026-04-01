# Dyslexia Reader

`Dyslexia Reader` is a Manifest V3 browser extension for Chrome and Edge that adds reading-support tools on top of webpages.

## Current features

- Per-page master toggle: each newly opened page starts off until the user turns the tools on for that page.
- Hover dictionary: hover a word to see a quick English definition.
- Sentence highlighting: click a sentence to dim the rest of the page and keep the current sentence in focus.
- Sentence text-to-speech toggle: optionally read the focused sentence aloud during sentence highlighting.
- Click again to stop: clicking the same sentence again cancels focus mode and speech.
- Scroll-aware focus overlay: the sentence highlight stays aligned if the page moves while the sentence is active.
- Show syllables: insert visible `·` separators using a bundled local English hyphenation source.
- Text size slider: scale page text from `80%` to `200%`.
- Line spacing slider: increase spacing between lines for easier reading.
- Word spacing slider: increase spacing between words for easier reading.
- AI rewrite: select text, click `Simplify with AI`, and get a simpler rewrite in an on-page panel.
- Popup controls: change feature toggles from the extension popup without opening the options page.
- Options page: save the OpenAI API key, AI model, speech rate, and preferred system voice.

## Configure

1. Open the extension popup.
2. Turn on `Tools on this page` for the current tab.
3. Use the popup to adjust text size, spacing, and feature toggles.
4. Open `Open settings` if you want to add your OpenAI API key or change voice/model defaults.

## Notes

- The AI rewrite feature uses the OpenAI Responses API with the default model set to `gpt-5-mini`.
- The hover dictionary uses `dictionaryapi.dev`.
- Sentence text-to-speech uses the browser's built-in Web Speech API.
- Show syllables uses a bundled local hyphenation source, so splits are approximate reading breaks rather than perfect spoken syllables.
- The extension currently injects on `<all_urls>` and uses the popup page toggle to control whether tools are active on the current page.
