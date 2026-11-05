// ZenFeed popup (ZF-11).
// Preferences (topic × tone), "Analyzovat", "Zobrazit vše", "Znovu skrýt" and
// the number of hidden blocks. Nothing is read from or sent about the page
// until the user clicks "Analyzovat". Page text is shown only via textContent.

(() => {
  const { ZenFeedPreferences: Preferences, ZenFeedAnalyzeClient: Client, ZenFeedBootstrap: Bootstrap } = globalThis;

  // Which extraction was hidden with which preferences, so "Znovu skrýt" after
  // reopening the popup does not reuse results from other preferences.
  const LAST_ANALYSIS_KEY = "zenfeed.lastAnalysis";

  const MESSAGES = {
    no_tab: "Nenašel jsem aktivní kartu.",
    no_access: "ZenFeed k této stránce nemá přístup. Počkejte, až se stránka načte, zavřete tento panel a klikněte na ikonu ZenFeed znovu. Stránky jako chrome:// nepodporuje.",
    unsupported_page: "Na této stránce ZenFeed nefunguje (např. chrome://, Chrome Web Store nebo soubor).",
    injection_failed: "Do stránky se nepodařilo vložit skript. Zkuste stránku obnovit.",
    extraction_failed: "Bloky se nepodařilo načíst. Zkuste stránku obnovit.",
    backend_unavailable: "Server ZenFeed neběží. Spusťte ho (uvicorn, viz docs/DEVELOPMENT.md) a zkuste to znovu. Nic se neskrylo.",
    timeout: "Server ZenFeed neodpověděl včas. Zkuste to znovu. Nic se neskrylo.",
    backend_error: "Server ZenFeed vrátil chybu. Nic se neskrylo.",
    invalid_response: "Server ZenFeed vrátil neplatnou odpověď. Nic se neskrylo.",
    stale_extraction: "Stránka se mezitím znovu načetla do ZenFeedu. Klikněte na Analyzovat znovu.",
    no_extraction: "Stránka ještě nebyla analyzována. Klikněte na Analyzovat.",
    tab_unavailable: "Karta se mezitím zavřela nebo přešla na jinou stránku. Klikněte na Analyzovat znovu.",
    nothing_selected: "Vyberte aspoň jedno téma nebo tón, který chcete skrýt.",
    preferences_changed: "Nastavení se od poslední analýzy změnilo. Klikněte na Analyzovat.",
    failed: "Něco se nepovedlo. Nic se neskrylo.",
  };

  const elements = {
    form: document.getElementById("preferences"),
    topics: document.getElementById("topics"),
    tone: document.getElementById("tone"),
    analyze: document.getElementById("analyze"),
    showAll: document.getElementById("show-all"),
    rehide: document.getElementById("rehide"),
    status: document.getElementById("status"),
    newContent: document.getElementById("new-content"),
    summary: document.getElementById("summary"),
    pageTitle: document.getElementById("page-title"),
    blockCount: document.getElementById("block-count"),
    hiddenCount: document.getElementById("hidden-count"),
  };

  let preferences = Preferences.defaults();
  let busy = false;

  function showStatus(text, isError = false) {
    elements.status.textContent = text;
    elements.status.classList.toggle("error", isError);
  }

  function showError(code) {
    showStatus(MESSAGES[code] || MESSAGES.failed, true);
  }

  function setBusy(value) {
    busy = value;
    for (const button of [elements.analyze, elements.showAll, elements.rehide]) {
      button.disabled = value;
    }
  }

  function renderSwitch(container, { key, label }) {
    const wrapper = document.createElement("label");
    wrapper.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = key;
    input.checked = preferences[key];
    wrapper.append(input, document.createTextNode(` ${label}`));
    container.append(wrapper);
  }

  function renderPreferences() {
    Preferences.TOPICS.forEach((topic) => renderSwitch(elements.topics, topic));
    renderSwitch(elements.tone, Preferences.TONE);
  }

  async function handlePreferenceChange(event) {
    preferences = { ...preferences, [event.target.name]: event.target.checked };
    try {
      await Preferences.save(chrome, preferences);
    } catch (error) {
      console.error("ZenFeed: preferences could not be saved", error);
      showStatus("Nastavení se nepodařilo uložit.", true);
    }
    // Results of the last analysis were made for the old preferences.
    elements.rehide.hidden = true;
  }

  function samePreferences(a, b) {
    return Preferences.KEYS.every((key) => Boolean(a && a[key]) === Boolean(b && b[key]));
  }

  async function rememberAnalysis(tabId, extractionId) {
    try {
      await chrome.storage.local.set({ [LAST_ANALYSIS_KEY]: { tabId, extractionId, preferences } });
    } catch (error) {
      console.error("ZenFeed: last analysis could not be saved", error);
    }
  }

  async function lastAnalysis() {
    try {
      return (await chrome.storage.local.get(LAST_ANALYSIS_KEY))[LAST_ANALYSIS_KEY] || null;
    } catch {
      return null;
    }
  }

  // Shows the state of the content script in the active tab, if there is one
  // from an earlier click. Never injects anything.
  async function refreshStatus(tabId) {
    if (tabId === null) {
      return null;
    }
    const status = await Bootstrap.getStatus(chrome, tabId);
    if (!status.ok) {
      return null;
    }
    const last = await lastAnalysis();
    elements.hiddenCount.textContent = String(status.hidden);
    elements.showAll.hidden = status.hidden === 0;
    // Only for the extraction last hidden with the current preferences.
    elements.rehide.hidden = !(status.hidden === 0 && status.withResults > 0 && last
      && last.extractionId === status.extractionId && samePreferences(last.preferences, preferences));
    elements.newContent.hidden = status.newContent === 0;
    elements.newContent.textContent = status.newContent
      ? `Od poslední analýzy na stránce přibyl obsah (nové prvky: ${status.newContent}). Nic se neanalyzuje samo; klikněte na Analyzovat.`
      : "";
    return status;
  }

  function describeOutcome(blockCount, results, hiding) {
    const review = results.filter((result) => result && result.recommended_action === "review").length;
    const unsafe = hiding.wrapper + hiding.unsupported + hiding.failed;
    // Phrased as "label: number" so no Czech plural forms are needed.
    const parts = [`Skryté bloky: ${hiding.hidden} z ${blockCount}.`];
    if (review) {
      parts.push(`Nejisté, ponechané viditelné: ${review}.`);
    }
    if (unsafe) {
      parts.push(`Nešlo bezpečně skrýt, ponechané viditelné: ${unsafe}.`);
    }
    if (!hiding.hidden && !review && !unsafe) {
      parts.push("Nic na stránce neodpovídá zvoleným tématům ani tónu.");
    }
    return parts.join(" ");
  }

  async function handleAnalyze() {
    if (!Preferences.anySelected(preferences)) {
      showError("nothing_selected");
      return;
    }
    setBusy(true);
    elements.newContent.hidden = true;
    showStatus("Hledám bloky na stránce…");
    try {
      const extraction = await Bootstrap.extractActiveTab(chrome);
      if (!extraction.ok) {
        elements.summary.hidden = true;
        showError(extraction.error);
        return;
      }
      elements.pageTitle.textContent = extraction.title || "(bez názvu)";
      elements.blockCount.textContent = String(extraction.blocks.length);
      elements.hiddenCount.textContent = "0";
      elements.summary.hidden = false;
      if (!extraction.blocks.length) {
        showStatus("Na stránce jsem nenašel žádný čitelný obsah. Nic se neskrylo.");
        return;
      }

      showStatus(`Posílám bloky k analýze (${extraction.blocks.length})…`);
      const analysis = await Client.analyzeBlocks(fetch, extraction.blocks, preferences);
      if (!analysis.ok) {
        showError(analysis.error);
        return;
      }
      const applied = await Bootstrap.applyResults(chrome, extraction.tabId, extraction.extractionId, analysis.results);
      if (!applied.ok) {
        showError(applied.error);
        return;
      }
      const hiding = await Bootstrap.applyHiding(chrome, extraction.tabId, extraction.extractionId);
      if (!hiding.ok) {
        showError(hiding.error);
        return;
      }
      await rememberAnalysis(extraction.tabId, extraction.extractionId);
      showStatus(describeOutcome(extraction.blocks.length, analysis.results, hiding));
      await refreshStatus(extraction.tabId);
    } catch (error) {
      console.error("ZenFeed: analysis failed", error);
      showError("failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleShowAll() {
    setBusy(true);
    try {
      const tabId = await Bootstrap.activeTabId(chrome);
      const shown = tabId === null ? { ok: false, error: "no_tab" } : await Bootstrap.showAll(chrome, tabId);
      if (!shown.ok) {
        showError(shown.error);
        return;
      }
      showStatus(`Zobrazeno vše, obnovené bloky: ${shown.restored}. Stránka je v původním stavu.`);
      await refreshStatus(tabId);
    } catch (error) {
      console.error("ZenFeed: show all failed", error);
      showError("failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRehide() {
    setBusy(true);
    try {
      const tabId = await Bootstrap.activeTabId(chrome);
      const status = tabId === null ? null : await Bootstrap.getStatus(chrome, tabId);
      const last = await lastAnalysis();
      if (!status || !status.ok || !status.extractionId) {
        showError(status && !status.ok ? status.error : "no_extraction");
        return;
      }
      if (!last || last.extractionId !== status.extractionId || !samePreferences(last.preferences, preferences)) {
        showError("preferences_changed");
        elements.rehide.hidden = true;
        return;
      }
      const hiding = await Bootstrap.applyHiding(chrome, tabId, status.extractionId);
      if (!hiding.ok) {
        showError(hiding.error);
        return;
      }
      showStatus(`Znovu skryté bloky: ${hiding.hidden}.`);
      await refreshStatus(tabId);
    } catch (error) {
      console.error("ZenFeed: hiding again failed", error);
      showError("failed");
    } finally {
      setBusy(false);
    }
  }

  async function init() {
    preferences = await Preferences.load(chrome);
    renderPreferences();
    elements.form.addEventListener("change", handlePreferenceChange);
    elements.analyze.addEventListener("click", () => !busy && handleAnalyze());
    elements.showAll.addEventListener("click", () => !busy && handleShowAll());
    elements.rehide.addEventListener("click", () => !busy && handleRehide());

    const tabId = await Bootstrap.activeTabId(chrome);
    const status = await refreshStatus(tabId);
    if (status && status.hidden > 0) {
      showStatus(`Skryté bloky na této stránce: ${status.hidden}.`);
    }
  }

  init().catch((error) => {
    console.error("ZenFeed: popup failed to start", error);
    showError("failed");
  });
})();
