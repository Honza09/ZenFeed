# Block segmentation (ZF-03 PoC)

The content script splits the already loaded page into content blocks (articles in a listing, sections, comments, feed items). Each block has an ID, text and a kind. Segmentation only reads the DOM: it does not change the page, hide anything or send data anywhere. Hiding is ZF-10, the API contract is ZF-02.

## Files

| File | Responsibility |
|---|---|
| `extension/content/segmenter.js` | Segmentation logic, exposed as `ZenFeedSegmenter.segmentPage()` and `serializeBlocks()` |
| `extension/content/block-registry.js` | Keeps the last blocks and their analysis results by ID ([`block-mapping.md`](block-mapping.md), ZF-09) |
| `extension/content/content.js` | Message handler (`extract-blocks`, `apply-results`). Injected by the popup, not declared in the manifest (ZF-08) |
| `tests/extension/fixtures/segmentation.html` | Local page with edge cases (navigation, form, hidden text, feed cards, comments, missing title, little text) |
| `tests/extension/segment-pages.mjs` | Runs the segmenter on any URL in headless Chrome and prints the blocks |

## Message

The popup injects the content scripts on the user's click ([`extension-bootstrap.md`](extension-bootstrap.md), ZF-08) and then asks them:

```js
const response = await chrome.tabs.sendMessage(tabId, { type: "zenfeed/extract-blocks" });
```

Response:

```json
{
  "ok": true,
  "extractionId": "uuid of this extraction (ZF-09)",
  "title": "Page title or null",
  "url": "https://example.com/",
  "blocks": [
    { "id": "zf-0", "kind": "article", "title": "First heading or null", "text": "Normalized visible text" }
  ],
  "stats": { "leaves": 141, "groups": 46, "dropped": 8, "truncatedBlocks": 0, "limitReached": false, "durationMs": 12 }
}
```

On failure: `{ "ok": false, "error": "extraction_failed" }`. Other message types get no response.

- `id`: `zf-<n>` in document order. It is valid for one extraction only; the next extraction assigns IDs again. Results are therefore tied to `extractionId`; see [`block-mapping.md`](block-mapping.md) (ZF-09) for `zenfeed/apply-results`.
- `kind`: `article`, `section`, `comment`, `post` (feed or list item) or `other`. It is a hint for classification, not a guarantee.
- DOM elements never leave the content script (`serializeBlocks` drops them).

This shape is a proposal for ZF-02; it changes only by agreement with Jan and Daniel.

## Algorithm

1. **Leaves.** Walk the DOM and collect visible paragraph-like elements, i.e. those that contain only text and inline elements. Inline runs mixed with blocks (a headline link next to a perex) are leaves too.
2. **Exclusions.** Skip `nav`, `form`, buttons and inputs, `contenteditable` (ZF-09), `script`/`style`, iframes and media, landmark roles (`navigation`, `banner`, `contentinfo`, `search`, `menu`, `dialog`…), the page `header`/`footer` (not the ones inside an article), and hidden elements (`hidden`, `aria-hidden`, `display:none`, `visibility:hidden`, `opacity:0`).
3. **Menus.** A leaf or block that is mostly links is dropped unless it reads like a headline: at least 4 words and links averaging at least 12 letters. Density is counted on letters only, so `|` separators do not count.
4. **Containers.** Each leaf belongs to the nearest `article`, `[role=article]`, `[role=comment]`, `li`, `section`, `tr` or repeated sibling. A repeated sibling is an element whose parent has at least 3 children with the same tag and class; paragraphs are excluded from this rule. Without such a container, the leaf belongs to the top-level wrapper under `<main>` or `<body>`. Class names are only used to detect comments, never alone to define blocks.
5. **Splitting and merging.** A container with more than 1,500 characters is split into chunks, preferably before headings. Chunks under 120 characters are merged with their neighbour. Blocks under 25 characters are dropped.
6. **Limits.** At most 400 blocks per page (`stats.limitReached`), at most 3,000 characters of text per block (`stats.truncatedBlocks`).

All limits are in `LIMITS` at the top of `segmenter.js`.

## How to test

Run the CI checks (see [`DEVELOPMENT.md`](DEVELOPMENT.md)), then run the segmenter on pages. This needs Node.js 22+ and Chrome:

```bash
node tests/extension/segment-pages.mjs "file://$PWD/tests/extension/fixtures/segmentation.html"
node tests/extension/segment-pages.mjs https://www.novinky.cz/ https://news.ycombinator.com/
```

`--full` prints the whole block text instead of a 100-character preview. The output contains page text; do not commit it.

In the extension itself, click the ZenFeed icon and **Najít bloky na stránce**; the popup injects the scripts and shows the block count. See [`extension-bootstrap.md`](extension-bootstrap.md) (ZF-08). Before ZF-08 the content script was declared in the manifest and this section described sending the message from DevTools; that no longer works because nothing is injected until the user clicks.

## Test results (1 Nov 2026)

Headless Chrome 155, `segment-pages.mjs`. These are smoke tests by the developer, not the ZF-07 evaluation on annotated pilot pages.

| Page | Type | Blocks | Result |
|---|---|---:|---|
| Local fixture | edge cases | 8 | Pass. Navigation, menu, form, footer, hidden and `aria-hidden` text excluded; 3 feed cards with headline; long article as one block (1,232 chars); 2 comments separate; `Ok.` and the 13-char block dropped; block without a heading kept; no duplicate from a block inside an inline wrapper |
| novinky.cz (homepage) | news listing | 36 | Pass. Each listed article is a block with its heading (35 of 36 have a title) |
| idnes.cz (homepage) | news listing | 80 | Pass. Articles and the live ticker items are separate blocks; one subscription banner kept as a block |
| bbc.com/news | news listing | 31 | Pass. Headlines are blocks; some top stories are grouped into one `section` block (up to 6 items) |
| news.ycombinator.com | link feed | 57 | Partial. The menu is excluded, but each story is split into two blocks (title row and points row) because HN uses two table rows per story |
| news.ycombinator.com/item?id=1 | discussion | 4 | Pass. Comments are `comment` blocks; the one-word comment `sure` is dropped |
| en.wikipedia.org/wiki/Rosetta_Stone | long article | 180 | Pass with notes. Sections split into chunks; infobox rows and references become many small `post` blocks |
| cs.wikipedia.org/wiki/Globální_oteplování | very long article | 400 | Limit reached (`limitReached: true`); the article body comes first, so the cut-off part is mostly references |
| stackoverflow.com question | Q&A | 0 | Not testable: the site returns an empty page to headless Chrome. The segmenter returns 0 blocks without an error |
| old.reddit.com | discussion | – | Not testable: blocked for headless Chrome |

Extraction time was 2 to 45 ms per page.

The message interface was checked by loading `extension/` unpacked in headless Brave (Chromium). Chrome 155 no longer allows loading extensions from the command line. `zenfeed/extract-blocks` on novinky.cz returned `ok: true` with 35 blocks, each with only `id`, `kind`, `title` and `text`. Loading the extension in desktop Chrome was not tested in this round.

## Known limitations

- Pages with an unusual layout (HN's two rows per story) split one item into two blocks. Hiding only one half would be visible; ZF-10 should hide both or neither.
- Text mixed directly with block children uses the parent element as the block element when the run has more than one node. Hiding it would hide the whole parent.
- Short comments and items under 25 characters are not blocks, so they cannot be hidden.
- Reference lists, infoboxes and tables produce many small blocks and use up the 400-block budget.
- The `comment` kind uses class and ID hints (`comment`, `koment`, `reply`, `discussion`), so an opinion piece with a "comment" class is labelled `comment` (seen on novinky.cz).
- Content in iframes, shadow DOM, canvas and not yet loaded parts of a feed is not segmented. Dynamic updates (`MutationObserver`) are out of scope for this PoC.
- `chrome://` pages, the Chrome Web Store and other restricted pages do not run content scripts; `sendMessage` then fails and the popup must show an "unsupported page" state (ZF-11, ZF-28).
- Since ZF-08 the content scripts are no longer declared in the manifest; the popup injects them on the user's click (`activeTab` + `scripting`), see [`extension-bootstrap.md`](extension-bootstrap.md).
