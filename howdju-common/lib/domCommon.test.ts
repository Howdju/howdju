import { JSDOM } from "jsdom";
import { getElementById, getFirstChild } from "howdju-test-common";
import { nodePositionCompare, walkRangeNodes } from "./domCommon";

describe("nodePositionCompare", () => {
  test("works for siblings", () => {
    const dom = new JSDOM(
      `<span id="outer">The only <span id="inner1">way</span> <span id="inner2">out</span> is through</span>`
    );
    const inner1 = getElementById("inner1", dom.window.document);
    const inner2 = getElementById("inner2", dom.window.document);
    expect(nodePositionCompare(inner1, inner2)).toBe(-1);
    expect(nodePositionCompare(inner2, inner1)).toBe(1);
  });
  test("works for non-siblings", () => {
    const dom = new JSDOM(
      `<span id="outer">The <span>only <span id="inner1">way</span> </span> <span><span>blah</span></span> <span id="inner2">out</span> is through</span>`
    );
    const inner1 = getElementById("inner1", dom.window.document);
    const inner2 = getElementById("inner2", dom.window.document);
    expect(nodePositionCompare(inner1, inner2)).toBe(-1);
    expect(nodePositionCompare(inner2, inner1)).toBe(1);
  });
  test("detects same node", () => {
    const dom = new JSDOM(
      `<span id="outer">The only way out is through</span>`
    );
    const outer = getElementById("outer", dom.window.document);
    expect(nodePositionCompare(outer, outer)).toBe(0);
  });
  test("handles one node inside the other", () => {
    const dom = new JSDOM(
      `<span id="outer">The only <span id="inner">way out</span> is through</span>`
    );
    const outer = getElementById("outer", dom.window.document);
    const inner = getElementById("inner", dom.window.document);
    expect(nodePositionCompare(outer, inner)).toBe(-1);
    expect(nodePositionCompare(inner, outer)).toBe(1);
  });
});

describe("walkRangeNodes", () => {
  test("walks the nodes", () => {
    const dom = new JSDOM(`
      <span id="outer1">Outer 1 before <span id="inner1">inner 1</span> outer 1 after</span>
      <span id="outer2">Outer 2 before <span id="inner2">inner 2</span> outer 2 after</span>`);
    const doc = dom.window.document;
    const outer1 = getElementById("outer1", doc);
    const outer2 = getElementById("outer2", doc);
    const range = doc.createRange();
    range.setStart(outer1, 0);
    range.setEnd(outer2, outer2.childNodes.length);

    const [outer1BeforeText, inner1, outer1AfterText] = outer1.childNodes;
    const inner1Text = getFirstChild(inner1);

    const betweenText = outer1.nextSibling;

    const [outer2BeforeText, inner2, outer2AfterText] = outer2.childNodes;
    const inner2Text = getFirstChild(inner2);

    const nodeSteps: ({ enter: Node } | { leave: Node })[] = [];

    // Act
    walkRangeNodes(range, {
      enter: (enter) => {
        nodeSteps.push({ enter });
      },
      leave: (leave) => {
        nodeSteps.push({ leave });
      },
    });

    // Assert
    expect(nodeSteps).toEqual([
      { enter: outer1 },
      { enter: outer1BeforeText },
      { leave: outer1BeforeText },
      { enter: inner1 },
      { enter: inner1Text },
      { leave: inner1Text },
      { leave: inner1 },
      { enter: outer1AfterText },
      { leave: outer1AfterText },
      { leave: outer1 },

      { enter: betweenText },
      { leave: betweenText },

      { enter: outer2 },
      { enter: outer2BeforeText },
      { leave: outer2BeforeText },
      { enter: inner2 },
      { enter: inner2Text },
      { leave: inner2Text },
      { leave: inner2 },
      { enter: outer2AfterText },
      { leave: outer2AfterText },
      { leave: outer2 },
    ]);
  });
  test("walks the nodes of the same start/end", () => {
    const dom = new JSDOM(`
      <span id="outer1">Outer 1 before <span id="inner1">inner 1</span> outer 1 after</span>`);
    const doc = dom.window.document;
    const outer1 = getElementById("outer1", doc);
    const range = doc.createRange();
    range.setStart(outer1, 0);
    range.setEnd(outer1, outer1.childNodes.length);

    const [outer1BeforeText, inner1, outer1AfterText] = outer1.childNodes;
    const inner1Text = getFirstChild(inner1);

    const nodeSteps: ({ enter: Node } | { leave: Node })[] = [];

    // Act
    walkRangeNodes(range, {
      enter: (enter) => {
        nodeSteps.push({ enter });
      },
      leave: (leave) => {
        nodeSteps.push({ leave });
      },
    });

    // Assert
    expect(nodeSteps).toEqual([
      { enter: outer1 },
      { enter: outer1BeforeText },
      { leave: outer1BeforeText },
      { enter: inner1 },
      { enter: inner1Text },
      { leave: inner1Text },
      { leave: inner1 },
      { enter: outer1AfterText },
      { leave: outer1AfterText },
      { leave: outer1 },
    ]);
  });
  test("walks the nodes of a range starting/ending in text", () => {
    const dom = new JSDOM(`
      <span id="outer">Outer before <span id="inner">inner 1</span> outer after</span>`);
    const doc = dom.window.document;
    const outer = getElementById("outer", doc);
    const [outerBeforeText, inner, outerAfterText] = outer.childNodes;
    const range = doc.createRange();
    range.setStart(outerBeforeText, "Outer ".length);
    range.setEnd(outerAfterText, " outer ".length);
    const innerText = getFirstChild(inner);

    const nodeSteps: ({ enter: Node } | { leave: Node })[] = [];

    // Act
    walkRangeNodes(range, {
      enter: (enter) => {
        nodeSteps.push({ enter });
      },
      leave: (leave) => {
        nodeSteps.push({ leave });
      },
    });

    // Assert
    expect(nodeSteps).toEqual([
      { enter: outerBeforeText },
      { leave: outerBeforeText },
      { enter: inner },
      { enter: innerText },
      { leave: innerText },
      { leave: inner },
      { enter: outerAfterText },
      { leave: outerAfterText },
    ]);
  });
});
