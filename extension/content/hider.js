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
    :host { all: initial; display: block; margin: 4px 0; }
    .box {
      display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px;
      padding: 6px 10px; border: 1px dashed #8c959f; border-radius: 6px;
      background: #f6f8fa; color: #1f2328;
      font: 13px/1.4 system-ui, sans-serif;
    }
    .label { flex: 1 1 auto; }
    button {
      font: inherit; color: #0b3d91; background: none; border: 0; padding: 0;
      text-decoration: underline; cursor: pointer;
    }
    button:focus-visible { outline: 2px solid #0b3d91; outline-offset: 2px; }
    .why { flex-basis: 100%; margin: 4px 0 0; color: #59636e; }
    /* Follows the page's own background, not the browser theme. */
    :host([data-zenfeed-theme="dark"]) .box { background: #161b22; color: #e6edf3; border-color: #6e7681; }
    :host([data-zenfeed-theme="dark"]) button { color: #79c0ff; }
    :host([data-zenfeed-theme="dark"]) button:focus-visible { outline-color: #79c0ff; }
    :host([data-zenfeed-theme="dark"]) .why { color: #9198a1; }
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

    // Hides every entry that hideDecision allows. Returns counts per outcome.
    function applyHiding(entries) {
      const counts = {
        hidden: 0, alreadyHidden: 0, revealed: 0, noResult: 0, notHide: 0,
        wrapper: 0, detached: 0, unsupported: 0, failed: 0,
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
