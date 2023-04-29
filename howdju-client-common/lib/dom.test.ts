import { getCommonAncestor, isCoextensive, nodePositionCompare } from "./dom";

describe("getCommonAncestor", () => {
  test("gets an ancestor", () => {
    document.body.innerHTML = `<p id="wrapper">This <span id="span1">will be annotated</span> <span id="span2">this will not</span></p>`;
    const wrapper = getElementById("wrapper");
    const span1 = getElementById("span1");
    const span2 = getElementById("span2");
    expect(getCommonAncestor(span1, span2)).toBe(wrapper);
  });
});

describe("nodePositionCompare", () => {
  test("works for siblings", () => {
    document.body.innerHTML = `<span id="outer">The only <span id="inner1">way</span> <span id="inner2">out</span> is through</span>`;
    const inner1 = getElementById("inner1");
    const inner2 = getElementById("inner2");
    expect(nodePositionCompare(inner1, inner2)).toBe(-1);
    expect(nodePositionCompare(inner2, inner1)).toBe(1);
  });
  test("works for non-siblings", () => {
    document.body.innerHTML = `<span id="outer">The <span>only <span id="inner1">way</span> </span> <span><span>blah</span></span> <span id="inner2">out</span> is through</span>`;
    const inner1 = getElementById("inner1");
    const inner2 = getElementById("inner2");
    expect(nodePositionCompare(inner1, inner2)).toBe(-1);
    expect(nodePositionCompare(inner2, inner1)).toBe(1);
  });
  test("detects same node", () => {
    document.body.innerHTML = `<span id="outer">The only way out is through</span>`;
    const outer = getElementById("outer");
    expect(nodePositionCompare(outer, outer)).toBe(0);
  });
  test("handles one node inside the other", () => {
    document.body.innerHTML = `<span id="outer">The only <span id="inner">way out</span> is through</span>`;
    const outer = getElementById("outer");
    const inner = getElementById("inner");
    expect(nodePositionCompare(outer, inner)).toBe(-1);
    expect(nodePositionCompare(inner, outer)).toBe(1);
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

function getElementById(id: string) {
  return document.getElementById(id)!;
}
