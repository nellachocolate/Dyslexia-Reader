# Exact Chrome Web Store Upload Steps

## 1. Finalize the extension package

1. Make sure the current code you want to publish is committed.
2. If you are updating an existing Chrome Web Store item, increase the version in `manifest.json`.
3. Build a ZIP file of the extension folder with `manifest.json` at the root of the ZIP.
4. Make sure the ZIP includes all packaged files, not just changed files.

## 2. Finalize your store assets

1. Prepare a 128x128 store icon.
2. Prepare at least 1 screenshot at 1280x800. Up to 5 are allowed.
3. Prepare the required small promo tile at 440x280.
4. Optionally prepare a marquee promo tile at 1400x560.

## 3. Host your privacy policy

1. Publish [privacy-policy.html](/C:/Users/Allen/Documents/Playground/docs/privacy-policy.html) at a public HTTPS URL.
2. Verify the page loads without sign-in.
3. Keep that URL stable, because you will enter it in the Chrome Web Store dashboard.

## 4. Open the Chrome Developer Dashboard

1. Go to the Chrome Web Store Developer Dashboard.
2. Sign in with your publisher Google account.
3. If you have not done this before, finish developer registration and 2-Step Verification setup.

## 5. Create the item

If this is your first publication for Dyslexia Reader:

1. Click `Add new item`.
2. Choose your ZIP file.
3. Upload it.

If this is an update to an existing item:

1. Open the existing Dyslexia Reader item in the dashboard.
2. Go to the `Package` tab.
3. Click `Upload New Package`.
4. Choose the new ZIP file and upload it.

## 6. Fill out the Store listing tab

1. Copy the title, short description, and long description from [chrome-web-store-listing.md](/C:/Users/Allen/Documents/Playground/docs/chrome-web-store-listing.md).
2. Set the category to `Productivity`.
3. Upload the icon, screenshots, and promo tile.
4. Add a support URL if you have one.
5. Add a homepage URL if you have one.

## 7. Fill out the Privacy practices tab

1. Copy the single purpose description from [chrome-web-store-listing.md](/C:/Users/Allen/Documents/Playground/docs/chrome-web-store-listing.md).
2. Fill out a justification for each listed permission.
3. For Remote Code, choose `No, I am not using remote code`.
4. Fill out the data use disclosures so they match the extension's actual behavior.
5. Paste your public privacy policy URL.

## 8. Fill out the Distribution tab

1. Choose whether the item should be public, unlisted, or limited to trusted testers.
2. Select regions. `All regions` is the default if you want broad availability.
3. If this is a soft launch, use testers first.

## 9. Add test instructions

1. Open the `Test instructions` tab.
2. Explain that the extension starts off on each new page.
3. Tell reviewers to open the popup and enable `Tools on this page`.
4. Tell reviewers how to test hover dictionary, sentence highlighting, the sentence TTS toggle, show syllables, text size, spacing controls, and AI rewrite.
5. Mention that AI rewrite requires a user-provided OpenAI API key.

## 10. Submit for review

1. Click `Submit for Review`.
2. In the confirmation dialog, turn off automatic publish if you want a staged launch.
3. Confirm the submission.

## 11. After approval

1. If you deferred publishing, return to the dashboard after approval.
2. Click `Publish` when you are ready.
3. Verify the live listing, screenshots, privacy policy URL, and install flow.

## 12. After publishing

1. Install the public listing once yourself from the store.
2. Verify the permissions screen and store copy are accurate.
3. Watch for review emails and user support messages from the store dashboard.
