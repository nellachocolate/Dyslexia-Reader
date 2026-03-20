# Chrome Web Store Listing Draft

## Store title

Dyslexia Reader

## Short description

Accessibility reading tools that make webpage text easier to read and understand.

## Detailed description

Dyslexia Reader adds accessibility reading support tools to the pages you visit.

It helps users focus on text, optionally hear sentences read aloud, look up word definitions, show syllable breaks, enlarge text, adjust spacing, and rewrite selected text in simpler language.

Features include:

- Hover dictionary for quick word definitions
- Sentence highlighting with optional text-to-speech
- Show syllables with visible dot separators
- Text size controls from 80% to 200%
- Line spacing and word spacing controls
- AI rewrite for selected text using simpler wording

The extension starts turned off on each new page, so users can choose when to activate it.

The AI rewrite feature requires the user to provide their own OpenAI API key in the extension settings.

Dyslexia Reader is designed for accessibility support, especially for people with dyslexia and related reading challenges.

## Single purpose description for the Privacy tab

This extension provides accessibility reading support on webpages by helping users focus, optionally hear, define, enlarge, space, and simplify page text.

## Suggested category

Productivity

Inference: Chrome Web Store categories can change over time, but `Productivity` is the safest fit for the current feature set.

## Permission justifications for the Privacy tab

`storage`

Used to save the user's extension settings locally, including reading tool preferences, text size, voice selection, and the user's OpenAI API key.

`tabs`

Used to identify and message the active tab so the user can turn the reading tools on or off for the current page.

`<all_urls>`

Used so the extension can read and modify page text on the current webpage when the user enables the reading tools for that page.

`https://api.dictionaryapi.dev/*`

Used to fetch dictionary definitions for a word when the user hovers over that word with the hover dictionary feature enabled.

`https://api.openai.com/*`

Used to send user-selected text to OpenAI only when the user explicitly chooses the AI rewrite feature.

## Remote code declaration

No, I am not using remote code.

This extension makes network requests to external APIs for dictionary lookup and AI rewrite, but it does not download and execute remote scripts or other remotely hosted code.

## Suggested screenshots

1. Popup open on a news article showing the page toggle, spacing controls, and reading tools.
2. Sentence highlighting active on a paragraph with the focus overlay visible.
3. Hover dictionary definition card shown over a hovered word.
4. Show syllables active on an article paragraph.
5. AI rewrite panel open next to selected text.

## Small promo image concept

Use a clean browser-page mockup with one sentence highlighted and a compact tools panel on the right. Keep the image mostly graphical and avoid dense text.
