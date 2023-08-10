"use strict";
(() => {
  // ../node_modules/text-fragments-polyfill/src/text-fragment-utils.js
  var FRAGMENT_DIRECTIVES = ["text"];
  var BLOCK_ELEMENTS = [
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "BR",
    "DETAILS",
    "DIALOG",
    "DD",
    "DIV",
    "DL",
    "DT",
    "FIELDSET",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HGROUP",
    "HR",
    "LI",
    "MAIN",
    "NAV",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "UL",
    "TR",
    "TH",
    "TD",
    "COLGROUP",
    "COL",
    "CAPTION",
    "THEAD",
    "TBODY",
    "TFOOT"
  ];
  var BOUNDARY_CHARS = /[\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u;
  var getFragmentDirectives = (hash) => {
    const fragmentDirectivesStrings = hash.replace(/#.*?:~:(.*?)/, "$1").split(/&?text=/).filter(Boolean);
    if (!fragmentDirectivesStrings.length) {
      return {};
    } else {
      return { text: fragmentDirectivesStrings };
    }
  };
  var parseFragmentDirectives = (fragmentDirectives) => {
    const parsedFragmentDirectives = {};
    for (const [
      fragmentDirectiveType,
      fragmentDirectivesOfType
    ] of Object.entries(fragmentDirectives)) {
      if (FRAGMENT_DIRECTIVES.includes(fragmentDirectiveType)) {
        parsedFragmentDirectives[fragmentDirectiveType] = fragmentDirectivesOfType.map((fragmentDirectiveOfType) => {
          return parseTextFragmentDirective(fragmentDirectiveOfType);
        });
      }
    }
    return parsedFragmentDirectives;
  };
  var parseTextFragmentDirective = (textFragment) => {
    const TEXT_FRAGMENT = /^(?:(.+?)-,)?(?:(.+?))(?:,([^-]+?))?(?:,-(.+?))?$/;
    return {
      prefix: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT, "$1")),
      textStart: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT, "$2")),
      textEnd: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT, "$3")),
      suffix: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT, "$4"))
    };
  };
  var processTextFragmentDirective = (textFragment, documentToProcess = document) => {
    const results = [];
    const searchRange = documentToProcess.createRange();
    searchRange.selectNodeContents(documentToProcess.body);
    while (!searchRange.collapsed && results.length < 2) {
      let potentialMatch;
      if (textFragment.prefix) {
        const prefixMatch = findTextInRange(textFragment.prefix, searchRange);
        if (prefixMatch == null) {
          break;
        }
        advanceRangeStartPastOffset(
          searchRange,
          prefixMatch.startContainer,
          prefixMatch.startOffset
        );
        const matchRange = documentToProcess.createRange();
        matchRange.setStart(prefixMatch.endContainer, prefixMatch.endOffset);
        matchRange.setEnd(searchRange.endContainer, searchRange.endOffset);
        advanceRangeStartToNonWhitespace(matchRange);
        if (matchRange.collapsed) {
          break;
        }
        potentialMatch = findTextInRange(textFragment.textStart, matchRange);
        if (potentialMatch == null) {
          break;
        }
        if (potentialMatch.compareBoundaryPoints(
          Range.START_TO_START,
          matchRange
        ) !== 0) {
          continue;
        }
      } else {
        potentialMatch = findTextInRange(textFragment.textStart, searchRange);
        if (potentialMatch == null) {
          break;
        }
        advanceRangeStartPastOffset(
          searchRange,
          potentialMatch.startContainer,
          potentialMatch.startOffset
        );
      }
      if (textFragment.textEnd) {
        const textEndRange = documentToProcess.createRange();
        textEndRange.setStart(
          potentialMatch.endContainer,
          potentialMatch.endOffset
        );
        textEndRange.setEnd(searchRange.endContainer, searchRange.endOffset);
        let matchFound = false;
        while (!textEndRange.collapsed && results.length < 2) {
          const textEndMatch = findTextInRange(textFragment.textEnd, textEndRange);
          if (textEndMatch == null) {
            break;
          }
          advanceRangeStartPastOffset(
            textEndRange,
            textEndMatch.startContainer,
            textEndMatch.startOffset
          );
          potentialMatch.setEnd(
            textEndMatch.endContainer,
            textEndMatch.endOffset
          );
          if (textFragment.suffix) {
            const suffixResult = checkSuffix(
              textFragment.suffix,
              potentialMatch,
              searchRange,
              documentToProcess
            );
            if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
              break;
            } else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
              matchFound = true;
              results.push(potentialMatch.cloneRange());
              continue;
            } else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
              continue;
            }
          } else {
            matchFound = true;
            results.push(potentialMatch.cloneRange());
          }
        }
        if (!matchFound) {
          break;
        }
      } else if (textFragment.suffix) {
        const suffixResult = checkSuffix(
          textFragment.suffix,
          potentialMatch,
          searchRange,
          documentToProcess
        );
        if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
          break;
        } else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
          results.push(potentialMatch.cloneRange());
          advanceRangeStartPastOffset(
            searchRange,
            searchRange.startContainer,
            searchRange.startOffset
          );
          continue;
        } else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
          continue;
        }
      } else {
        results.push(potentialMatch.cloneRange());
      }
    }
    return results;
  };
  var CheckSuffixResult = {
    NO_SUFFIX_MATCH: 0,
    // Suffix wasn't found at all. Search should halt.
    SUFFIX_MATCH: 1,
    // The suffix matches the expectation.
    MISPLACED_SUFFIX: 2
    // The suffix was found, but not in the right place.
  };
  var checkSuffix = (suffix, potentialMatch, searchRange, documentToProcess) => {
    const suffixRange = documentToProcess.createRange();
    suffixRange.setStart(
      potentialMatch.endContainer,
      potentialMatch.endOffset
    );
    suffixRange.setEnd(searchRange.endContainer, searchRange.endOffset);
    advanceRangeStartToNonWhitespace(suffixRange);
    const suffixMatch = findTextInRange(suffix, suffixRange);
    if (suffixMatch == null) {
      return CheckSuffixResult.NO_SUFFIX_MATCH;
    }
    if (suffixMatch.compareBoundaryPoints(
      Range.START_TO_START,
      suffixRange
    ) !== 0) {
      return CheckSuffixResult.MISPLACED_SUFFIX;
    }
    return CheckSuffixResult.SUFFIX_MATCH;
  };
  var advanceRangeStartPastOffset = (range, node, offset) => {
    try {
      range.setStart(node, offset + 1);
    } catch (err) {
      range.setStartAfter(node);
    }
  };
  var advanceRangeStartToNonWhitespace = (range) => {
    const walker = makeTextNodeWalker(range);
    let node = walker.nextNode();
    while (!range.collapsed && node != null) {
      if (node !== range.startContainer) {
        range.setStart(node, 0);
      }
      if (node.textContent.length > range.startOffset) {
        const firstChar = node.textContent[range.startOffset];
        if (!firstChar.match(/\s/)) {
          return;
        }
      }
      try {
        range.setStart(node, range.startOffset + 1);
      } catch (err) {
        node = walker.nextNode();
        if (node == null) {
          range.collapse();
        } else {
          range.setStart(node, 0);
        }
      }
    }
  };
  var makeTextNodeWalker = (range) => {
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      (node) => {
        return acceptTextNodeIfVisibleInRange(node, range);
      }
    );
    return walker;
  };
  var isNodeVisible = (node) => {
    let elt = node;
    while (elt != null && !(elt instanceof HTMLElement))
      elt = elt.parentNode;
    if (elt != null) {
      const nodeStyle = window.getComputedStyle(elt);
      if (nodeStyle.visibility === "hidden" || nodeStyle.display === "none" || nodeStyle.height === 0 || nodeStyle.width === 0 || nodeStyle.opacity === 0) {
        return false;
      }
    }
    return true;
  };
  var acceptNodeIfVisibleInRange = (node, range) => {
    if (range != null && !range.intersectsNode(node))
      return NodeFilter.FILTER_REJECT;
    return isNodeVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  };
  var acceptTextNodeIfVisibleInRange = (node, range) => {
    if (range != null && !range.intersectsNode(node))
      return NodeFilter.FILTER_REJECT;
    if (!isNodeVisible(node)) {
      return NodeFilter.FILTER_REJECT;
    }
    return node.nodeType === Node.TEXT_NODE ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  };
  var getAllTextNodes = (root, range) => {
    const blocks = [];
    let tmp = [];
    const nodes = Array.from(
      getElementsIn(
        root,
        (node) => {
          return acceptNodeIfVisibleInRange(node, range);
        }
      )
    );
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        tmp.push(node);
      } else if (node instanceof HTMLElement && BLOCK_ELEMENTS.includes(node.tagName) && tmp.length > 0) {
        blocks.push(tmp);
        tmp = [];
      }
    }
    if (tmp.length > 0)
      blocks.push(tmp);
    return blocks;
  };
  var getTextContent = (nodes, startOffset, endOffset) => {
    let str = "";
    if (nodes.length === 1) {
      str = nodes[0].textContent.substring(startOffset, endOffset);
    } else {
      str = nodes[0].textContent.substring(startOffset) + nodes.slice(1, -1).reduce((s, n) => s + n.textContent, "") + nodes.slice(-1)[0].textContent.substring(0, endOffset);
    }
    return str.replace(/[\t\n\r ]+/g, " ");
  };
  function* getElementsIn(root, filter) {
    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      { acceptNode: filter }
    );
    const finishedSubtrees = /* @__PURE__ */ new Set();
    while (forwardTraverse(treeWalker, finishedSubtrees) !== null) {
      yield treeWalker.currentNode;
    }
  }
  var findTextInRange = (query, range) => {
    const textNodeLists = getAllTextNodes(range.commonAncestorContainer, range);
    const segmenter = makeNewSegmenter();
    for (const list of textNodeLists) {
      const found = findRangeFromNodeList(query, range, list, segmenter);
      if (found !== void 0)
        return found;
    }
    return void 0;
  };
  var findRangeFromNodeList = (query, range, textNodes, segmenter) => {
    if (!query || !range || !(textNodes || []).length)
      return void 0;
    const data = normalizeString(getTextContent(textNodes, 0, void 0));
    const normalizedQuery = normalizeString(query);
    let searchStart = textNodes[0] === range.startNode ? range.startOffset : 0;
    let start;
    let end;
    while (searchStart < data.length) {
      const matchIndex = data.indexOf(normalizedQuery, searchStart);
      if (matchIndex === -1)
        return void 0;
      if (isWordBounded(data, matchIndex, normalizedQuery.length, segmenter)) {
        start = getBoundaryPointAtIndex(
          matchIndex,
          textNodes,
          /* isEnd=*/
          false
        );
        end = getBoundaryPointAtIndex(
          matchIndex + normalizedQuery.length,
          textNodes,
          /* isEnd=*/
          true
        );
      }
      if (start != null && end != null) {
        const foundRange = new Range();
        foundRange.setStart(start.node, start.offset);
        foundRange.setEnd(end.node, end.offset);
        if (range.compareBoundaryPoints(Range.START_TO_START, foundRange) <= 0 && range.compareBoundaryPoints(Range.END_TO_END, foundRange) >= 0) {
          return foundRange;
        }
      }
      searchStart = matchIndex + 1;
    }
    return void 0;
  };
  var getBoundaryPointAtIndex = (index, textNodes, isEnd) => {
    let counted = 0;
    let normalizedData;
    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      if (!normalizedData)
        normalizedData = normalizeString(node.data);
      let nodeEnd = counted + normalizedData.length;
      if (isEnd)
        nodeEnd += 1;
      if (nodeEnd > index) {
        const normalizedOffset = index - counted;
        let denormalizedOffset = Math.min(index - counted, node.data.length);
        const targetSubstring = isEnd ? normalizedData.substring(0, normalizedOffset) : normalizedData.substring(normalizedOffset);
        let candidateSubstring = isEnd ? normalizeString(node.data.substring(0, denormalizedOffset)) : normalizeString(node.data.substring(denormalizedOffset));
        const direction = (isEnd ? -1 : 1) * (targetSubstring.length > candidateSubstring.length ? -1 : 1);
        while (denormalizedOffset >= 0 && denormalizedOffset <= node.data.length) {
          if (candidateSubstring.length === targetSubstring.length) {
            return { node, offset: denormalizedOffset };
          }
          denormalizedOffset += direction;
          candidateSubstring = isEnd ? normalizeString(node.data.substring(0, denormalizedOffset)) : normalizeString(node.data.substring(denormalizedOffset));
        }
      }
      counted += normalizedData.length;
      if (i + 1 < textNodes.length) {
        const nextNormalizedData = normalizeString(textNodes[i + 1].data);
        if (normalizedData.slice(-1) === " " && nextNormalizedData.slice(0, 1) === " ") {
          counted -= 1;
        }
        normalizedData = nextNormalizedData;
      }
    }
    return void 0;
  };
  var isWordBounded = (text, startPos, length, segmenter) => {
    if (startPos < 0 || startPos >= text.length || length <= 0 || startPos + length > text.length) {
      return false;
    }
    if (segmenter) {
      const segments = segmenter.segment(text);
      const startSegment = segments.containing(startPos);
      if (!startSegment)
        return false;
      if (startSegment.isWordLike && startSegment.index != startPos)
        return false;
      const endPos = startPos + length;
      const endSegment = segments.containing(endPos);
      if (endSegment && endSegment.isWordLike && endSegment.index != endPos)
        return false;
    } else {
      if (text[startPos].match(BOUNDARY_CHARS)) {
        ++startPos;
        --length;
        if (!length) {
          return false;
        }
      }
      if (text[startPos + length - 1].match(BOUNDARY_CHARS)) {
        --length;
        if (!length) {
          return false;
        }
      }
      if (startPos !== 0 && !text[startPos - 1].match(BOUNDARY_CHARS))
        return false;
      if (startPos + length !== text.length && !text[startPos + length].match(BOUNDARY_CHARS))
        return false;
    }
    return true;
  };
  var normalizeString = (str) => {
    return (str || "").normalize("NFKD").replace(/\s+/g, " ").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };
  var makeNewSegmenter = () => {
    if (Intl.Segmenter) {
      let lang = document.documentElement.lang;
      if (!lang) {
        lang = navigator.languages;
      }
      return new Intl.Segmenter(lang, { granularity: "word" });
    }
    return void 0;
  };
  var forwardTraverse = (walker, finishedSubtrees) => {
    if (!finishedSubtrees.has(walker.currentNode)) {
      const firstChild = walker.firstChild();
      if (firstChild !== null) {
        return firstChild;
      }
    }
    const nextSibling = walker.nextSibling();
    if (nextSibling !== null) {
      return nextSibling;
    }
    const parent = walker.parentNode();
    if (parent !== null) {
      finishedSubtrees.add(parent);
    }
    return parent;
  };
  if (typeof goog !== "undefined") {
    goog.declareModuleId("googleChromeLabs.textFragmentPolyfill.textFragmentUtils");
  }

  // src/getRangesForCurrentFragment.ts
  var FRAGMENT_DIRECTIVES2 = ["text"];
  function getRangesForCurrentFragment() {
    const hash = window.location.hash;
    if (!hash) {
      return void 0;
    }
    const fragmentDirectives = getFragmentDirectives(hash);
    const parsedFragmentDirectives = parseFragmentDirectives(fragmentDirectives);
    const processedFragmentDirectives = {};
    for (const [
      fragmentDirectiveType,
      fragmentDirectivesOfType
    ] of Object.entries(parsedFragmentDirectives)) {
      if (FRAGMENT_DIRECTIVES2.includes(fragmentDirectiveType)) {
        processedFragmentDirectives[fragmentDirectiveType] = fragmentDirectivesOfType.map((fragmentDirectiveOfType) => {
          const ranges = processTextFragmentDirective(
            fragmentDirectiveOfType
          );
          return ranges[0];
        });
      }
    }
    return processedFragmentDirectives;
  }
  window.getRangesForCurrentFragment = getRangesForCurrentFragment;
})();
