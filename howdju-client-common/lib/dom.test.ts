import {
  getElementById,
  getFirstChild,
  getLastChild,
} from "howdju-test-common";

import {
  getCommonAncestor,
  getNextLeafNode,
  isCoextensive,
  normalizeContentRange,
} from "./dom";

describe("getCommonAncestor", () => {
  test("gets an ancestor", () => {
    document.body.innerHTML = `<p id="wrapper">This <span id="span1">will be annotated</span> <span id="span2">this will not</span></p>`;
    const wrapper = getElementById("wrapper");
    const span1 = getElementById("span1");
    const span2 = getElementById("span2");
    expect(getCommonAncestor(span1, span2)).toBe(wrapper);
  });
});

describe("isCoextensive", () => {
  test("is true when they are coextensive", () => {
    document.body.innerHTML = `<span id="outer"><span id="inner">The only way out is through</span></span>`;
    const outer = getElementById("outer");
    const inner = getElementById("inner");
    expect(isCoextensive(inner, outer)).toBe(true);
    expect(isCoextensive(outer, inner)).toBe(true);
  });
  test("is false when they are not coextensive", () => {
    document.body.innerHTML = `<span id="outer">The only <span id="inner">way out</span> is through</span>`;
    const outer = getElementById("outer");
    const inner = getElementById("inner");
    expect(isCoextensive(inner, outer)).toBe(false);
    expect(isCoextensive(outer, inner)).toBe(false);
  });
});

describe("getNextLeafNode", () => {
  test("gets the next leaf node", () => {
    document.body.innerHTML = `<span id="first">first</span><span id="second">second</span>`;
    const first = getElementById("first");
    const second = getElementById("second");
    const secondTextNode = getFirstChild(second);
    expect(getNextLeafNode(first)).toBeEqualNode(secondTextNode);
  });
});

describe("normalizeContentRange", () => {
  test("moves a range's end to the first non-empty leaf node", () => {
    document.body.innerHTML = `
      <p id="first">The first paragraph</p>
      <p id="second">The second paragraph</p>
      <p id="third">The third paragraph</p>`;
    const first = getElementById("first");
    const second = getElementById("second");
    const third = getElementById("third");
    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(third, 0);

    const normalizedRange = normalizeContentRange(range);

    const expectedRange = range.cloneRange();
    const secondTextNode = getLastChild(second);
    expectedRange.setEnd(secondTextNode, getTextContentLength(secondTextNode));
    expect(normalizedRange).toBeEqualRange(expectedRange);
  });
  test("moves a range's start to the first non-empty leaf node", () => {
    document.body.innerHTML = `
      <p id="first">The first paragraph</p>
      <p id="second">The second paragraph</p>
      <p id="third">The third paragraph</p>`;
    const first = getElementById("first");
    const second = getElementById("second");
    const third = getElementById("third");
    const range = document.createRange();
    const firstTextNode = getLastChild(first);
    const thirdTextNode = getLastChild(third);
    range.setStart(firstTextNode, getTextContentLength(firstTextNode));
    range.setEnd(thirdTextNode, getTextContentLength(thirdTextNode));

    const normalizedRange = normalizeContentRange(range);

    const expectedRange = range.cloneRange();
    const secondTextNode = getLastChild(second);
    expectedRange.setStart(secondTextNode, 0);
    expect(normalizedRange).toBeEqualRange(expectedRange);
  });
  test("doesn't move a range that is already at the beginning and end of the enclosed content", () => {
    document.body.innerHTML = `
      <p id="first">The first paragraph</p>
      <p id="second">The second paragraph</p>
      <p id="third">The third paragraph</p>
      <p id="fourth">The fourth paragraph</p>`;
    const second = getElementById("second");
    const third = getElementById("third");
    const range = document.createRange();
    const secondTextNode = getFirstChild(second);
    const thirdTextNode = getLastChild(third);
    range.setStart(secondTextNode, 0);
    range.setEnd(thirdTextNode, getTextContentLength(thirdTextNode));

    const normalizedRange = normalizeContentRange(range);

    const expectedRange = range.cloneRange();
    expect(normalizedRange).toBeEqualRange(expectedRange);
  });
});

function getTextContentLength(node: Node): number {
  if (node.textContent) {
    return node.textContent.length;
  }
  return 0;
}
