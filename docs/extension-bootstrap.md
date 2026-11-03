# Extension bootstrap and permissions (ZF-08)

The extension runs nothing on a page until the user acts. The content scripts are not declared in the manifest; the popup injects them into the active tab when the user clicks its button.

## Decision: `activeTab` + `scripting`, no declared content scripts

| Option | Permissions | Runs on pages without user action | Chrome install warning |
|---|---|---|---|
| Declared `content_scripts` on `http(s)://*/*` (ZF-03 state) | host access to all sites | Yes, on every page load | "Read and change all your data on all websites" |
| **`activeTab` + `chrome.scripting.executeScript` (chosen)** | `activeTab`, `scripting` | No | None |

Reasons:

- The proposal (§4.2) and `mvp.md` §3 require that nothing is processed or sent without user action. With declared content scripts the segmenter code was present on every page, even if idle.
- `activeTab` grants access only to the current tab and only after the user clicks the toolbar icon. No host permissions are needed.
- `scripting` is needed for `executeScript`. It gives no access to any page by itself.

`manifest.json` therefore has `"permissions": ["activeTab", "scripting"]` and no `content_scripts` or `host_permissions`. `tests/extension/bootstrap.test.mjs` fails if either is added back. `storage` stays allowed in `.github/scripts/check_extension.py` for preferences (ZF-11).

## Flow

1. The user clicks the ZenFeed icon. Chrome opens the popup and grants `activeTab` for that tab.
2. The user clicks **Najít bloky na stránce**.
3. `extension/popup/bootstrap.js` (`ZenFeedBootstrap.extractActiveTab`):
   - reads the active tab; if Chrome hides its URL it stops with `no_access`, if the URL is not `http`/`https` or it is the Chrome Web Store it stops with `unsupported_page`; in both cases nothing is injected;
   - injects `content/segmenter.js` and `content/content.js` with `chrome.scripting.executeScript`;
   - sends `zenfeed/extract-blocks` (the message from [`segmentation.md`](segmentation.md)) and checks the reply.
4. The popup shows the page title and the number of blocks with `textContent`. Nothing is sent to the backend; that is ZF-12.

Injecting again on the next click is safe: both content scripts return early if they are already loaded, and the second extraction assigns IDs again.

| Error | When | Popup message |
|---|---|---|
| `no_tab` | No active tab | Nenašel jsem aktivní kartu. |
| `no_access` | Chrome hides the tab URL: `chrome://` and `about:blank` pages, or the `activeTab` grant was dropped because the tab navigated after the icon was clicked | ZenFeed k této stránce nemá přístup. Počkejte, až se stránka načte, zavřete tento panel a klikněte na ikonu ZenFeed znovu … |
| `unsupported_page` | URL visible but not `http`/`https` (`file://`, `view-source:` …) or Chrome Web Store | Na této stránce ZenFeed nefunguje … |
| `injection_failed` | `executeScript` threw (page blocked, tab closed, grant expired) | Do stránky se nepodařilo vložit skript … |
| `extraction_failed` | Content script did not answer or the reply is invalid | Bloky se nepodařilo načíst … |

A page with no readable text returns 0 blocks and the popup says so; it is not an error.

## Files

| File | Responsibility |
|---|---|
| `extension/manifest.json` | Permissions only; no content scripts |
| `extension/popup/bootstrap.js` | URL check, injection, message, reply validation. No DOM, so Node tests can load it |
| `extension/popup/popup.html`, `popup.js`, `popup.css` | Minimal popup: one button, status, title and block count. Preferences and modes are ZF-11 |
| `tests/extension/bootstrap.test.mjs` | Unit tests with a fake `chrome` API (run in CI) |
| `tests/extension/popup-e2e.mjs` | Loads the unpacked extension in headless Brave, clicks the action and the popup button |

## How to test

```bash
node --test tests/extension/bootstrap.test.mjs
node tests/extension/popup-e2e.mjs https://www.nasa.gov/news/recently-published/ chrome://version/
node tests/extension/popup-e2e.mjs --same-tab <url> <url> ...   # one tab, navigation between pages
```

`popup-e2e.mjs` needs Node.js 22+ and Brave (or another Chromium that still accepts `--load-extension`; set `BROWSER_PATH`). Chrome 137+ ignores `--load-extension`. Local fixtures must be served over HTTP, because `file://` is unsupported by design:

```bash
python3 -m http.server 8765 --directory tests/extension/fixtures
node tests/extension/popup-e2e.mjs http://127.0.0.1:8765/segmentation.html http://127.0.0.1:8765/empty.html http://127.0.0.1:8765/no-title.html http://127.0.0.1:8765/html-title.html
```

Fixtures for the bootstrap: `empty.html` (only navigation, 0 blocks), `no-title.html` (no `<title>`), `html-title.html` (title and text that look like HTML). The script prints `elements from page text`; anything other than 0 means page text was parsed as HTML in the popup.

Use pages whose terms allow automated access, e.g. the ZF-04 pilot set ([`testing/pilot/stranky.md`](testing/pilot/stranky.md)). Hacker News forbids automated collection.

Manually in Chrome: **Load unpacked** `extension/`, open a page, click the ZenFeed icon, click **Najít bloky na stránce**. Pages opened before the extension was loaded work without reloading.

## Test results (3 Nov 2026)

Automated checks (same as CI): `ruff check backend` passed, `pytest backend` 26 passed, `check_extension.py` manifest OK, `node --check` on all extension JS OK, `node --test tests/extension/bootstrap.test.mjs` 10 of 10 passed (Node 25.9).

`popup-e2e.mjs` in headless Brave 156 (Chromium), extension loaded unpacked, action clicked through CDP `Extensions.triggerAction`, then the popup button clicked twice. Final run after the `no_access` fix:

| Page | Type | Result |
|---|---|---|
| P01 ourworldindata.org/war-and-peace | static article | Hotovo, 75 blocks |
| P02 forum.effectivealtruism.org (license post) | comments | Hotovo, 51 blocks |
| P03 nasa.gov/news/recently-published | feed | Hotovo, 26 blocks |
| P04 ourworldindata.org/latest?type=data-insight | dynamic content | Hotovo, 23 blocks |
| P05 en.wikipedia.org Talk:Russo-Ukrainian_war (oldid) | deeply nested, long | Hotovo, 49 blocks |
| P06 horydoly.cz (article, CS) | ads | Hotovo, 52 blocks |
| `segmentation.html` over HTTP | edge cases | Hotovo, 8 blocks (same as ZF-03) |
| `empty.html` | no readable text | 0 blocks, "nenašel žádný čitelný obsah" |
| `no-title.html` | missing title | Hotovo, 1 block, title "(bez názvu)" |
| `html-title.html` | HTML-like title and text | Hotovo, 1 block; the title is shown literally, 0 elements created |
| `file://` fixture, chromewebstore.google.com | restricted | `unsupported_page`, nothing injected |
| `chrome://version/`, `about:blank` | restricted, URL hidden | `no_access`, nothing injected |

On every page the second click gave the same result as the first. With `--same-tab` (one tab: fixture → no-title → `chrome://version/` → html-title → nasa.gov, icon clicked again after each navigation) every step gave the same result as in a new tab.

A separate CDP check on one page counted the extension's isolated worlds: 0 after page load, 0 after opening the popup, 1 after clicking the button, so the scripts are injected only on the user's click.

Bug found and fixed during testing: in the first run P05 showed "ZenFeed tu nefunguje". Reproduced by clicking the icon right after opening the tab (0 and 150 ms): the click lands before the navigation commits, Chrome drops the `activeTab` grant, and the tab URL stays hidden even after the page loads. The popup used to call this `unsupported_page`. It is now `no_access`, whose message tells the user to click the icon again. Rerun at 0 ms: `no_access`; clicking the icon again in the same tab without reloading gave Hotovo, 49 blocks. Unit test: `tab without URL (no activeTab grant)`.

Earlier smoke runs on the same day (before the fix) also passed on novinky.cz (36 blocks) and en.wikipedia.org/wiki/Rosetta_Stone (180 blocks).

Not tested: desktop Google Chrome with a real mouse click (Chrome no longer loads extensions from the command line; manual steps above), and `injection_failed` in a real browser (covered only by the unit test).

## Known limitations

- The `activeTab` grant ends when the tab navigates to another page. After navigation the user must click the icon again; the popup then reinjects the scripts. Clicking the icon while a navigation is still starting gives `no_access` for the same reason.
- `no_access` cannot tell a `chrome://` page from a dropped grant, because Chrome hides the URL in both cases; the message covers both.
- Pages that block extensions by enterprise policy, and PDF viewer tabs, fail with `injection_failed`.
- Only the top frame is processed (`allFrames` is not set), as in ZF-03.
- The popup is a bootstrap for ZF-09 to ZF-12; it shows only the block count, not the blocks.
