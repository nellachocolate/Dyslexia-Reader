# Dyslexia Reader v1

`Dyslexia Reader` is a Manifest V3 browser extension for Chrome and Edge that overlays accessibility tools on top of any webpage.

## Features

- Hover dictionary: hover a word to see a quick definition.
- Sentence highlighting: click a sentence to dim the rest of the page, highlight the sentence, and read it aloud.
- Syllable shower: insert `·` separators into page text using a lightweight syllable heuristic.
- AI rewrite: select text, click `Simplify with AI`, and get a simpler rewrite in an on-page panel.

## Load the extension

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
2. Turn on `Developer mode`.
3. Choose `Load unpacked`.
4. Select this folder: `C:\Users\Allen\Documents\Playground`

## Configure

1. Open the extension popup.
2. Click `Open settings`.
3. Add your OpenAI API key if you want AI rewrite enabled.
4. Optionally change the model, speech rate, and preferred system voice.

## Notes

- The AI rewrite feature uses the OpenAI Responses API with the default model set to `gpt-5-mini`.
- Sentence focus uses the browser's built-in Web Speech API for text-to-speech.
- Syllable splitting is heuristic in this v1, so some words will be split approximately rather than perfectly.
