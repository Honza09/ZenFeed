// ZenFeed segmenter (ZF-03 PoC).
// Splits the loaded page into content blocks with an ID, text and kind.
// It only reads the DOM: it never changes the page and never hides anything.
// Hiding lives elsewhere (ZF-10) and works with the block elements returned here.

(() => {
  if (globalThis.ZenFeedSegmenter) {
    return;
  }

  const LIMITS = {
    minBlockChars: 25,       // shorter groups are dropped (menu items, labels)
    minChunkChars: 120,      // smaller chunks are merged with their neighbour
    maxChunkChars: 1500,     // larger containers are split into several blocks
    maxBlockTextChars: 3000, // text of one block is truncated above this
    maxBlocks: 400,          // extraction stops after this many blocks
    maxLinkDensity: 0.8,     // above this, a block must look like a headline
    minHeadlineWords: 4,
    minHeadlineLinkChars: 12, // average link letters; menus have shorter links
    minRepeatedSiblings: 3,  // siblings with the same shape are treated as feed items
  };

  // Elements whose content is never a readable block.
  const EXCLUDED_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG", "CANVAS", "IFRAME", "OBJECT",
    "EMBED", "VIDEO", "AUDIO", "NAV", "FORM", "BUTTON", "INPUT", "SELECT",
    "TEXTAREA", "OPTION", "LABEL", "DIALOG", "MENU", "HEAD",
  ]);

  const EXCLUDED_ROLES = new Set([
    "navigation", "banner", "contentinfo", "search", "menu", "menubar",
    "toolbar", "dialog", "alertdialog", "tablist", "button", "form",
  ]);

  // Inline elements do not end a paragraph.
  const INLINE_TAGS = new Set([
    "A", "ABBR", "B", "BDI", "BDO", "BR", "CITE", "CODE", "DATA", "DFN", "EM",
    "I", "IMG", "KBD", "MARK", "Q", "S", "SAMP", "SMALL", "SPAN", "STRONG", "SUB",
    "SUP", "TIME", "U", "VAR", "WBR", "DEL", "INS", "FONT",
  ]);

  const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

  // Text-level blocks. Repeated paragraphs are prose, not feed items.
  const PARAGRAPH_TAGS = new Set([
    ...HEADING_TAGS, "P", "BLOCKQUOTE", "PRE", "DT", "DD", "FIGCAPTION", "TD", "TH",
  ]);

  const NON_INLINE_SELECTOR = `:not(${[...INLINE_TAGS].join(",").toLowerCase()})`;

  function hasBlockDescendant(element) {
    return element.querySelector(NON_INLINE_SELECTOR) !== null;
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function isExcluded(element) {
    if (EXCLUDED_TAGS.has(element.tagName.toUpperCase())) {
      return true;
    }
    const role = element.getAttribute("role");
    if (role && EXCLUDED_ROLES.has(role)) {
      return true;
    }
    if (element.hidden || element.getAttribute("aria-hidden") === "true") {
      return true;
    }
    // Text the user is writing (comment boxes, rich-text editors) is not page content (ZF-09).
    if (element.isContentEditable) {
      return true;
    }
    // The page header and footer are excluded, but not the ones inside an article.
    const tag = element.tagName;
    if ((tag === "HEADER" || tag === "FOOTER") && !element.closest("article, [role=article]")) {
      return true;
    }
    return false;
  }

  function isVisible(element) {
    if (typeof element.checkVisibility === "function") {
      return element.checkVisibility({ visibilityProperty: true, opacityProperty: true });
    }
    return element.getClientRects().length > 0;
  }

  // A paragraph-like element holds text directly or only through inline children.
  function isTextLeaf(element) {
    let hasText = false;
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent.trim()) {
          hasText = true;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (!INLINE_TAGS.has(child.tagName.toUpperCase())) {
          return false;
        }
        hasText = true;
      }
    }
    return hasText;
  }

  // Walks the DOM and collects visible paragraph-like elements in document order.
  function collectLeaves(root) {
    const leaves = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode(element) {
        if (isExcluded(element)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (INLINE_TAGS.has(element.tagName.toUpperCase())) {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    for (let element = walker.nextNode(); element; element = walker.nextNode()) {
      if (!isVisible(element)) {
        continue;
      }
      // A block element nested in an inline one is already part of that leaf.
      const previous = leaves[leaves.length - 1];
      if (previous && previous.element.contains(element)) {
        continue;
      }
      if (isTextLeaf(element)) {
        addLeaf(leaves, element, element.innerText || element.textContent || "");
      } else {
        collectInlineRuns(leaves, element);
      }
    }
    return leaves;
  }

  function addLeaf(leaves, element, rawText, links = linkStats(element)) {
    const text = normalizeText(rawText);
    if (!text || looksLikeMenu(text, links)) {
      return;
    }
    leaves.push({ element, text, links });
  }

  // Text and inline elements mixed with block children, e.g. a headline link next
  // to a perex paragraph. Each run of inline content becomes its own leaf.
  function collectInlineRuns(leaves, element) {
    let run = [];
    const flush = () => {
      const nodes = run.filter((node) => node.textContent.trim());
      run = [];
      if (!nodes.length) {
        return;
      }
      const single = nodes.length === 1 && nodes[0].nodeType === Node.ELEMENT_NODE;
      const target = single ? nodes[0] : element;
      if (single && isExcluded(target)) {
        return;
      }
      const text = nodes.map((node) => node.innerText ?? node.textContent).join(" ");
      const links = { chars: 0, count: 0 };
      for (const node of nodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const nodeLinks = linkStats(node);
          links.chars += nodeLinks.chars;
          links.count += nodeLinks.count;
        }
      }
      addLeaf(leaves, target, text, links);
    };

    for (const child of element.childNodes) {
      // An inline wrapper around blocks is walked separately, like a block.
      const inline = child.nodeType === Node.TEXT_NODE
        || (child.nodeType === Node.ELEMENT_NODE
          && INLINE_TAGS.has(child.tagName.toUpperCase())
          && !hasBlockDescendant(child));
      if (inline) {
        run.push(child);
      } else {
        flush();
      }
    }
    flush();
  }

  // Returns { chars, count } of the link text inside the element.
  function linkStats(element) {
    const links = element.tagName === "A" ? [element] : element.querySelectorAll("a");
    let chars = 0;
    for (const link of links) {
      chars += letterCount(link.textContent || "");
    }
    return { chars, count: links.length };
  }

  // Letters and digits only, so separators like "|" do not dilute link density.
  function letterCount(text) {
    return text.replace(/[^\p{L}\p{N}]/gu, "").length;
  }

  // Mostly links: a headline is one long link, a menu is many short ones.
  function looksLikeMenu(text, links) {
    const letters = letterCount(text);
    if (!letters || links.chars / letters <= LIMITS.maxLinkDensity) {
      return false;
    }
    const wordCount = text.split(" ").filter((word) => /\p{L}/u.test(word)).length;
    const averageLinkChars = links.chars / Math.max(links.count, 1);
    return wordCount < LIMITS.minHeadlineWords || averageLinkChars < LIMITS.minHeadlineLinkChars;
  }

  function shapeOf(element) {
    return `${element.tagName}.${element.getAttribute("class") || ""}`;
  }

  // Siblings with the same tag and class, repeated several times, are feed items.
  function createRepeatedSiblingCheck() {
    const cache = new WeakMap();
    return (element) => {
      const parent = element.parentElement;
      if (!parent) {
        return false;
      }
      let counts = cache.get(parent);
      if (!counts) {
        counts = new Map();
        for (const child of parent.children) {
          const shape = shapeOf(child);
          counts.set(shape, (counts.get(shape) || 0) + 1);
        }
        cache.set(parent, counts);
      }
      return (counts.get(shapeOf(element)) || 0) >= LIMITS.minRepeatedSiblings;
    };
  }

  function isCommentElement(element) {
    if (element.getAttribute("role") === "comment") {
      return true;
    }
    const itemType = element.getAttribute("itemtype") || "";
    if (/schema\.org\/Comment/i.test(itemType)) {
      return true;
    }
    const hint = `${element.id} ${element.getAttribute("class") || ""} ${element.tagName}`;
    return /comment|koment|reply|discussion|diskuse/i.test(hint);
  }

  function isMainLandmark(element) {
    return element.tagName === "MAIN" || element.getAttribute("role") === "main";
  }

  // Finds the nearest element (the leaf itself or an ancestor) that should become
  // one block: an item, an article, a section or a comment. Without such an
  // element it falls back to the top-level wrapper under <main> or the root.
  function findContainer(leafElement, root, isRepeatedSibling) {
    let topLevel = root;
    for (let element = leafElement; element && element !== root; element = element.parentElement) {
      const tag = element.tagName;
      const role = element.getAttribute("role");
      if (tag === "ARTICLE" || role === "article" || role === "comment") {
        return element;
      }
      if (tag === "LI" || tag === "SECTION" || tag === "TR") {
        return element;
      }
      if (!PARAGRAPH_TAGS.has(tag) && isRepeatedSibling(element) && element.parentElement !== root) {
        return element;
      }
      if (isMainLandmark(element)) {
        break;
      }
      topLevel = element;
    }
    return topLevel === leafElement ? root : topLevel;
  }

  function kindOf(container, root, isRepeatedSibling) {
    if (container !== root) {
      for (let element = container; element && element !== root; element = element.parentElement) {
        if (isCommentElement(element)) {
          return "comment";
        }
      }
    }
    const tag = container.tagName;
    if (tag === "ARTICLE" || container.getAttribute("role") === "article") {
      return "article";
    }
    if (tag === "SECTION") {
      return "section";
    }
    if (tag === "LI" || tag === "TR"
      || (container !== root && !PARAGRAPH_TAGS.has(tag) && isRepeatedSibling(container))) {
      return "post";
    }
    return "other";
  }

  // Groups consecutive leaves by container. A container that appears again after
  // another container starts a new group, so the document order is kept.
  function groupLeaves(leaves, root, isRepeatedSibling) {
    const groups = [];
    let current = null;
    for (const leaf of leaves) {
      const container = findContainer(leaf.element, root, isRepeatedSibling);
      if (!current || current.container !== container) {
        current = { container, leaves: [] };
        groups.push(current);
      }
      current.leaves.push(leaf);
    }
    return groups;
  }

  function textLength(leaves) {
    return leaves.reduce((sum, leaf) => sum + leaf.text.length + 1, 0);
  }

  // Splits a long group into chunks, preferably before headings, then merges chunks
  // that are too small into the previous one.
  function splitGroup(group) {
    if (textLength(group.leaves) <= LIMITS.maxChunkChars) {
      return [group.leaves];
    }
    const chunks = [];
    let chunk = [];
    let size = 0;
    for (const leaf of group.leaves) {
      const startsSection = HEADING_TAGS.has(leaf.element.tagName) && size >= LIMITS.minChunkChars;
      if (chunk.length && (startsSection || size + leaf.text.length > LIMITS.maxChunkChars)) {
        chunks.push(chunk);
        chunk = [];
        size = 0;
      }
      chunk.push(leaf);
      size += leaf.text.length + 1;
    }
    if (chunk.length) {
      chunks.push(chunk);
    }

    const merged = [];
    for (const piece of chunks) {
      const previous = merged[merged.length - 1];
      if (previous && textLength(piece) < LIMITS.minChunkChars) {
        previous.push(...piece);
      } else if (previous && textLength(previous) < LIMITS.minChunkChars) {
        previous.push(...piece);
      } else {
        merged.push(piece);
      }
    }
    return merged;
  }

  function isReadable(text, links) {
    return text.length >= LIMITS.minBlockChars && !looksLikeMenu(text, links);
  }

  function findTitle(leaves) {
    const heading = leaves.find((leaf) => HEADING_TAGS.has(leaf.element.tagName));
    return heading ? heading.text.slice(0, 300) : null;
  }

  /**
   * Segments the page into blocks.
   * Returns { blocks, stats }. Each block has:
   *   id       – "zf-<n>", in document order, valid for one extraction run
   *   kind     – "article" | "section" | "comment" | "post" | "other"
   *   title    – first heading inside the block or null
   *   text     – normalized visible text (truncated to maxBlockTextChars)
   *   elements – DOM elements covered by the block (stays in the browser)
   */
  function segmentPage(root = document.body) {
    const started = performance.now();
    const stats = { leaves: 0, groups: 0, dropped: 0, truncatedBlocks: 0, limitReached: false };
    if (!root) {
      return { blocks: [], stats: { ...stats, durationMs: 0 } };
    }

    const isRepeatedSibling = createRepeatedSiblingCheck();
    const leaves = collectLeaves(root);
    const groups = groupLeaves(leaves, root, isRepeatedSibling);
    stats.leaves = leaves.length;
    stats.groups = groups.length;

    const blocks = [];
    for (const group of groups) {
      const kind = kindOf(group.container, root, isRepeatedSibling);
      const chunks = splitGroup(group);
      for (const chunk of chunks) {
        let text = chunk.map((leaf) => leaf.text).join("\n");
        const links = chunk.reduce((sum, leaf) => ({
          chars: sum.chars + leaf.links.chars,
          count: sum.count + leaf.links.count,
        }), { chars: 0, count: 0 });
        if (!isReadable(text, links)) {
          stats.dropped += 1;
          continue;
        }
        if (blocks.length >= LIMITS.maxBlocks) {
          stats.limitReached = true;
          break;
        }
        if (text.length > LIMITS.maxBlockTextChars) {
          text = text.slice(0, LIMITS.maxBlockTextChars);
          stats.truncatedBlocks += 1;
        }
        const wholeContainer = chunks.length === 1 && group.container !== root;
        blocks.push({
          id: `zf-${blocks.length}`,
          kind,
          title: findTitle(chunk),
          text,
          elements: wholeContainer ? [group.container] : chunk.map((leaf) => leaf.element),
        });
      }
      if (stats.limitReached) {
        break;
      }
    }

    stats.durationMs = Math.round(performance.now() - started);
    return { blocks, stats };
  }

  // Data that may leave the content script: no DOM references.
  function serializeBlocks(blocks) {
    return blocks.map(({ id, kind, title, text }) => ({ id, kind, title, text }));
  }

  globalThis.ZenFeedSegmenter = { segmentPage, serializeBlocks, LIMITS };
})();
