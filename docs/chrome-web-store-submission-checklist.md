# Chrome Web Store Submission Checklist

## Before the dashboard

- Turn on 2-Step Verification for the Google account that will publish the extension.
- Register the Chrome Web Store developer account and pay the one-time registration fee.
- If this is an update to an existing Chrome Web Store item, increase `version` in `manifest.json` before uploading a new package.
- Build the upload ZIP with `manifest.json` at the root of the archive.

## Store listing assets

- Prepare a 128x128 extension icon.
- Prepare at least 1 screenshot, preferably 5.
- Use screenshot sizes of 1280x800 or 640x400.
- Prepare the required small promo image at 440x280.
- Optionally prepare a marquee image at 1400x560.

## Store listing copy

- Use the title and description from [chrome-web-store-listing.md](/C:/Users/Allen/Documents/Playground/docs/chrome-web-store-listing.md).
- Keep the listing focused on one narrow purpose: accessibility reading support on webpages.
- Make sure screenshots match the actual current UI and features.
- Mention that AI rewrite requires a user-provided OpenAI API key.

## Privacy tab

- Single purpose description:
  `This extension provides accessibility reading support on webpages by helping users focus, optionally hear, define, enlarge, space, and simplify page text.`
- Permission justification for `storage`: saves extension settings locally.
- Permission justification for `tabs`: identifies and updates the active tab for the per-page on/off toggle.
- Permission justification for `<all_urls>`: reads and modifies page text only to provide the reading tools on webpages.
- Permission justification for `https://api.dictionaryapi.dev/*`: looks up hovered-word definitions.
- Permission justification for `https://api.openai.com/*`: sends user-selected text to OpenAI only when the user requests AI rewrite.
- Remote code: declare `No`.
- Data use: answer conservatively and make sure the dashboard answers match the actual extension behavior and the privacy policy.

## Privacy policy

- Host [privacy-policy.html](/C:/Users/Allen/Documents/Playground/docs/privacy-policy.html) at a public HTTPS URL.
- Replace the placeholder contact email before publishing.
- Make sure the policy URL you enter in the dashboard stays public and stable.

## Distribution and review

- Submit with `Publish automatically` turned off so you can stage the release.
- Review the dashboard status after submission.
- Publish manually after approval when you are ready.

## Reviewer risk checks for this extension

- The extension currently injects on `<all_urls>`, so reviewers may look closely at the single-purpose explanation and privacy disclosures.
- The listing must clearly explain why webpage text is read and modified.
- The privacy policy must clearly disclose direct sharing with `dictionaryapi.dev` and OpenAI.
- The OpenAI API key must never appear in screenshots, sample settings, or public docs.
- The AI rewrite feature should be clearly described as optional and dependent on a user-provided API key.
- Remove any permissions you do not actively need before submission.

## Suggested test instructions for reviewers

- Open any article page.
- Click the extension icon.
- Turn on `Tools on this page`.
- Test `Hover dictionary` by hovering over a word.
- Test `Sentence highlighting` by clicking a sentence, then click the same sentence again to stop.
- Test the `Sentence text-to-speech` toggle both on and off.
- Test `Show syllables` on article text.
- Test `Text size` with the slider.
- Test `Line spacing` and `Word spacing` with the spacing sliders.
- Test `AI rewrite` by selecting text and clicking `Simplify with AI`.

## Good pre-submit sanity checks

- Reload the unpacked extension and test on at least 3 sites.
- Verify all toggles still work on a newly opened tab.
- Confirm no feature silently fails when network access is unavailable.
- Confirm the options page loads and saves correctly.
- Confirm the popup text matches the store listing language.
