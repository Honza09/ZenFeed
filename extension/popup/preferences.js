// ZenFeed preferences (ZF-11).
// The hide switches from docs/kategorie-mvp.md: one per topic and a separate
// one for the tone. Stored in chrome.storage.local, so they survive closing
// the popup and restarting the browser. Keys match /v1/analyze (docs/API.md).

(() => {
  if (globalThis.ZenFeedPreferences) {
    return;
  }

  const STORAGE_KEY = "zenfeed.preferences";

  // Order and names as in docs/kategorie-mvp.md. "jine" is not a switch.
  const TOPICS = [
    { key: "valka", label: "Válka" },
    { key: "politicke_konflikty", label: "Politické konflikty" },
    { key: "umrti", label: "Zprávy o úmrtí" },
    { key: "katastrofy", label: "Katastrofické scénáře" },
    { key: "nasili", label: "Násilí" },
  ];
  const TONE = { key: "toxicky", label: "Toxický/vyhrocený tón" };
  const KEYS = [...TOPICS.map((topic) => topic.key), TONE.key];

  function defaults() {
    return Object.fromEntries(KEYS.map((key) => [key, false]));
  }

  // Keeps only known keys with boolean values; anything else is off.
  // Storage can hold data from an older version or be edited by hand.
  function sanitize(stored) {
    const preferences = defaults();
    if (stored && typeof stored === "object") {
      for (const key of KEYS) {
        if (stored[key] === true) {
          preferences[key] = true;
        }
      }
    }
    return preferences;
  }

  function anySelected(preferences) {
    return KEYS.some((key) => preferences[key] === true);
  }

  async function load(chromeApi) {
    try {
      const stored = await chromeApi.storage.local.get(STORAGE_KEY);
      return sanitize(stored[STORAGE_KEY]);
    } catch (error) {
      console.error("ZenFeed: preferences could not be loaded", error);
      return defaults();
    }
  }

  async function save(chromeApi, preferences) {
    await chromeApi.storage.local.set({ [STORAGE_KEY]: sanitize(preferences) });
  }

  globalThis.ZenFeedPreferences = {
    STORAGE_KEY, TOPICS, TONE, KEYS, defaults, sanitize, anySelected, load, save,
  };
})();
