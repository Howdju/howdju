import { JSDOM } from "jsdom";
import { getElementById } from "howdju-test-common";
import { nodePositionCompare } from "./domCommon";

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
