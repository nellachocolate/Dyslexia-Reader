# Dyslexia Reader

`Dyslexia Reader` is a Manifest V3 browser extension for Chrome and Edge that overlays accessibility tools on top of any webpage.

## Features

- Hover dictionary: hover a word to see a quick definition.
- Sentence highlighting: click a sentence to dim the rest of the page, highlight the sentence, and read it aloud.
- Show syllables: insert `·` separators using a bundled local English hyphenation source.
- Text size slider: scale page text from `80%` to `200%`.
- AI rewrite: select text, click `Simplify with AI`, and get a simpler rewrite in an on-page panel.

## Configure

1. Open the extension popup.
2. Click `Open settings`.
3. Add your OpenAI API key if you want AI rewrite enabled.
4. Optionally change the model, speech rate, and preferred system voice.

## Notes

- The AI rewrite feature uses the OpenAI Responses API with the default model set to `gpt-5-mini`.
- Sentence focus uses the browser's built-in Web Speech API for text-to-speech.
- Show syllables uses a bundled local hyphenation source, so splits are approximate reading breaks rather than perfect spoken syllables.
