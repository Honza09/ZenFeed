// ZenFeed hider (ZF-10).
// Hides blocks the classifier marked "hide" and puts a small "Skryto: … —
// Zobrazit" box in front of them. The page text is never changed and no page
// element is removed or moved. A hidden element gets the data-zenfeed-hidden
// attribute, which a stylesheet ZenFeed adds to the document turns into
// `display: none`; removing the attribute restores the element exactly. Only
// if the page forces `display` harder than that (inline !important) is the
// element's inline style used instead. Styles are added through CSSOM, which
// page Content-Security-Policy does not block. The box lives in a shadow root,
// so page CSS does not reach it and the segmenter does not read its text.

(() => {
  if (globalThis.ZenFeedHider) {
    return;
  }

  // Display names from docs/kategorie-mvp.md (CS for the UI).
  const TOPIC_LABELS = {
    valka: "válka",
    politicke_konflikty: "politické konflikty",
    umrti: "zprávy o úmrtí",
    katastrofy: "katastrofické scénáře",
    nasili: "násilí",
  };
  const TOXIC_LABEL = "toxický/vyhrocený tón";

  // Table cells cannot be hidden without breaking the table, and a box cannot
  // stand in for them. Such blocks are not hidden (wrongly hidden is worse
  // than not hidden, docs/mvp.md F2).
  const UNSUPPORTED_TAGS = new Set(["TD", "TH", "THEAD", "TBODY", "TFOOT", "CAPTION", "COL", "COLGROUP"]);

  const BOX_MARKER = "data-zenfeed-box";
  const HIDDEN_MARKER = "data-zenfeed-hidden";
  const HIDE_CSS = `[${HIDDEN_MARKER}] { display: none !important; }`;

  // "válka", "toxický/vyhrocený tón" or both; null if nothing to name.
  function describeReason(result) {
    const parts = [];
    const topic = result.topic || result.category;
    if (TOPIC_LABELS[topic]) {
      parts.push(TOPIC_LABELS[topic]);
    }
    if (result.tone === "toxicky") {
      parts.push(TOXIC_LABEL);
    }
    return parts.length ? parts.join(" · ") : null;
  }

  // Names only what can have caused the hiding: the topic with the
  // classifier's confidence and/or the toxic tone with its score.
  function explainReason(result) {
    const parts = [];
    const topic = TOPIC_LABELS[result.topic || result.category];
    if (topic) {
      parts.push(`Téma: ${topic} (jistota ${Math.round(result.confidence * 100)} %).`);
    }
    if (result.tone === "toxicky") {
      parts.push(`Tón: toxický/vyhrocený (skóre ${Math.round(result.toxicity_score * 100)} %).`);
    }
    parts.push("Blok odpovídá tématu nebo tónu, které jste zvolili ke skrytí.");
    parts.push("Klasifikace je automatická a může se mýlit; text bloku nebyl změněn.");
    return parts.join(" ");
  }

  // Decides whether a registry entry may be hidden. Returns "hide" or the
  // reason it stays visible. Only an explicit "hide" with a nameable reason
  // hides; uncertainty ("review") never does.
  function hideDecision(entry) {
    if (!entry.result) {
      return "no_result";
    }
    if (entry.result.recommended_action !== "hide") {
      return "not_hide";
    }
    if (!describeReason(entry.result)) {
      return "not_hide";
    }
    if (entry.containsBlocks > 0) {
      return "wrapper";
    }
    const { elements } = entry.block;
    if (!elements.length || !elements.every((element) => element.isConnected)) {
      return "detached";
    }
    if (elements.some((element) => UNSUPPORTED_TAGS.has(element.tagName.toUpperCase()))) {
      return "unsupported";
    }
    return "hide";
  }

  const BOX_CSS = `
    /* In a flex or grid parent (cards, feeds) the host would shrink to its content;
       it takes the whole row instead. */
    :host {
      all: initial; display: block; margin: 8px 0; box-sizing: border-box;
      width: 100%; min-width: 0; max-width: 100%; flex: 1 1 100%; grid-column: 1 / -1;
    }
    .box {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px;
      padding: 8px 10px 8px 14px; border: 1px solid #a9cbbf; border-left: 4px solid #2c6e63;
      border-radius: 10px; background: #e4f1ec; color: #12302a;
      box-shadow: 0 2px 6px rgba(31, 82, 73, 0.18);
      font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .label { flex: 1 1 auto; display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .label::before {
      content: ""; flex: none; width: 8px; height: 8px; border-radius: 50%;
      background: #2c6e63; box-shadow: 0 0 0 3px #c4ded5;
    }
    button {
      font: inherit; text-align: left; color: #1f5249; background: none; border: 0; border-radius: 999px;
      padding: 4px 10px; cursor: pointer; transition: background-color 0.12s, color 0.12s;
    }
    button:hover { background: #cfe5dd; color: #12302a; }
    .label + button { color: #fff; background: #2c6e63; font-weight: 600; }
    .label + button:hover { background: #1f5249; color: #fff; }
    button:focus-visible { outline: 2px solid #1f5249; outline-offset: 2px; }
    .why { flex-basis: 100%; margin: 2px 0 2px 16px; color: #3f5651; }
    /* Follows the page's own background, not the browser theme. */
    :host([data-zenfeed-theme="dark"]) .box { background: #1f3330; color: #e8f3ef; border-color: #3d6b61; border-left-color: #4aa393; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5); }
    :host([data-zenfeed-theme="dark"]) .label::before { background: #4aa393; box-shadow: 0 0 0 3px #2c4a44; }
    :host([data-zenfeed-theme="dark"]) button { color: #8fd6c8; }
    :host([data-zenfeed-theme="dark"]) button:hover { background: #2c4a44; color: #e8f3ef; }
    :host([data-zenfeed-theme="dark"]) .label + button { color: #0e1f1c; background: #6fc3b3; }
    :host([data-zenfeed-theme="dark"]) .label + button:hover { background: #8fd6c8; color: #0e1f1c; }
    :host([data-zenfeed-theme="dark"]) button:focus-visible { outline-color: #8fd6c8; }
    :host([data-zenfeed-theme="dark"]) .why { color: #b3c8c2; }
  `;



  // Parses "rgb(r, g, b)" / "rgba(r, g, b, a)"; null for anything else.
  function parseRgb(value) {
    const match = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(value);
    if (!match) {
      return null;
    }
    return { r: +match[1], g: +match[2], b: +match[3], a: match[4] === undefined ? 1 : +match[4] };
  }

  // True when the first opaque background behind the element is dark.
  function hasDarkBackground(element) {
    for (let node = element; node; node = node.parentElement) {
      const color = parseRgb(getComputedStyle(node).backgroundColor);
      if (color && color.a > 0.5) {
        const luminance = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;
        return luminance < 0.4;
      }
    }
    return false;
  }

  function createHider(doc = document) {
    // One record per hidden block, keyed by its first element so the same
    // element is never hidden twice, whatever the extraction or block ID.
    const hidden = new Map();
    // Elements the user revealed with "Zobrazit"; not hidden again until the
    // next extraction.
    let revealed = new WeakSet();
    let boxStyles = null;
    let hideStyles = null;

    function boxSheet() {
      if (!boxStyles) {
        boxStyles = new CSSStyleSheet();
        boxStyles.replaceSync(BOX_CSS);
      }
      return boxStyles;
    }

    // The document-level rule is added on the first hide and removed again
    // when nothing is hidden, so "Zobrazit vše" leaves no trace.
    function addHideSheet() {
      if (!hideStyles) {
        hideStyles = new CSSStyleSheet();
        hideStyles.replaceSync(HIDE_CSS);
      }
      if (!doc.adoptedStyleSheets.includes(hideStyles)) {
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, hideStyles];
      }
    }

    function removeHideSheet() {
      if (hideStyles && doc.adoptedStyleSheets.includes(hideStyles)) {
        doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((sheet) => sheet !== hideStyles);
      }
    }

    function isHidden(element) {
      return doc.defaultView.getComputedStyle(element).display === "none";
    }

    // Returns what is needed to restore the element. Throws if the element
    // cannot be hidden, so the caller can undo the whole block.
    function hideElement(element) {
      const saved = { element, inline: false };
      element.setAttribute(HIDDEN_MARKER, "");
      if (isHidden(element)) {
        return saved;
      }
      // The page sets display with inline !important; only inline wins.
      saved.inline = true;
      saved.display = element.style.getPropertyValue("display");
      saved.priority = element.style.getPropertyPriority("display");
      saved.hadStyle = element.hasAttribute("style");
      element.style.setProperty("display", "none", "important");
      if (!isHidden(element)) {
        restoreElement(saved);
        throw new Error("element could not be hidden");
      }
      return saved;
    }

    function restoreElement(saved) {
      const { element } = saved;
      element.removeAttribute(HIDDEN_MARKER);
      if (!saved.inline) {
        return;
      }
      if (saved.display) {
        element.style.setProperty("display", saved.display, saved.priority);
      } else {
        element.style.removeProperty("display");
      }
      // An element without a style attribute gets none back, not style="".
      if (!saved.hadStyle && !element.getAttribute("style")) {
        element.removeAttribute("style");
      }
    }

    // A box that fits where the first element was: a row in a table, an
    // item in a list, a block elsewhere.
    // The box stands in for the block, so it gets the block's width and side
    // margins (read while the block is still visible); a card with its own
    // margins keeps its gap from the edge.
    function matchBlockSize(host, element) {
      const width = element.getBoundingClientRect().width;
      if (!width) {
        return;
      }
      const style = getComputedStyle(element);
      host.style.setProperty("width", `${width}px`);
      host.style.setProperty("flex", "0 1 auto");
      host.style.setProperty("margin-left", style.marginLeft);
      host.style.setProperty("margin-right", style.marginRight);
      // Where the page places the block inside a grid or flex parent (a column
      // set by a class, auto margins) the box stands in the same place.
      host.style.setProperty("grid-column", `${style.gridColumnStart} / ${style.gridColumnEnd}`);
      host.style.setProperty("justify-self", style.justifySelf);
      host.style.setProperty("align-self", style.alignSelf);
      host.style.setProperty("order", style.order);
    }

    function createBox(firstElement, result, onShow) {
      const tag = firstElement.tagName.toUpperCase();
      let outer;
      let host;
      if (tag === "TR") {
        outer = doc.createElement("tr");
        const cell = doc.createElement("td");
        cell.colSpan = Math.max(1, firstElement.cells.length);
        host = doc.createElement("div");
        cell.append(host);
        outer.append(cell);
      } else if (tag === "LI") {
        // <li> cannot hold a shadow root; the host is a <div> inside it.
        outer = doc.createElement("li");
        outer.style.setProperty("list-style", "none");
        host = doc.createElement("div");
        outer.append(host);
      } else {
        host = doc.createElement("div");
        outer = host;
      }
      outer.setAttribute(BOX_MARKER, "");
      if (outer === host) {
        matchBlockSize(host, firstElement);
      }
      if (hasDarkBackground(firstElement.parentElement || firstElement)) {
        host.setAttribute("data-zenfeed-theme", "dark");
      }

      const root = host.attachShadow({ mode: "open" });
      root.adoptedStyleSheets = [boxSheet()];
      const box = doc.createElement("div");
      box.className = "box";
      box.setAttribute("role", "note");

      const label = doc.createElement("span");
      label.className = "label";
      label.textContent = `Skryto: ${describeReason(result)}`;

      const show = doc.createElement("button");
      show.type = "button";
      show.textContent = "Zobrazit";
      show.addEventListener("click", onShow);

      const why = doc.createElement("p");
      why.className = "why";
      why.hidden = true;
      why.textContent = explainReason(result);

      const whyButton = doc.createElement("button");
      whyButton.type = "button";
      whyButton.textContent = "Proč byl tento obsah skryt?";
      whyButton.setAttribute("aria-expanded", "false");
      whyButton.addEventListener("click", () => {
        why.hidden = !why.hidden;
        whyButton.setAttribute("aria-expanded", String(!why.hidden));
      });

      box.append(label, show, whyButton, why);
      root.append(box);
      return outer;
    }

    // All or nothing: the box is built first, and if any element cannot be
    // hidden, everything done for this block is undone.
    function hideEntry(entry) {
      const { elements } = entry.block;
      const first = elements[0];
      const record = { elements: [], box: null };
      record.box = createBox(first, entry.result, () => {
        restoreRecord(record);
        hidden.delete(first);
        revealed.add(first);
        if (!hidden.size) {
          removeHideSheet();
        }
      });
      addHideSheet();
      try {
        for (const element of elements) {
          record.elements.push(hideElement(element));
        }
        first.before(record.box);
      } catch (error) {
        restoreRecord(record);
        if (!hidden.size) {
          removeHideSheet();
        }
        throw error;
      }
      hidden.set(first, record);
    }

    function restoreRecord(record) {
      record.elements.forEach(restoreElement);
      record.box.remove();
    }

    // Hides every entry that hideDecision allows. Returns counts per outcome
    // and the IDs of the blocks hidden by this call (hiddenIds).
    function applyHiding(entries) {
      const counts = {
        hidden: 0, alreadyHidden: 0, revealed: 0, noResult: 0, notHide: 0,
        wrapper: 0, detached: 0, unsupported: 0, failed: 0, hiddenIds: [],
      };
      const keys = {
        no_result: "noResult", not_hide: "notHide", wrapper: "wrapper",
        detached: "detached", unsupported: "unsupported",
      };
      for (const entry of entries) {
        const decision = hideDecision(entry);
        if (decision !== "hide") {
          counts[keys[decision]] += 1;
          continue;
        }
        const first = entry.block.elements[0];
        if (hidden.has(first)) {
          counts.alreadyHidden += 1;
        } else if (revealed.has(first)) {
          counts.revealed += 1;
        } else {
          try {
            hideEntry(entry);
            counts.hidden += 1;
            counts.hiddenIds.push(entry.block.id);
          } catch (error) {
            // One odd block must not stop the others; it simply stays visible.
            console.error("ZenFeed: block could not be hidden", error);
            counts.failed += 1;
          }
        }
      }
      return counts;
    }

    // "Zobrazit vše": puts every hidden block back. Returns how many.
    function showAll() {
      const count = hidden.size;
      for (const record of hidden.values()) {
        restoreRecord(record);
      }
      hidden.clear();
      removeHideSheet();
      return count;
    }

    // A new extraction is a new explicit request; earlier "Zobrazit" clicks no longer apply.
    function forgetRevealed() {
      revealed = new WeakSet();
    }

    function hiddenCount() {
      return hidden.size;
    }

    // The box copies the block's width and placement, which depend on the
    // window width (responsive grids). After a resize the copy is read again:
    // the block is shown and hidden again within one task, so nothing is painted.
    function remeasureBoxes() {
      for (const record of hidden.values()) {
        const saved = record.elements[0];
        if (!saved || saved.inline || !record.box.shadowRoot) {
          continue;
        }
        saved.element.removeAttribute(HIDDEN_MARKER);
        try {
          matchBlockSize(record.box, saved.element);
        } finally {
          saved.element.setAttribute(HIDDEN_MARKER, "");
        }
      }
    }

    let remeasureQueued = false;
    doc.defaultView.addEventListener("resize", () => {
      if (remeasureQueued || !hidden.size) {
        return;
      }
      remeasureQueued = true;
      doc.defaultView.requestAnimationFrame(() => {
        remeasureQueued = false;
        remeasureBoxes();
      });
    });

    function isOwnNode(node) {
      const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      return Boolean(element && element.closest(`[${BOX_MARKER}]`));
    }

    return { applyHiding, showAll, forgetRevealed, hiddenCount, isOwnNode };
  }

  globalThis.ZenFeedHider = {
    createHider, hideDecision, describeReason, explainReason, parseRgb, BOX_MARKER, TOPIC_LABELS,
  };
})();
