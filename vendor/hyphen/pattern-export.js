(function exportDyslexiaReaderHyphenPatterns() {
  const shimModule = globalThis.__drHyphenModule;

  if (shimModule && shimModule.exports) {
    globalThis.hyphenPatternsEnUs = shimModule.exports;
  }

  try {
    delete globalThis.module;
  } catch (error) {
    globalThis.module = undefined;
  }

  try {
    delete globalThis.__drHyphenModule;
  } catch (error) {
    globalThis.__drHyphenModule = undefined;
  }
})();
