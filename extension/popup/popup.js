// ZenFeed popup (ZF-08 bootstrap).
// Only wires the button to ZenFeedBootstrap and shows the result.
// Preferences and the full popup are ZF-11.

(() => {
  const ERROR_MESSAGES = {
    no_tab: "Nenašel jsem aktivní kartu.",
    no_access: "ZenFeed k této stránce nemá přístup. Počkejte, až se stránka načte, zavřete tento panel a klikněte na ikonu ZenFeed znovu. Stránky jako chrome:// nepodporuje.",
    unsupported_page: "Na této stránce ZenFeed nefunguje (např. chrome://, Chrome Web Store nebo soubor).",
    injection_failed: "Do stránky se nepodařilo vložit skript. Zkuste stránku obnovit.",
    extraction_failed: "Bloky se nepodařilo načíst. Zkuste stránku obnovit.",
  };

  const button = document.getElementById("analyze");
  const status = document.getElementById("status");
  const summary = document.getElementById("summary");
  const pageTitle = document.getElementById("page-title");
  const blockCount = document.getElementById("block-count");

  function showStatus(text, isError = false) {
    status.textContent = text;
    status.classList.toggle("error", isError);
  }

  async function handleClick() {
    button.disabled = true;
    summary.hidden = true;
    showStatus("Načítám bloky…");
    try {
      const result = await globalThis.ZenFeedBootstrap.extractActiveTab(chrome);
      if (!result.ok) {
        showStatus(ERROR_MESSAGES[result.error] || ERROR_MESSAGES.extraction_failed, true);
        return;
      }
      // Page text is untrusted: textContent only.
      pageTitle.textContent = result.title || "(bez názvu)";
      blockCount.textContent = String(result.blocks.length);
      summary.hidden = false;
      showStatus(result.blocks.length ? "Hotovo." : "Na stránce jsem nenašel žádný čitelný obsah.");
    } catch (error) {
      console.error("ZenFeed: popup failed", error);
      showStatus(ERROR_MESSAGES.extraction_failed, true);
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", handleClick);
})();
