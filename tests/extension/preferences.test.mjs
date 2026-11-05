// Unit tests for extension/popup/preferences.js with a fake chrome.storage.
// Run from the repository root: node --test tests/extension/preferences.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/popup/preferences.js"), "utf8");

function loadPreferences() {
  const context = { console: { error() {} } };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.ZenFeedPreferences;
}

// Objects from the vm context have another Object prototype; compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));

function fakeStorage(initial = {}, { failGet = false } = {}) {
  const data = { ...initial };
  return {
    data,
    api: {
      storage: {
        local: {
          get: async (key) => {
            if (failGet) {
              throw new Error("storage unavailable");
            }
            return key in data ? { [key]: data[key] } : {};
          },
          set: async (items) => Object.assign(data, JSON.parse(JSON.stringify(items))),
        },
      },
    },
  };
}

const ALL_OFF = { valka: false, politicke_konflikty: false, umrti: false, katastrofy: false, nasili: false, toxicky: false };

test("switches match the /v1/analyze preference keys and the frozen categories", () => {
  const { KEYS, TOPICS, TONE } = loadPreferences();
  assert.deepEqual(plain(KEYS), ["valka", "politicke_konflikty", "umrti", "katastrofy", "nasili", "toxicky"]);
  assert.deepEqual(plain(TOPICS.map((topic) => topic.label)),
    ["Válka", "Politické konflikty", "Zprávy o úmrtí", "Katastrofické scénáře", "Násilí"]);
  assert.equal(TONE.label, "Toxický/vyhrocený tón");
});

test("everything is off by default and when nothing is stored", async () => {
  const preferences = loadPreferences();
  assert.deepEqual(plain(preferences.defaults()), ALL_OFF);
  assert.deepEqual(plain(await preferences.load(fakeStorage().api)), ALL_OFF);
  assert.equal(preferences.anySelected(preferences.defaults()), false);
});

test("saved preferences come back after reopening (survive closing the popup)", async () => {
  const preferences = loadPreferences();
  const storage = fakeStorage();
  await preferences.save(storage.api, { ...ALL_OFF, valka: true, toxicky: true });
  // A new popup instance reads the same storage.
  const reopened = loadPreferences();
  assert.deepEqual(plain(await reopened.load(storage.api)), { ...ALL_OFF, valka: true, toxicky: true });
  assert.equal(reopened.anySelected({ ...ALL_OFF, toxicky: true }), true);
});

test("unknown keys and non-boolean values from storage are ignored", async () => {
  const preferences = loadPreferences();
  const storage = fakeStorage({
    [preferences.STORAGE_KEY]: { valka: "true", umrti: 1, nasili: true, jine: true, hack: true },
  });
  assert.deepEqual(plain(await preferences.load(storage.api)), { ...ALL_OFF, nasili: true });
  for (const stored of [null, "x", 5, []]) {
    assert.deepEqual(plain(preferences.sanitize(stored)), ALL_OFF);
  }
});

test("only known keys are written", async () => {
  const preferences = loadPreferences();
  const storage = fakeStorage();
  await preferences.save(storage.api, { valka: true, extra: true });
  assert.deepEqual(storage.data[preferences.STORAGE_KEY], { ...ALL_OFF, valka: true });
});

test("a storage error falls back to all off", async () => {
  const preferences = loadPreferences();
  assert.deepEqual(plain(await preferences.load(fakeStorage({}, { failGet: true }).api)), ALL_OFF);
});
