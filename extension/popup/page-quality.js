// ZenFeed page quality (ZF-28).
// Decides, from what the segmenter found, whether ZenFeed may hide anything on
// the page, and recognises the edge states the user must be told about. It
// never adds content to the page or invents a replacement (proposal §4.1 #5).
// Working thresholds, to be checked on the 24-page set (ZF-19, ZF-20).

(() => {
  if (globalThis.ZenFeedPageQuality) {
    return;
  }

  // Below this much readable text nothing is sent: a classification of one or
  // two sentences says little, and hiding them would leave an empty page.
  const MIN_TOTAL_CHARS = 200;
  // After hiding, less visible text than this share (or these characters)
  // means nothing relevant is left on the page.
  const NOTHING_LEFT_SHARE = 0.15;
  const NOTHING_LEFT_CHARS = 200;

  function textLength(blocks) {
    return blocks.reduce((sum, block) => sum + (typeof block.text === "string" ? block.text.length : 0), 0);
  }

  // Returns { mode, reasons, notes, totalChars }:
  //   mode "skip"   – nothing is sent or hidden (reasons: no_content, too_little_text)
  //   mode "review" – analysed, but nothing is hidden unless the user asks
  //                   (reasons: single_block: the page is one block, so hiding
  //                   it would hide the whole page)
  //   mode "normal" – analyse and hide
  //   notes: partial (block limit reached), truncated (long blocks cut)
  function assessExtraction(blocks, stats = {}) {
    const totalChars = textLength(blocks);
    const notes = [];
    if (stats && stats.limitReached === true) {
      notes.push("partial");
    }
    if (stats && Number.isInteger(stats.truncatedBlocks) && stats.truncatedBlocks > 0) {
      notes.push("truncated");
    }
    if (!blocks.length) {
      return { mode: "skip", reasons: ["no_content"], notes, totalChars };
    }
    if (totalChars < MIN_TOTAL_CHARS) {
      return { mode: "skip", reasons: ["too_little_text"], notes, totalChars };
    }
    if (blocks.length === 1) {
      return { mode: "review", reasons: ["single_block"], notes, totalChars };
    }
    return { mode: "normal", reasons: [], notes, totalChars };
  }

  // How much of the page text stays visible after hiding the given blocks.
  // Returns { visibleChars, visibleShare, nothingLeft }.
  function assessOutcome(blocks, hiddenIds) {
    const hidden = new Set(hiddenIds);
    const totalChars = textLength(blocks);
    const visibleChars = textLength(blocks.filter((block) => !hidden.has(block.id)));
    const visibleShare = totalChars ? visibleChars / totalChars : 1;
    const nothingLeft = hidden.size > 0
      && (visibleShare < NOTHING_LEFT_SHARE || visibleChars < NOTHING_LEFT_CHARS);
    return { visibleChars, visibleShare, nothingLeft };
  }

  // Blocks whose result says "hide": what review mode reports instead of hiding.
  function countMatching(results) {
    return results.filter((result) => result && result.recommended_action === "hide").length;
  }

  globalThis.ZenFeedPageQuality = {
    MIN_TOTAL_CHARS, NOTHING_LEFT_SHARE, NOTHING_LEFT_CHARS, assessExtraction, assessOutcome, countMatching,
  };
})();
