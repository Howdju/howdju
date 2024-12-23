"use strict";
(() => {
  // ../node_modules/text-fragments-polyfill/dist/fragment-generation-utils.js
  var e = ["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "BR", "DETAILS", "DIALOG", "DD", "DIV", "DL", "DT", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HGROUP", "HR", "LI", "MAIN", "NAV", "OL", "P", "PRE", "SECTION", "TABLE", "UL", "TR", "TH", "TD", "COLGROUP", "COL", "CAPTION", "THEAD", "TBODY", "TFOOT"];
  var t = /[\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u;
  var s = { NO_SUFFIX_MATCH: 0, SUFFIX_MATCH: 1, MISPLACED_SUFFIX: 2 };
  var n = (e2, t2, n2, r2) => {
    const a2 = r2.createRange();
    a2.setStart(t2.endContainer, t2.endOffset), a2.setEnd(n2.endContainer, n2.endOffset), u(a2);
    const i2 = d(e2, a2);
    return null == i2 ? s.NO_SUFFIX_MATCH : 0 !== i2.compareBoundaryPoints(Range.START_TO_START, a2) ? s.MISPLACED_SUFFIX : s.SUFFIX_MATCH;
  };
  var r = (e2, t2, s2) => {
    try {
      e2.setStart(t2, s2 + 1);
    } catch (s3) {
      e2.setStartAfter(t2);
    }
  };
  var u = (e2) => {
    const t2 = a(e2);
    let s2 = t2.nextNode();
    for (; !e2.collapsed && null != s2; ) {
      if (s2 !== e2.startContainer && e2.setStart(s2, 0), s2.textContent.length > e2.startOffset) {
        if (!s2.textContent[e2.startOffset].match(/\s/))
          return;
      }
      try {
        e2.setStart(s2, e2.startOffset + 1);
      } catch (n2) {
        s2 = t2.nextNode(), null == s2 ? e2.collapse() : e2.setStart(s2, 0);
      }
    }
  };
  var a = (e2) => document.createTreeWalker(e2.commonAncestorContainer, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, (t2) => o(t2, e2));
  var i = (e2) => {
    let t2 = e2;
    for (; null != t2 && !(t2 instanceof HTMLElement); )
      t2 = t2.parentNode;
    if (null != t2) {
      const e3 = window.getComputedStyle(t2);
      if ("hidden" === e3.visibility || "none" === e3.display || 0 === e3.height || 0 === e3.width || 0 === e3.opacity)
        return false;
    }
    return true;
  };
  var f = (e2, t2) => (null == t2 || t2.intersectsNode(e2)) && i(e2) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  var o = (e2, t2) => (null == t2 || t2.intersectsNode(e2)) && i(e2) ? e2.nodeType === Node.TEXT_NODE ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP : NodeFilter.FILTER_REJECT;
  var c = (t2, s2) => {
    const n2 = [];
    let r2 = [];
    const u2 = Array.from(function* (e2, t3) {
      const s3 = document.createTreeWalker(e2, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: t3 }), n3 = /* @__PURE__ */ new Set();
      for (; null !== E(s3, n3); )
        yield s3.currentNode;
    }(t2, (e2) => f(e2, s2)));
    for (const t3 of u2)
      t3.nodeType === Node.TEXT_NODE ? r2.push(t3) : t3 instanceof HTMLElement && e.includes(t3.tagName) && r2.length > 0 && (n2.push(r2), r2 = []);
    return r2.length > 0 && n2.push(r2), n2;
  };
  var d = (e2, t2) => {
    const s2 = c(t2.commonAncestorContainer, t2), n2 = F();
    for (const r2 of s2) {
      const s3 = h(e2, t2, r2, n2);
      if (void 0 !== s3)
        return s3;
    }
  };
  var h = (e2, t2, s2, n2) => {
    if (!e2 || !t2 || !(s2 || []).length)
      return;
    const r2 = S(((e3, t3, s3) => {
      let n3 = "";
      return n3 = 1 === e3.length ? e3[0].textContent.substring(t3, s3) : e3[0].textContent.substring(t3) + e3.slice(1, -1).reduce((e4, t4) => e4 + t4.textContent, "") + e3.slice(-1)[0].textContent.substring(0, s3), n3.replace(/[\t\n\r ]+/g, " ");
    })(s2, 0, void 0)), u2 = S(e2);
    let a2, i2, f2 = s2[0] === t2.startNode ? t2.startOffset : 0;
    for (; f2 < r2.length; ) {
      const e3 = r2.indexOf(u2, f2);
      if (-1 === e3)
        return;
      if (D(r2, e3, u2.length, n2) && (a2 = l(e3, s2, false), i2 = l(e3 + u2.length, s2, true)), null != a2 && null != i2) {
        const e4 = new Range();
        if (e4.setStart(a2.node, a2.offset), e4.setEnd(i2.node, i2.offset), t2.compareBoundaryPoints(Range.START_TO_START, e4) <= 0 && t2.compareBoundaryPoints(Range.END_TO_END, e4) >= 0)
          return e4;
      }
      f2 = e3 + 1;
    }
  };
  var l = (e2, t2, s2) => {
    let n2, r2 = 0;
    for (let u2 = 0; u2 < t2.length; u2++) {
      const a2 = t2[u2];
      n2 || (n2 = S(a2.data));
      let i2 = r2 + n2.length;
      if (s2 && (i2 += 1), i2 > e2) {
        const t3 = e2 - r2;
        let u3 = Math.min(e2 - r2, a2.data.length);
        const i3 = s2 ? n2.substring(0, t3) : n2.substring(t3);
        let f2 = S(s2 ? a2.data.substring(0, u3) : a2.data.substring(u3));
        const o2 = (s2 ? -1 : 1) * (i3.length > f2.length ? -1 : 1);
        for (; u3 >= 0 && u3 <= a2.data.length; ) {
          if (f2.length === i3.length)
            return { node: a2, offset: u3 };
          u3 += o2, f2 = S(s2 ? a2.data.substring(0, u3) : a2.data.substring(u3));
        }
      }
      if (r2 += n2.length, u2 + 1 < t2.length) {
        const e3 = S(t2[u2 + 1].data);
        " " === n2.slice(-1) && " " === e3.slice(0, 1) && (r2 -= 1), n2 = e3;
      }
    }
  };
  var D = (e2, s2, n2, r2) => {
    if (s2 < 0 || s2 >= e2.length || n2 <= 0 || s2 + n2 > e2.length)
      return false;
    if (r2) {
      const t2 = r2.segment(e2), u2 = t2.containing(s2);
      if (!u2)
        return false;
      if (u2.isWordLike && u2.index != s2)
        return false;
      const a2 = s2 + n2, i2 = t2.containing(a2);
      if (i2 && i2.isWordLike && i2.index != a2)
        return false;
    } else {
      if (e2[s2].match(t) && (++s2, !--n2))
        return false;
      if (e2[s2 + n2 - 1].match(t) && !--n2)
        return false;
      if (0 !== s2 && !e2[s2 - 1].match(t))
        return false;
      if (s2 + n2 !== e2.length && !e2[s2 + n2].match(t))
        return false;
    }
    return true;
  };
  var S = (e2) => (e2 || "").normalize("NFKD").replace(/\s+/g, " ").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  var F = () => {
    if (Intl.Segmenter) {
      let e2 = document.documentElement.lang;
      return e2 || (e2 = navigator.languages), new Intl.Segmenter(e2, { granularity: "word" });
    }
  };
  var E = (e2, t2) => {
    if (!t2.has(e2.currentNode)) {
      const t3 = e2.firstChild();
      if (null !== t3)
        return t3;
    }
    const s2 = e2.nextSibling();
    if (null !== s2)
      return s2;
    const n2 = e2.parentNode();
    return null !== n2 && t2.add(n2), n2;
  };
  var g = { BLOCK_ELEMENTS: e, BOUNDARY_CHARS: t, NON_BOUNDARY_CHARS: /[^\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u, acceptNodeIfVisibleInRange: f, normalizeString: S, makeNewSegmenter: F, forwardTraverse: E, backwardTraverse: (e2, t2) => {
    if (!t2.has(e2.currentNode)) {
      const t3 = e2.lastChild();
      if (null !== t3)
        return t3;
    }
    const s2 = e2.previousSibling();
    if (null !== s2)
      return s2;
    const n2 = e2.parentNode();
    return null !== n2 && t2.add(n2), n2;
  }, makeTextNodeWalker: a, isNodeVisible: i };
  "undefined" != typeof goog && goog.declareModuleId("googleChromeLabs.textFragmentPolyfill.textFragmentUtils");
  var A;
  var C = 500;
  var O = (e2) => {
    C = e2;
  };
  var N = { SUCCESS: 0, INVALID_SELECTION: 1, AMBIGUOUS: 2, TIMEOUT: 3, EXECUTION_FAILED: 4 };
  var T = (e2, t2 = Date.now()) => {
    try {
      return B(e2, t2);
    } catch (e3) {
      return e3.isTimeout ? { status: N.TIMEOUT } : { status: N.EXECUTION_FAILED };
    }
  };
  var B = (e2, t2) => {
    R(t2), G(e2), q(e2);
    const s2 = e2.cloneRange();
    if (K(e2), e2.collapsed)
      return { status: N.INVALID_SELECTION };
    let n2;
    if (P(e2)) {
      const t3 = g.normalizeString(e2.toString()), s3 = { textStart: t3 };
      if (t3.length >= 20 && L(s3))
        return { status: N.SUCCESS, fragment: s3 };
      n2 = new b().setExactTextMatch(t3);
    } else {
      const t3 = w(e2), s3 = k(e2);
      n2 = t3 && s3 ? new b().setStartAndEndSearchSpace(t3, s3) : new b().setSharedSearchSpace(e2.toString().trim());
    }
    const r2 = document.createRange();
    r2.selectNodeContents(document.body);
    const u2 = r2.cloneRange();
    r2.setEnd(s2.startContainer, s2.startOffset), u2.setStart(s2.endContainer, s2.endOffset);
    const a2 = k(r2), i2 = w(u2);
    (a2 || i2) && n2.setPrefixAndSuffixSearchSpace(a2, i2), n2.useSegmenter(g.makeNewSegmenter());
    let f2 = false;
    do {
      _(), f2 = n2.embiggen();
      const e3 = n2.tryToMakeUniqueFragment();
      if (null != e3)
        return { status: N.SUCCESS, fragment: e3 };
    } while (f2);
    return { status: N.AMBIGUOUS };
  };
  var _ = () => {
    if (null === C)
      return;
    const e2 = Date.now() - A;
    if (e2 > C) {
      const t2 = new Error(`Fragment generation timed out after ${e2} ms.`);
      throw t2.isTimeout = true, t2;
    }
  };
  var R = (e2) => {
    A = e2;
  };
  var w = (e2) => {
    let t2 = H(e2);
    const s2 = V(t2, e2.endContainer);
    if (!s2)
      return;
    const n2 = /* @__PURE__ */ new Set();
    e2.startContainer.nodeType === Node.ELEMENT_NODE && e2.startOffset === e2.startContainer.childNodes.length && n2.add(e2.startContainer);
    const r2 = t2, u2 = new I(e2, true), a2 = e2.cloneRange();
    for (; !a2.collapsed && null != t2; ) {
      if (_(), t2.contains(r2) ? a2.setStartAfter(t2) : a2.setStartBefore(t2), u2.appendNode(t2), null !== u2.textInBlock)
        return u2.textInBlock;
      t2 = g.forwardTraverse(s2, n2);
    }
  };
  var k = (e2) => {
    let t2 = U(e2);
    const s2 = V(t2, e2.startContainer);
    if (!s2)
      return;
    const n2 = /* @__PURE__ */ new Set();
    e2.endContainer.nodeType === Node.ELEMENT_NODE && 0 === e2.endOffset && n2.add(e2.endContainer);
    const r2 = t2, u2 = new I(e2, false), a2 = e2.cloneRange();
    for (; !a2.collapsed && null != t2; ) {
      if (_(), t2.contains(r2) ? a2.setEnd(t2, 0) : a2.setEndAfter(t2), u2.appendNode(t2), null !== u2.textInBlock)
        return u2.textInBlock;
      t2 = g.backwardTraverse(s2, n2);
    }
  };
  var b = class {
    constructor() {
      this.Mode = { ALL_PARTS: 1, SHARED_START_AND_END: 2, CONTEXT_ONLY: 3 }, this.startOffset = null, this.endOffset = null, this.prefixOffset = null, this.suffixOffset = null, this.prefixSearchSpace = "", this.backwardsPrefixSearchSpace = "", this.suffixSearchSpace = "", this.numIterations = 0;
    }
    tryToMakeUniqueFragment() {
      let e2;
      if (e2 = this.mode === this.Mode.CONTEXT_ONLY ? { textStart: this.exactTextMatch } : { textStart: this.getStartSearchSpace().substring(0, this.startOffset).trim(), textEnd: this.getEndSearchSpace().substring(this.endOffset).trim() }, null != this.prefixOffset) {
        const t2 = this.getPrefixSearchSpace().substring(this.prefixOffset).trim();
        t2 && (e2.prefix = t2);
      }
      if (null != this.suffixOffset) {
        const t2 = this.getSuffixSearchSpace().substring(0, this.suffixOffset).trim();
        t2 && (e2.suffix = t2);
      }
      return L(e2) ? e2 : void 0;
    }
    embiggen() {
      let e2 = true;
      if (this.mode === this.Mode.SHARED_START_AND_END ? this.startOffset >= this.endOffset && (e2 = false) : this.mode === this.Mode.ALL_PARTS ? this.startOffset === this.getStartSearchSpace().length && this.backwardsEndOffset() === this.getEndSearchSpace().length && (e2 = false) : this.mode === this.Mode.CONTEXT_ONLY && (e2 = false), e2) {
        const e3 = this.getNumberOfRangeWordsToAdd();
        if (this.startOffset < this.getStartSearchSpace().length) {
          let t3 = 0;
          if (null != this.getStartSegments())
            for (; t3 < e3 && this.startOffset < this.getStartSearchSpace().length; )
              this.startOffset = this.getNextOffsetForwards(this.getStartSegments(), this.startOffset, this.getStartSearchSpace()), t3++;
          else {
            let s2 = this.startOffset;
            do {
              _();
              const e4 = this.getStartSearchSpace().substring(this.startOffset + 1).search(g.BOUNDARY_CHARS);
              this.startOffset = -1 === e4 ? this.getStartSearchSpace().length : this.startOffset + 1 + e4, -1 !== this.getStartSearchSpace().substring(s2, this.startOffset).search(g.NON_BOUNDARY_CHARS) && (s2 = this.startOffset, t3++);
            } while (this.startOffset < this.getStartSearchSpace().length && t3 < e3);
          }
          this.mode === this.Mode.SHARED_START_AND_END && (this.startOffset = Math.min(this.startOffset, this.endOffset));
        }
        if (this.backwardsEndOffset() < this.getEndSearchSpace().length) {
          let t3 = 0;
          if (null != this.getEndSegments())
            for (; t3 < e3 && this.endOffset > 0; )
              this.endOffset = this.getNextOffsetBackwards(this.getEndSegments(), this.endOffset), t3++;
          else {
            let s2 = this.backwardsEndOffset();
            do {
              _();
              const e4 = this.getBackwardsEndSearchSpace().substring(this.backwardsEndOffset() + 1).search(g.BOUNDARY_CHARS);
              -1 === e4 ? this.setBackwardsEndOffset(this.getEndSearchSpace().length) : this.setBackwardsEndOffset(this.backwardsEndOffset() + 1 + e4), -1 !== this.getBackwardsEndSearchSpace().substring(s2, this.backwardsEndOffset()).search(g.NON_BOUNDARY_CHARS) && (s2 = this.backwardsEndOffset(), t3++);
            } while (this.backwardsEndOffset() < this.getEndSearchSpace().length && t3 < e3);
          }
          this.mode === this.Mode.SHARED_START_AND_END && (this.endOffset = Math.max(this.startOffset, this.endOffset));
        }
      }
      let t2 = false;
      if ((!e2 || this.startOffset + this.backwardsEndOffset() < 20 || this.numIterations >= 1) && (null != this.backwardsPrefixOffset() && this.backwardsPrefixOffset() !== this.getPrefixSearchSpace().length || null != this.suffixOffset && this.suffixOffset !== this.getSuffixSearchSpace().length) && (t2 = true), t2) {
        const e3 = this.getNumberOfContextWordsToAdd();
        if (this.backwardsPrefixOffset() < this.getPrefixSearchSpace().length) {
          let t3 = 0;
          if (null != this.getPrefixSegments())
            for (; t3 < e3 && this.prefixOffset > 0; )
              this.prefixOffset = this.getNextOffsetBackwards(this.getPrefixSegments(), this.prefixOffset), t3++;
          else {
            let s2 = this.backwardsPrefixOffset();
            do {
              _();
              const e4 = this.getBackwardsPrefixSearchSpace().substring(this.backwardsPrefixOffset() + 1).search(g.BOUNDARY_CHARS);
              -1 === e4 ? this.setBackwardsPrefixOffset(this.getBackwardsPrefixSearchSpace().length) : this.setBackwardsPrefixOffset(this.backwardsPrefixOffset() + 1 + e4), -1 !== this.getBackwardsPrefixSearchSpace().substring(s2, this.backwardsPrefixOffset()).search(g.NON_BOUNDARY_CHARS) && (s2 = this.backwardsPrefixOffset(), t3++);
            } while (this.backwardsPrefixOffset() < this.getPrefixSearchSpace().length && t3 < e3);
          }
        }
        if (this.suffixOffset < this.getSuffixSearchSpace().length) {
          let t3 = 0;
          if (null != this.getSuffixSegments())
            for (; t3 < e3 && this.suffixOffset < this.getSuffixSearchSpace().length; )
              this.suffixOffset = this.getNextOffsetForwards(this.getSuffixSegments(), this.suffixOffset, this.suffixOffset), t3++;
          else {
            let s2 = this.suffixOffset;
            do {
              _();
              const e4 = this.getSuffixSearchSpace().substring(this.suffixOffset + 1).search(g.BOUNDARY_CHARS);
              this.suffixOffset = -1 === e4 ? this.getSuffixSearchSpace().length : this.suffixOffset + 1 + e4, -1 !== this.getSuffixSearchSpace().substring(s2, this.suffixOffset).search(g.NON_BOUNDARY_CHARS) && (s2 = this.suffixOffset, t3++);
            } while (this.suffixOffset < this.getSuffixSearchSpace().length && t3 < e3);
          }
        }
      }
      return this.numIterations++, e2 || t2;
    }
    setStartAndEndSearchSpace(e2, t2) {
      return this.startSearchSpace = e2, this.endSearchSpace = t2, this.backwardsEndSearchSpace = M(t2), this.startOffset = 0, this.endOffset = t2.length, this.mode = this.Mode.ALL_PARTS, this;
    }
    setSharedSearchSpace(e2) {
      return this.sharedSearchSpace = e2, this.backwardsSharedSearchSpace = M(e2), this.startOffset = 0, this.endOffset = e2.length, this.mode = this.Mode.SHARED_START_AND_END, this;
    }
    setExactTextMatch(e2) {
      return this.exactTextMatch = e2, this.mode = this.Mode.CONTEXT_ONLY, this;
    }
    setPrefixAndSuffixSearchSpace(e2, t2) {
      return e2 && (this.prefixSearchSpace = e2, this.backwardsPrefixSearchSpace = M(e2), this.prefixOffset = e2.length), t2 && (this.suffixSearchSpace = t2, this.suffixOffset = 0), this;
    }
    useSegmenter(e2) {
      return null == e2 || (this.mode === this.Mode.ALL_PARTS ? (this.startSegments = e2.segment(this.startSearchSpace), this.endSegments = e2.segment(this.endSearchSpace)) : this.mode === this.Mode.SHARED_START_AND_END && (this.sharedSegments = e2.segment(this.sharedSearchSpace)), this.prefixSearchSpace && (this.prefixSegments = e2.segment(this.prefixSearchSpace)), this.suffixSearchSpace && (this.suffixSegments = e2.segment(this.suffixSearchSpace))), this;
    }
    getNumberOfContextWordsToAdd() {
      return 0 === this.backwardsPrefixOffset() && 0 === this.suffixOffset ? 3 : 1;
    }
    getNumberOfRangeWordsToAdd() {
      return 0 === this.startOffset && 0 === this.backwardsEndOffset() ? 3 : 1;
    }
    getNextOffsetForwards(e2, t2, s2) {
      let n2 = e2.containing(t2);
      for (; null != n2; ) {
        _();
        const t3 = n2.index + n2.segment.length;
        if (n2.isWordLike)
          return t3;
        n2 = e2.containing(t3);
      }
      return s2.length;
    }
    getNextOffsetBackwards(e2, t2) {
      let s2 = e2.containing(t2);
      for (s2 && t2 != s2.index || (s2 = e2.containing(t2 - 1)); null != s2; ) {
        if (_(), s2.isWordLike)
          return s2.index;
        s2 = e2.containing(s2.index - 1);
      }
      return 0;
    }
    getStartSearchSpace() {
      return this.mode === this.Mode.SHARED_START_AND_END ? this.sharedSearchSpace : this.startSearchSpace;
    }
    getStartSegments() {
      return this.mode === this.Mode.SHARED_START_AND_END ? this.sharedSegments : this.startSegments;
    }
    getEndSearchSpace() {
      return this.mode === this.Mode.SHARED_START_AND_END ? this.sharedSearchSpace : this.endSearchSpace;
    }
    getEndSegments() {
      return this.mode === this.Mode.SHARED_START_AND_END ? this.sharedSegments : this.endSegments;
    }
    getBackwardsEndSearchSpace() {
      return this.mode === this.Mode.SHARED_START_AND_END ? this.backwardsSharedSearchSpace : this.backwardsEndSearchSpace;
    }
    getPrefixSearchSpace() {
      return this.prefixSearchSpace;
    }
    getPrefixSegments() {
      return this.prefixSegments;
    }
    getBackwardsPrefixSearchSpace() {
      return this.backwardsPrefixSearchSpace;
    }
    getSuffixSearchSpace() {
      return this.suffixSearchSpace;
    }
    getSuffixSegments() {
      return this.suffixSegments;
    }
    backwardsEndOffset() {
      return this.getEndSearchSpace().length - this.endOffset;
    }
    setBackwardsEndOffset(e2) {
      this.endOffset = this.getEndSearchSpace().length - e2;
    }
    backwardsPrefixOffset() {
      return null == this.prefixOffset ? null : this.getPrefixSearchSpace().length - this.prefixOffset;
    }
    setBackwardsPrefixOffset(e2) {
      null != this.prefixOffset && (this.prefixOffset = this.getPrefixSearchSpace().length - e2);
    }
  };
  var I = class {
    constructor(e2, t2) {
      this.searchRange = e2, this.isForwardTraversal = t2, this.textFound = false, this.textNodes = [], this.textInBlock = null;
    }
    appendNode(e2) {
      if (null !== this.textInBlock)
        return;
      if (J(e2))
        return void (this.textFound ? (this.isForwardTraversal || this.textNodes.reverse(), this.textInBlock = this.textNodes.map((e3) => e3.textContent).join("").trim()) : this.textNodes = []);
      if (!Q(e2))
        return;
      const t2 = this.getNodeIntersectionWithRange(e2);
      this.textFound = this.textFound || "" !== t2.textContent.trim(), this.textNodes.push(t2);
    }
    getNodeIntersectionWithRange(e2) {
      let t2 = null, s2 = null;
      return e2 === this.searchRange.startContainer && 0 !== this.searchRange.startOffset && (t2 = this.searchRange.startOffset), e2 === this.searchRange.endContainer && this.searchRange.endOffset !== e2.textContent.length && (s2 = this.searchRange.endOffset), null !== t2 || null !== s2 ? { textContent: e2.textContent.substring(t2 != null ? t2 : 0, s2 != null ? s2 : e2.textContent.length) } : e2;
    }
  };
  var L = (e2) => 1 === ((e3, t2 = document) => {
    const a2 = [], i2 = t2.createRange();
    for (i2.selectNodeContents(t2.body); !i2.collapsed && a2.length < 2; ) {
      let f2;
      if (e3.prefix) {
        const s2 = d(e3.prefix, i2);
        if (null == s2)
          break;
        r(i2, s2.startContainer, s2.startOffset);
        const n2 = t2.createRange();
        if (n2.setStart(s2.endContainer, s2.endOffset), n2.setEnd(i2.endContainer, i2.endOffset), u(n2), n2.collapsed)
          break;
        if (f2 = d(e3.textStart, n2), null == f2)
          break;
        if (0 !== f2.compareBoundaryPoints(Range.START_TO_START, n2))
          continue;
      } else {
        if (f2 = d(e3.textStart, i2), null == f2)
          break;
        r(i2, f2.startContainer, f2.startOffset);
      }
      if (e3.textEnd) {
        const u2 = t2.createRange();
        u2.setStart(f2.endContainer, f2.endOffset), u2.setEnd(i2.endContainer, i2.endOffset);
        let o2 = false;
        for (; !u2.collapsed && a2.length < 2; ) {
          const c2 = d(e3.textEnd, u2);
          if (null == c2)
            break;
          if (r(u2, c2.startContainer, c2.startOffset), f2.setEnd(c2.endContainer, c2.endOffset), e3.suffix) {
            const r2 = n(e3.suffix, f2, i2, t2);
            if (r2 === s.NO_SUFFIX_MATCH)
              break;
            if (r2 === s.SUFFIX_MATCH) {
              o2 = true, a2.push(f2.cloneRange());
              continue;
            }
            if (r2 === s.MISPLACED_SUFFIX)
              continue;
          } else
            o2 = true, a2.push(f2.cloneRange());
        }
        if (!o2)
          break;
      } else if (e3.suffix) {
        const u2 = n(e3.suffix, f2, i2, t2);
        if (u2 === s.NO_SUFFIX_MATCH)
          break;
        if (u2 === s.SUFFIX_MATCH) {
          a2.push(f2.cloneRange()), r(i2, i2.startContainer, i2.startOffset);
          continue;
        }
        if (u2 === s.MISPLACED_SUFFIX)
          continue;
      } else
        a2.push(f2.cloneRange());
    }
    return a2;
  })(e2).length;
  var M = (e2) => [...e2 || ""].reverse().join("");
  var P = (e2) => !(e2.toString().length > 300) && !X(e2);
  var H = (e2) => {
    let t2 = e2.startContainer;
    return t2.nodeType == Node.ELEMENT_NODE && e2.startOffset < t2.childNodes.length && (t2 = t2.childNodes[e2.startOffset]), t2;
  };
  var U = (e2) => {
    let t2 = e2.endContainer;
    return t2.nodeType == Node.ELEMENT_NODE && e2.endOffset > 0 && (t2 = t2.childNodes[e2.endOffset - 1]), t2;
  };
  var y = (e2) => {
    const t2 = H(e2);
    if (Q(t2) && g.isNodeVisible(t2))
      return t2;
    const s2 = g.makeTextNodeWalker(e2);
    return s2.currentNode = t2, s2.nextNode();
  };
  var v = (e2) => {
    const t2 = U(e2);
    if (Q(t2) && g.isNodeVisible(t2))
      return t2;
    const s2 = g.makeTextNodeWalker(e2);
    return s2.currentNode = t2, g.backwardTraverse(s2, /* @__PURE__ */ new Set());
  };
  var X = (e2) => {
    const t2 = e2.cloneRange();
    let s2 = H(t2);
    const n2 = V(s2);
    if (!n2)
      return false;
    const r2 = /* @__PURE__ */ new Set();
    for (; !t2.collapsed && null != s2; ) {
      if (J(s2))
        return true;
      null != s2 && t2.setStartAfter(s2), s2 = g.forwardTraverse(n2, r2), _();
    }
    return false;
  };
  var W = (e2, t2) => {
    if (e2.nodeType !== Node.TEXT_NODE)
      return -1;
    const s2 = null != t2 ? t2 : e2.data.length;
    if (s2 < e2.data.length && g.BOUNDARY_CHARS.test(e2.data[s2]))
      return s2;
    const n2 = e2.data.substring(0, s2), r2 = M(n2).search(g.BOUNDARY_CHARS);
    return -1 !== r2 ? s2 - r2 : -1;
  };
  var Y = (e2, t2) => {
    if (e2.nodeType !== Node.TEXT_NODE)
      return -1;
    const s2 = null != t2 ? t2 : 0;
    if (s2 < e2.data.length && s2 > 0 && g.BOUNDARY_CHARS.test(e2.data[s2 - 1]))
      return s2;
    const n2 = e2.data.substring(s2).search(g.BOUNDARY_CHARS);
    return -1 !== n2 ? s2 + n2 : -1;
  };
  var V = (e2, t2) => {
    if (!e2)
      return;
    let s2 = e2;
    const n2 = null != t2 ? t2 : e2;
    for (; !s2.contains(n2) || !J(s2); )
      s2.parentNode && (s2 = s2.parentNode);
    const r2 = document.createTreeWalker(s2, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, (e3) => g.acceptNodeIfVisibleInRange(e3));
    return r2.currentNode = e2, r2;
  };
  var G = (e2) => {
    const t2 = g.makeNewSegmenter();
    if (t2) {
      const s2 = H(e2);
      s2 !== e2.startContainer && e2.setStartBefore(s2), z(t2, false, e2);
    } else {
      const t3 = W(e2.startContainer, e2.startOffset);
      if (-1 !== t3)
        return void e2.setStart(e2.startContainer, t3);
      if (J(e2.startContainer) && 0 === e2.startOffset)
        return;
      const s2 = V(e2.startContainer);
      if (!s2)
        return;
      const n2 = /* @__PURE__ */ new Set();
      let r2 = g.backwardTraverse(s2, n2);
      for (; null != r2; ) {
        const t4 = W(r2);
        if (-1 !== t4)
          return void e2.setStart(r2, t4);
        if (J(r2))
          return void (r2.contains(e2.startContainer) ? e2.setStart(r2, 0) : e2.setStartAfter(r2));
        r2 = g.backwardTraverse(s2, n2), e2.collapse();
      }
    }
  };
  var K = (e2) => {
    const t2 = y(e2);
    if (null == t2)
      return void e2.collapse();
    H(e2) !== t2 && e2.setStart(t2, 0);
    const s2 = U(e2), n2 = v(e2);
    s2 !== n2 && e2.setEnd(n2, n2.textContent.length);
  };
  var z = (e2, t2, s2) => {
    const n2 = t2 ? { node: s2.endContainer, offset: s2.endOffset } : { node: s2.startContainer, offset: s2.startOffset }, r2 = j(n2.node), u2 = r2.preNodes.reduce((e3, t3) => e3.concat(t3.textContent), ""), a2 = r2.innerNodes.reduce((e3, t3) => e3.concat(t3.textContent), "");
    let i2 = u2.length;
    n2.node.nodeType === Node.TEXT_NODE ? i2 += n2.offset : t2 && (i2 += a2.length);
    const f2 = r2.postNodes.reduce((e3, t3) => e3.concat(t3.textContent), ""), o2 = [...r2.preNodes, ...r2.innerNodes, ...r2.postNodes];
    if (0 == o2.length)
      return;
    const c2 = u2.concat(a2, f2), d2 = e2.segment(c2).containing(i2);
    if (!d2)
      return void (t2 ? s2.setEndAfter(o2[o2.length - 1]) : s2.setEndBefore(o2[0]));
    if (!d2.isWordLike)
      return;
    if (i2 === d2.index || i2 === d2.index + d2.segment.length)
      return;
    const h2 = t2 ? d2.index + d2.segment.length : d2.index;
    let l2 = 0;
    for (const e3 of o2) {
      if (l2 <= h2 && h2 < l2 + e3.textContent.length) {
        const n3 = h2 - l2;
        return void (t2 ? n3 >= e3.textContent.length ? s2.setEndAfter(e3) : s2.setEnd(e3, n3) : n3 >= e3.textContent.length ? s2.setStartAfter(e3) : s2.setStart(e3, n3));
      }
      l2 += e3.textContent.length;
    }
    t2 ? s2.setEndAfter(o2[o2.length - 1]) : s2.setStartBefore(o2[0]);
  };
  var j = (e2) => {
    const t2 = [], s2 = V(e2);
    if (!s2)
      return;
    const n2 = /* @__PURE__ */ new Set();
    let r2 = g.backwardTraverse(s2, n2);
    for (; null != r2 && !J(r2); )
      _(), r2.nodeType === Node.TEXT_NODE && t2.push(r2), r2 = g.backwardTraverse(s2, n2);
    t2.reverse();
    const u2 = [];
    if (e2.nodeType === Node.TEXT_NODE)
      u2.push(e2);
    else {
      const t3 = document.createTreeWalker(e2, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, (e3) => g.acceptNodeIfVisibleInRange(e3));
      t3.currentNode = e2;
      let s3 = t3.nextNode();
      for (; null != s3; )
        _(), s3.nodeType === Node.TEXT_NODE && u2.push(s3), s3 = t3.nextNode();
    }
    const a2 = [], i2 = V(e2);
    if (!i2)
      return;
    const f2 = /* @__PURE__ */ new Set([e2]);
    let o2 = g.forwardTraverse(i2, f2);
    for (; null != o2 && !J(o2); )
      _(), o2.nodeType === Node.TEXT_NODE && a2.push(o2), o2 = g.forwardTraverse(i2, f2);
    return { preNodes: t2, innerNodes: u2, postNodes: a2 };
  };
  var q = (e2) => {
    const t2 = g.makeNewSegmenter();
    if (t2) {
      const s2 = U(e2);
      s2 !== e2.endContainer && e2.setEndAfter(s2), z(t2, true, e2);
    } else {
      let t3 = e2.endOffset, s2 = e2.endContainer;
      s2.nodeType === Node.ELEMENT_NODE && e2.endOffset < s2.childNodes.length && (s2 = s2.childNodes[e2.endOffset]);
      const n2 = V(s2);
      if (!n2)
        return;
      const r2 = /* @__PURE__ */ new Set([s2]);
      for (; null != s2; ) {
        _();
        const u2 = Y(s2, t3);
        if (t3 = null, -1 !== u2)
          return void e2.setEnd(s2, u2);
        if (J(s2))
          return void (s2.contains(e2.endContainer) ? e2.setEnd(s2, s2.childNodes.length) : e2.setEndBefore(s2));
        s2 = g.forwardTraverse(n2, r2);
      }
      e2.collapse();
    }
  };
  var J = (e2) => e2.nodeType === Node.ELEMENT_NODE && (g.BLOCK_ELEMENTS.includes(e2.tagName) || "HTML" === e2.tagName || "BODY" === e2.tagName);
  var Q = (e2) => e2.nodeType === Node.TEXT_NODE;
  "undefined" != typeof goog && goog.declareModuleId("googleChromeLabs.textFragmentPolyfill.fragmentGenerationUtils");

  // src/rangeToFragment.ts
  O(null);
  function rangeToFragment(range) {
    return T(range);
  }
  window.rangeToFragment = rangeToFragment;
})();
