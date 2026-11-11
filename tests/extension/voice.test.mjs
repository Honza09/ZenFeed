// Unit tests for extension/popup/voice.js (ZF-16, ZF-17) with a fake speechSynthesis.
// Run from the repository root: node --test tests/extension/voice.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/popup/voice.js"), "utf8");

function loadVoice() {
  const context = { setTimeout, clearTimeout, console: { error() {} } };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.ZenFeedVoice;
}

const plain = (value) => JSON.parse(JSON.stringify(value));

// Voices like Brave on macOS (local) and headless Chrome (remote only).
const MAC_VOICES = [
  { name: "Bells", lang: "en-US", localService: true, default: false },
  { name: "Albert", lang: "en-US", localService: true, default: false },
  { name: "Samantha", lang: "en-US", localService: true, default: false },
  { name: "Daniel", lang: "en-GB", localService: true, default: false },
  { name: "Zuzana", lang: "cs-CZ", localService: true, default: true },
  { name: "Google čeština", lang: "cs-CZ", localService: false, default: false },
];
const REMOTE_ONLY = [
  { name: "Google UK English Male", lang: "en-GB", localService: false, default: false },
  { name: "Google čeština", lang: "cs-CZ", localService: false, default: false },
];

// Records utterances; speak() finishes an utterance when the test calls finish().
function fakeSynth(voices, { voicesLater = false } = {}) {
  let available = voicesLater ? [] : voices;
  const listeners = new Set();
  const synth = {
    spoken: [],
    calls: [],
    getVoices: () => available,
    addEventListener: (type, listener) => listeners.add(listener),
    removeEventListener: (type, listener) => listeners.delete(listener),
    speak(utterance) {
      synth.calls.push("speak");
      synth.spoken.push(utterance);
    },
    pause: () => synth.calls.push("pause"),
    resume: () => synth.calls.push("resume"),
    cancel() {
      synth.calls.push("cancel");
      // Chrome reports cancelled utterances as errors.
      for (const utterance of synth.spoken.splice(0)) {
        utterance.onerror?.({ error: "interrupted" });
      }
    },
    finish() {
      const utterance = synth.spoken.shift();
      utterance.onend?.();
    },
    fail(error) {
      const utterance = synth.spoken.shift();
      utterance.onerror?.({ error });
    },
    loadVoices() {
      available = voices;
      listeners.forEach((listener) => listener());
    },
  };
  return synth;
}

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

function newPlayer(voice, synth, text, language = "cs") {
  const states = [];
  const player = voice.createPlayer({
    synth, Utterance: FakeUtterance, text, language, voicesWaitMs: 50,
    onState: (update) => states.push(plain(update)),
  });
  return { player, states };
}

test("only local voices are used; remote voices are never picked", () => {
  const voice = loadVoice();
  assert.equal(voice.pickVoice(MAC_VOICES, "cs").name, "Zuzana");
  assert.equal(voice.pickVoice(REMOTE_ONLY, "cs"), null);
  assert.equal(voice.pickVoice(REMOTE_ONLY, "en"), null);
  assert.equal(voice.pickVoice([], "en"), null);
});

test("English prefers en-GB and skips macOS effect voices", () => {
  const voice = loadVoice();
  assert.equal(voice.pickVoice(MAC_VOICES, "en").name, "Daniel");
  const usOnly = MAC_VOICES.filter((item) => item.lang !== "en-GB");
  assert.equal(voice.pickVoice(usOnly, "en").name, "Samantha");
  const effectsOnly = MAC_VOICES.filter((item) => ["Bells", "Albert"].includes(item.name));
  assert.equal(voice.pickVoice(effectsOnly, "en"), null);
  // Android-style underscores in lang codes still match.
  assert.equal(voice.pickVoice([{ name: "cz", lang: "cs_CZ", localService: true }], "cs").name, "cz");
});

test("labels say synthetic voice in both languages, without a character name (fallback C)", () => {
  const { LABELS } = loadVoice();
  assert.equal(LABELS.cs.player, "Syntetický hlas · shrnutí napsal stroj");
  assert.match(LABELS.cs.beforePlay, /syntetický hlas.*ne původní text stránky/);
  assert.equal(LABELS.en.player, "Synthetic voice · summary written by AI");
  for (const text of [LABELS.cs.player, LABELS.cs.beforePlay, LABELS.en.player, LABELS.en.beforePlay]) {
    assert.doesNotMatch(text, /Švejk|Sherlock|Holmes/);
  }
});

test("text is split at sentence ends into chunks of at most 220 characters", () => {
  const { splitText } = loadVoice();
  assert.deepEqual(plain(splitText("První věta. Druhá věta! Třetí?")), ["První věta. Druhá věta! Třetí?"]);
  const long = `${"slovo ".repeat(60)}konec.`;
  const chunks = splitText(`Krátká věta. ${long} Poslední věta.`);
  assert.ok(chunks.length >= 3);
  assert.ok(chunks.every((chunk) => chunk.length <= 220));
  assert.equal(chunks.join(" ").replace(/\s+/g, " "), `Krátká věta. ${long} Poslední věta.`.replace(/\s+/g, " "));
  assert.deepEqual(plain(splitText("   ")), []);
});

test("play reads every chunk with the local voice and the styled rate and pitch, then ends", async () => {
  const voice = loadVoice();
  const synth = fakeSynth(MAC_VOICES);
  const { player, states } = newPlayer(voice, synth, "První věta. Druhá věta.");
  await player.play();
  assert.deepEqual(states.map((item) => item.state), ["loading", "speaking"]);
  assert.equal(states[1].voice, "Zuzana");
  const [utterance] = synth.spoken;
  assert.equal(utterance.voice.name, "Zuzana");
  assert.equal(utterance.lang, "cs-CZ");
  assert.equal(utterance.rate, 0.9);
  assert.equal(utterance.pitch, 0.9);
  synth.finish();
  assert.deepEqual(states.at(-1).state, "ended");
  assert.equal(player.getState(), "ended");
});

test("voices that load later are waited for", async () => {
  const voice = loadVoice();
  const synth = fakeSynth(MAC_VOICES, { voicesLater: true });
  const { player, states } = newPlayer(voice, synth, "Věta.", "en");
  const playing = player.play();
  synth.loadVoices();
  await playing;
  assert.equal(states.at(-1).state, "speaking");
  assert.equal(states.at(-1).voice, "Daniel");
});

test("pause, resume and stop", async () => {
  const voice = loadVoice();
  const synth = fakeSynth(MAC_VOICES);
  const { player, states } = newPlayer(voice, synth, "První věta. Druhá věta.");
  await player.play();
  player.pause();
  assert.equal(player.getState(), "paused");
  await player.play();
  assert.equal(player.getState(), "speaking");
  assert.ok(synth.calls.includes("pause") && synth.calls.includes("resume"));
  player.stop();
  assert.equal(player.getState(), "stopped");
  // The "interrupted" error that Chrome fires on cancel is not an error state.
  assert.ok(!states.some((item) => item.state === "error"), JSON.stringify(states));
});

test("no local voice: no_voice, nothing is spoken (the summary stays readable)", async () => {
  const voice = loadVoice();
  const synth = fakeSynth(REMOTE_ONLY);
  const { player, states } = newPlayer(voice, synth, "Věta.");
  await player.play();
  assert.deepEqual(states.at(-1), { state: "error", voice: null, error: "no_voice" });
  assert.equal(synth.spoken.length, 0);
});

test("voices never arrive: no_voice after the wait", async () => {
  const voice = loadVoice();
  const synth = fakeSynth(MAC_VOICES, { voicesLater: true });
  const { player, states } = newPlayer(voice, synth, "Věta.");
  await player.play();
  assert.equal(states.at(-1).error, "no_voice");
});

test("no speechSynthesis: not_supported", async () => {
  const voice = loadVoice();
  const states = [];
  const player = voice.createPlayer({ synth: undefined, Utterance: undefined, text: "Věta.", language: "cs", onState: (update) => states.push(update.state + ":" + update.error) });
  await player.play();
  assert.deepEqual(states, ["error:not_supported"]);
});

test("empty summary: empty, nothing is spoken", async () => {
  const voice = loadVoice();
  const synth = fakeSynth(MAC_VOICES);
  const { player, states } = newPlayer(voice, synth, "   ");
  await player.play();
  assert.equal(states.at(-1).error, "empty");
  assert.equal(synth.spoken.length, 0);
});

test("a speech error stops the reading with speech_failed; retry starts again", async () => {
  const voice = loadVoice();
  const synth = fakeSynth(MAC_VOICES);
  const { player, states } = newPlayer(voice, synth, "První věta. Druhá věta.");
  await player.play();
  synth.fail("synthesis-failed");
  assert.deepEqual(states.at(-1), { state: "error", voice: "Zuzana", error: "speech_failed" });
  await player.play();
  assert.equal(player.getState(), "speaking");
});

test("speech refused without a user click: not_allowed", async () => {
  const voice = loadVoice();
  const synth = fakeSynth(MAC_VOICES);
  const { player, states } = newPlayer(voice, synth, "Věta.");
  await player.play();
  // Seen in Brave on a normal page without user activation.
  synth.fail("not-allowed");
  assert.equal(states.at(-1).error, "not_allowed");
});

test("loading the script twice keeps the first copy", () => {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const first = context.ZenFeedVoice;
  vm.runInNewContext(source, context);
  assert.equal(context.ZenFeedVoice, first);
});
