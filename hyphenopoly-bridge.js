(function initDyslexiaReaderHyphenopolyBridge() {
  const BRIDGE_FLAG = "__drHyphenopolyBridge";
  const READY_SELECTOR = ".dr-syllable-node";
  const PROCESSED_ATTR = "data-dr-hyphenated";
  const REFRESH_EVENT = "dr:hyphenopoly-refresh";
  const SOFT_HYPHEN = "\u00ad";
  const MIDDLE_DOT = "\u00b7";

  if (window[BRIDGE_FLAG]) {
    return;
  }

  const currentScript = document.currentScript;
  const extensionBase = currentScript.src.slice(0, currentScript.src.lastIndexOf("/") + 1);
  const mainDir = extensionBase + "vendor/hyphenopoly/";
  const loaderSrc = mainDir + "Hyphenopoly_Loader.js";
  const hyphenopolyConfig = {
    require: {
      "en-us": "FORCEHYPHENOPOLY"
    },
    setup: {
      selectors: {
        [READY_SELECTOR]: {
          hyphen: "\u00b7",
          minWordLength: 4
        }
      }
    },
    paths: {
      maindir: mainDir,
      patterndir: mainDir + "patterns/"
    }
  };

  window[BRIDGE_FLAG] = {
    ready: false,
    configured: false
  };

  window.addEventListener(REFRESH_EVENT, () => {
    hyphenatePending();
  });

  loadLoaderScript(loaderSrc)
    .then(() => {
      configureHyphenopoly();
      window[BRIDGE_FLAG].ready = true;
      hyphenatePending();
    })
    .catch(() => {});

  function loadLoaderScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-dr-hyphenopoly-loader="true"]');
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }

        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Hyphenopoly loader failed.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.drHyphenopolyLoader = "true";
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", () => reject(new Error("Hyphenopoly loader failed.")), { once: true });
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function configureHyphenopoly() {
    if (!window.Hyphenopoly || typeof window.Hyphenopoly.config !== "function") {
      throw new Error("Hyphenopoly loader is missing its config API.");
    }

    if (window[BRIDGE_FLAG].configured) {
      return;
    }

    window.Hyphenopoly.config(hyphenopolyConfig);
    window[BRIDGE_FLAG].configured = true;
  }

  function hyphenatePending() {
    if (!window.Hyphenopoly || !window.Hyphenopoly.hyphenators) {
      return;
    }

    const pendingElements = Array.from(
      document.querySelectorAll(READY_SELECTOR + `:not([${PROCESSED_ATTR}="true"])`)
    );

    if (!pendingElements.length) {
      return;
    }

    const htmlHyphenator = window.Hyphenopoly.hyphenators.HTML;

    if (!htmlHyphenator) {
      return;
    }

    htmlHyphenator.then((hyphenateHtml) => {
      const probeHost = createProbeHost();
      pendingElements.forEach((element) => {
        const probe = document.createElement("span");
        probe.className = READY_SELECTOR.slice(1);
        probe.lang = "en-us";
        probe.textContent = element.textContent;
        probeHost.appendChild(probe);

        hyphenateHtml(probe, READY_SELECTOR);
        element.textContent = normalizeHyphenatedText(probe.textContent);
        element.setAttribute(PROCESSED_ATTR, "true");
        probe.remove();
      });
      probeHost.remove();
    }).catch(() => {});
  }

  function normalizeHyphenatedText(text) {
    if (typeof text !== "string") {
      return text;
    }

    return text.replaceAll(SOFT_HYPHEN, MIDDLE_DOT);
  }

  function createProbeHost() {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.position = "fixed";
    host.style.left = "-99999px";
    host.style.top = "0";
    host.style.visibility = "hidden";
    host.style.pointerEvents = "none";
    host.style.whiteSpace = "normal";
    document.body.appendChild(host);
    return host;
  }
}());
