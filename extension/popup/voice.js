// ZenFeed voice (ZF-16) and player logic (ZF-17).
// Reads the summary aloud with Chrome's speechSynthesis. Only voices that run
// on this computer (localService) are used, so the summary text never goes to
// a cloud voice (docs/rozhodnuti-zf-25.md). Only the summary is read, never
// the page text. The voice is a generic, historically styled voice without a
// character name: fallback C of docs/hlas-a-oznaceni.md, which applies until
// the team confirms option E and the trademark check is done (ZF-26).

(() => {
  if (globalThis.ZenFeedVoice) {
    return;
  }

  // Historically styled: a little slower and lower than the default voice.
  // Preferred regions first; any voice of the language is the fallback.
  const PROFILES = {
    cs: { langs: ["cs-CZ", "cs"], rate: 0.9, pitch: 0.9 },
    en: { langs: ["en-GB", "en-US", "en"], rate: 0.9, pitch: 0.9 },
  };

  // Labels from docs/hlas-a-oznaceni.md part 5: variant 1 at the player,
  // variant 3 before the first playback. Without a character name (fallback C).
  const LABELS = {
    cs: {
      player: "Syntetický hlas · shrnutí napsal stroj",
      beforePlay: "Uslyšíte syntetický hlas. Čte strojově vytvořené shrnutí, ne původní text stránky.",
    },
    // The interface stays Czech even when the summary is English.
    en: {
      player: "Syntetický hlas · shrnutí napsal stroj",
      beforePlay: "Uslyšíte syntetický hlas. Čte strojově vytvořené shrnutí, ne původní text stránky.",
    },
  };

  // macOS effect voices: local, but not usable for reading a summary.
  const EFFECT_VOICES = new Set([
    "Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos", "Good News", "Jester",
    "Organ", "Superstar", "Trinoids", "Whisper", "Wobble", "Zarvox",
  ]);

  const MAX_CHUNK_CHARS = 220;
  const VOICES_WAIT_MS = 2000;

  function languageOf(voice) {
    return String(voice.lang || "").replace("_", "-");
  }

  // The best local voice for "cs" or "en", or null. Never a remote voice.
  function pickVoice(voices, language) {
    const profile = PROFILES[language] || PROFILES.cs;
    const base = profile.langs[profile.langs.length - 1];
    const candidates = voices.filter((voice) => voice.localService === true
      && !EFFECT_VOICES.has(voice.name)
      && languageOf(voice).toLowerCase().startsWith(base.toLowerCase()));
    if (!candidates.length) {
      return null;
    }
    const rank = (voice) => {
      const region = profile.langs.findIndex((lang) => languageOf(voice).toLowerCase() === lang.toLowerCase());
      return (region === -1 ? profile.langs.length : region) * 2 + (voice.default ? 0 : 1);
    };
    return [...candidates].sort((a, b) => rank(a) - rank(b))[0];
  }

  // Splits the summary at sentence ends into chunks a voice reads reliably;
  // a sentence longer than the limit is cut at spaces.
  function splitText(text) {
    const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]*\s*/g) || [];
    const chunks = [];
    let current = "";
    for (const sentence of sentences) {
      if ((current + sentence).length <= MAX_CHUNK_CHARS) {
        current += sentence;
        continue;
      }
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = "";
      let rest = sentence;
      while (rest.length > MAX_CHUNK_CHARS) {
        const cut = rest.lastIndexOf(" ", MAX_CHUNK_CHARS);
        const at = cut > 0 ? cut : MAX_CHUNK_CHARS;
        chunks.push(rest.slice(0, at).trim());
        rest = rest.slice(at);
      }
      current = rest;
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }
    return chunks;
  }

  // Voices load asynchronously in Chrome; waits for voiceschanged once.
  function loadVoices(synth, waitMs = VOICES_WAIT_MS) {
    const now = synth.getVoices();
    if (now.length) {
      return Promise.resolve(now);
    }
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        synth.removeEventListener("voiceschanged", done);
        resolve(synth.getVoices());
      };
      const timer = setTimeout(done, waitMs);
      synth.addEventListener("voiceschanged", done);
    });
  }

  // A player for one summary text. onState({ state, error?, voice? }) gets:
  // loading, speaking, paused, ended, stopped, or error with
  // not_supported (no speechSynthesis), no_voice (no local voice for the
  // language), empty (nothing to read), not_allowed (Chrome refused speech
  // without a user click) or speech_failed.
  function createPlayer({ synth, Utterance, text, language, onState, voicesWaitMs }) {
    let chunks = [];
    let index = 0;
    let state = "idle";
    let voice = null;
    // Cancelling makes Chrome fire "interrupted"/"canceled" errors and ends;
    // the generation number makes the player ignore those old events.
    let generation = 0;

    function setState(next, extra = {}) {
      state = next;
      onState({ state: next, voice: voice ? voice.name : null, ...extra });
    }

    function speakNext(current) {
      if (current !== generation) {
        return;
      }
      if (index >= chunks.length) {
        setState("ended");
        return;
      }
      const utterance = new Utterance(chunks[index]);
      const profile = PROFILES[language] || PROFILES.cs;
      utterance.voice = voice;
      utterance.lang = languageOf(voice);
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.onend = () => {
        if (current === generation) {
          index += 1;
          speakNext(current);
        }
      };
      utterance.onerror = (event) => {
        if (current !== generation || event.error === "interrupted" || event.error === "canceled") {
          return;
        }
        console.error("ZenFeed: speech failed", event.error);
        generation += 1;
        synth.cancel();
        setState("error", { error: event.error === "not-allowed" ? "not_allowed" : "speech_failed" });
      };
      synth.speak(utterance);
    }

    async function play() {
      if (!synth || typeof Utterance !== "function") {
        setState("error", { error: "not_supported" });
        return;
      }
      if (state === "paused") {
        synth.resume();
        setState("speaking");
        return;
      }
      chunks = splitText(text || "");
      if (!chunks.length) {
        setState("error", { error: "empty" });
        return;
      }
      generation += 1;
      const current = generation;
      synth.cancel();
      setState("loading");
      const voices = await loadVoices(synth, voicesWaitMs);
      if (current !== generation) {
        return;
      }
      voice = pickVoice(voices, language);
      if (!voice) {
        setState("error", { error: "no_voice" });
        return;
      }
      index = 0;
      setState("speaking");
      speakNext(current);
    }

    function pause() {
      if (state === "speaking") {
        synth.pause();
        setState("paused");
      }
    }

    function stop() {
      if (state === "idle" || state === "stopped") {
        return;
      }
      generation += 1;
      if (synth) {
        synth.cancel();
      }
      setState("stopped");
    }

    return { play, pause, stop, getState: () => state };
  }

  globalThis.ZenFeedVoice = {
    PROFILES, LABELS, EFFECT_VOICES, pickVoice, splitText, loadVoices, createPlayer,
  };
})();