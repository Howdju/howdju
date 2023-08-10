import { readFileSync } from "fs";
import { JSDOM } from "jsdom";

import { getElementById, getFirstChild } from "howdju-test-common";

import {
  nodePositionCompare,
  walkRangeNodes,
  findTextInDoc,
} from "./domCommon";
import stripIndent from "strip-indent";

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

describe("findTextInDoc", () => {
  test("finds multiline text in the Seattle Times", () => {
    const url =
      "https://www.seattletimes.com/seattle-news/homeless/heres-why-people-think-seattle-will-reverse-course-on-homelessness/";
    const html = readFileSync(
      "lib/testData/domBibliographicInfoTestData/seattletimes.html",
      "utf8"
    );
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    const quotation = stripIndent(`
      Many poll respondents said the reason they believe the homelessness crisis is worse now than it was three years ago is because they see it more.

      “I see a lot more encampments around or RVs parked on the side of the road where they didn’t used to be,” said Drew Scoggins, a Northgate resident who responded to the poll.`).trim();

    expect(findTextInDoc(doc, quotation)).toEqual(quotation);
  });
  test("finds multiline text in a Lex Fridman podcast transcript", () => {
    const url = "https://lexfridman.com/robert-f-kennedy-jr-transcript/";
    const html = readFileSync(
      "lib/testData/urlTextFragments/lexfridman.html",
      "utf8"
    );
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    const quotation = stripIndent(`
    Robert F. Kennedy Jr

    (00:09:49) I suppose the way that Camus viewed the world and the way that the Stoics did and a lot of the existentialists, it was that it was so absurd and that the problems and the tasks that were given just to live a life are so insurmountable that the only way that we can get back the gods for giving us this impossible task of living life was to embrace it and to enjoy it and to do our best at it. To me, I read Camus, and particularly in The Myth of Sisyphus as a parable that… And it’s the same lesson that I think he writes about in The Plague, where we’re all given these insurmountable tasks in our lives, but that by doing our duty, by being of service to others, we can bring meaning to a meaningless chaos and we can bring order to the universe.
    `).trim();
    const foundQuotation = `Robert F. Kennedy Jr (00:09:49) I suppose the way that Camus viewed the world and the way that the Stoics did and a lot of the existentialists, it was that it was so absurd and that the problems and the tasks that were given just to live a life are so insurmountable that the only way that we can get back the gods for giving us this impossible task of living life was to embrace it and to enjoy it and to do our best at it. To me, I read Camus, and particularly in The Myth of Sisyphus as a parable that… And it’s the same lesson that I think he writes about in The Plague, where we’re all given these insurmountable tasks in our lives, but that by doing our duty, by being of service to others, we can bring meaning to a meaningless chaos and we can bring order to the universe.`;

    expect(findTextInDoc(doc, quotation)).toEqual(foundQuotation);
  });
});
