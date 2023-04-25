import {
  getNodesFor,
  annotateNodes,
  annotationTagName,
  annotationClass,
  annotationLevelClassPrefix,
  annotations,
  annotationIndexDataKey,
  getEquivalentAnnotation,
} from "./annotate";
import { Annotation, annotationIndexClassPrefix } from "./annotation";
import { setNodeData } from "./node-data";

expect.extend({
  toBeEqualNode(received, expected) {
    const pass = received.isEqualNode(expected);
    if (pass) {
      return {
        message: () =>
          `expected

          ${received.outerHTML}

          not to be equal node as

          ${expected.outerHTML}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected

          ${received.outerHTML}

          to be equal node as

          ${expected.outerHTML}`,
        pass: false,
      };
    }
  },
});

beforeEach(() => {
  annotations.length = 0;
});

describe("getNodesBetween", () => {
  test("gets a single text node", () => {
    document.body.innerHTML = `<p id="wrapper">This will be annotated <span>this will not</span></p>`;
    const wrapper = document.getElementById("wrapper")!;
    const textNode = wrapper.childNodes[0];

    const nodes = getNodesFor(textNode, 0, textNode, 22);

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toHaveTextContent("This will be annotated");
  });
});

describe("annotateNodes/getNodesFor", () => {
  test("annotates text", () => {
    document.body.innerHTML = `
      <p id="wrapper">
        Part of this will be annotated
      </p>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const textNode = wrapper.childNodes[0];
    const text = "this will be";
    const textOffset = textNode.textContent!.indexOf(text);

    const nodes = getNodesFor(
      textNode,
      textOffset,
      textNode,
      textOffset + text.length
    );
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <p id="wrapper">
        Part of ${open(0, 1)}this will be${close()} annotated
      </p>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });

  test("annotates across an element boundary", () => {
    document.body.innerHTML = `
      <p id="wrapper">
        Part of this will be annotated
        <span>part of this will too</span>
      </p>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const textNode = wrapper.childNodes[0];
    const textNodeText = "this will be annotated";
    const textOffset = textNode.textContent!.indexOf(textNodeText);
    const spanTextNode = wrapper.childNodes[1].childNodes[0];
    const spanText = "part of this";
    const spanTextOffset =
      spanTextNode.textContent!.indexOf(spanText) + spanText.length;

    const nodes = getNodesFor(
      textNode,
      textOffset,
      spanTextNode,
      spanTextOffset
    );
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <p id="wrapper">
        Part of ${open(0, 1)}this will be annotated
        ${close()}<span>${open(0, 1)}part of this${close()} will too</span>
      </p>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });

  test("supports overlapping annotation at the beginning", () => {
    document.body.innerHTML = `
      <p id="wrapper">
        Part of ${open(
          0,
          1
        )}this will be annotated${close()} part of this will too
      </p>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const beforeTextNode = wrapper.childNodes[0];
    const annotationNode = wrapper.childNodes[1] as HTMLElement;
    const annotationTextNode = annotationNode.childNodes[0];
    const overlappingText = "this will be";
    createAnnotation(annotationNode, 1);

    const nodes = getNodesFor(
      beforeTextNode,
      0,
      annotationTextNode,
      overlappingText.length
    );
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <p id="wrapper">${open(1, 1)}
        Part of ${close()}${open(1, 1)}${open(
        0,
        2
      )}this will be${close()}${close()}${open(
        0,
        2
      )} annotated${close()} part of this will too
      </p>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });

  test("supports overlapping annotation at the end", () => {
    document.body.innerHTML = `
      <p id="wrapper">
        Part of ${open(
          0,
          1
        )}this will be annotated${close()} part of this will too
      </p>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const annotationNode = wrapper.childNodes[1] as HTMLElement;
    const annotationTextNode = annotationNode.childNodes[0];
    const startText = "annotated";
    const startOffset = annotationTextNode.nodeValue!.indexOf(startText);
    const textNode = wrapper.childNodes[2];
    const endText = "part of this";
    const endOffset = textNode.nodeValue!.indexOf(endText) + endText.length;
    createAnnotation(annotationNode, 1);

    const nodes = getNodesFor(
      annotationTextNode,
      startOffset,
      textNode,
      endOffset
    );
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <p id="wrapper">
        Part of ${open(0, 1)}this will be ${close()}${open(0, 1)}${open(
        1,
        2
      )}annotated${close()}${close()}${open(
        1,
        2
      )} part of this${close()} will too
      </p>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });

  test("wraps an annotation", () => {
    document.body.innerHTML = `
      <p id="wrapper">
        All of this will be annotated at level 1
        ${open(0, 1)}this is 2${close()}
        this is back to 1
      </p>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const beforeTextNode = wrapper.childNodes[0];
    const afterTextNode = wrapper.childNodes[2];
    const annotationNode = wrapper.childNodes[1] as HTMLElement;
    createAnnotation(annotationNode, 1);

    const nodes = getNodesFor(
      beforeTextNode,
      0,
      afterTextNode,
      afterTextNode.textContent!.length
    );
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <p id="wrapper">${open(1, 1)}
        All of this will be annotated at level 1
        ${close()}${open(1, 1)}${open(0, 2)}this is 2${close()}${close()}${open(
        1,
        1
      )}
        this is back to 1
      ${close()}</p>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });

  test("wraps an annotation again", () => {
    document.body.innerHTML = `
      <p id="wrapper">
        All of this will be annotated at level 1
        ${open(0, 1)}this will be at 2
        ${close()}${open(0, 1)}${open(1, 2)}this is 3
        ${close()}${close()}${open(0, 1)}this is back to 2
        ${close()}this is back to 1
      </p>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const beforeTextNode = wrapper.childNodes[0];
    const afterTextNode = wrapper.childNodes[4];
    createAnnotation(
      [
        wrapper.childNodes[1] as HTMLElement,
        wrapper.childNodes[2] as HTMLElement,
        wrapper.childNodes[3] as HTMLElement,
      ],
      1
    );
    createAnnotation(wrapper.childNodes[2].childNodes[0] as HTMLElement, 2);

    const nodes = getNodesFor(
      beforeTextNode,
      0,
      afterTextNode,
      afterTextNode.textContent!.length
    );
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <p id="wrapper">${open(2, 1)}
        All of this will be annotated at level 1
        ${close()}${open(2, 1)}${open(0, 2)}this will be at 2
        ${close()}${close()}${open(2, 1)}${open(0, 2)}${open(1, 3)}this is 3
        ${close()}${close()}${close()}${open(2, 1)}${open(
        0,
        2
      )}this is back to 2
        ${close()}${close()}${open(2, 1)}this is back to 1
      ${close()}</p>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });

  test("annotates inside an annotation", () => {
    document.body.innerHTML = `
      <p id="wrapper">${open(0, 1)}
        All of this will be annotated at level 1
        this is 2
        this is back to 1
      ${close()}</p>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const annotationNode = wrapper.childNodes[0] as HTMLElement;
    const textNode = annotationNode.childNodes[0];
    const newAnnotationText = "this is 2";
    const startOffset = textNode.nodeValue!.indexOf(newAnnotationText);
    const endOffset = startOffset + newAnnotationText.length;
    createAnnotation(annotationNode, 1);

    const nodes = getNodesFor(textNode, startOffset, textNode, endOffset);
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <p id="wrapper">${open(0, 1)}
        All of this will be annotated at level 1
        ${close()}${open(0, 1)}${open(1, 2)}this is 2${close()}${close()}${open(
        0,
        1
      )}
        this is back to 1
      ${close()}</p>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });

  test("annotates between two annotations", () => {
    document.body.innerHTML = `
      <p id="wrapper">${open(0, 1)}
        All of this will be annotated at level 1
        Then a new annotation will annotate here
        ${close()}${open(0, 1)}${open(1, 2)}This will be all three
        ${close()}${close()}${open(0, 1)}The new annotation will get this too
        this is back to 1
      ${close()}</p>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const annotation0Node0 = wrapper.childNodes[0] as HTMLElement;
    const annotation0Node1 = wrapper.childNodes[1] as HTMLElement;
    const annotation0Node2 = wrapper.childNodes[2] as HTMLElement;
    const annotation1Node = annotation0Node1.childNodes[0] as HTMLElement;
    const textNode1 = annotation0Node0.childNodes[0];
    const text = "Then a new annotation";
    const startOffset = textNode1.nodeValue!.indexOf(text);
    const textNode2 = wrapper.childNodes[2].childNodes[0];
    createAnnotation([annotation0Node0, annotation0Node1, annotation0Node2], 1);
    createAnnotation(annotation1Node, 2);

    const nodes = getNodesFor(
      textNode1,
      startOffset,
      textNode2,
      textNode2.nodeValue!.indexOf("this is back")
    );
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <p id="wrapper">${open(0, 1)}
        All of this will be annotated at level 1
        ${close()}${open(0, 1)}${open(
        2,
        2
      )}Then a new annotation will annotate here
        ${close()}${close()}${open(0, 1)}${open(2, 2)}${open(
        1,
        3
      )}This will be all three
        ${close()}${close()}${close()}${open(0, 1)}${open(
        2,
        2
      )}The new annotation will get this too
        ${close()}${close()}${open(0, 1)}this is back to 1
      ${close()}</p>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });

  test("annotates when end encompasses no content of endNode (paragraph triple-click selection)", () => {
    /*
     * this test case captures the behavior of when a user selects a paragraph using triple-click.  The start
     * node is the first text node of the paragraph, start offset 0.  The end node is the *next* paragraph, end offset
     * of 0.
     */
    document.body.innerHTML = `
      <div id="wrapper">
        <p>
          When selecting a paragraph by triple-clicking, the selection can encompass
        </p>
        <p id="wrapper">
          Index 0 of the following paragraph.  But we don't want to annotate that.
        </p>
      </div>
    `.trim();
    const wrapper = document.getElementById("wrapper")!;
    const startNode = wrapper.childNodes[1].childNodes[0];
    const startOffset = 0;
    const endNode = wrapper.childNodes[3];
    const endOffset = 0;

    const nodes = getNodesFor(startNode, startOffset, endNode, endOffset);
    annotateNodes(nodes);

    const expected = createElementFromHTML(
      `
      <div id="wrapper">
        <p>${open(0, 1)}
          When selecting a paragraph by triple-clicking, the selection can encompass
        ${close()}</p>${open(0, 1)}
        ${close()}<p id="wrapper">
          Index 0 of the following paragraph.  But we don't want to annotate that.
        </p>
      </div>
    `.trim()
    );
    expect(wrapper).toBeEqualNode(expected);
  });
});

describe("getEquivalentAnnotation", () => {
  test("works", () => {
    document.body.innerHTML = `${open(
      0,
      1
    )}The world is everything that is the case.${close()}`;
    const annotationNode = document.body.childNodes[0] as HTMLElement;
    const textNode = annotationNode.childNodes[0];
    createAnnotation(annotationNode, 1);

    const equivalentAnnotation = getEquivalentAnnotation([textNode]);

    expect(equivalentAnnotation).toBe(annotations[0]);
  });
});

function open(index: number, level: number) {
  return `<${annotationTagName} class="${annotationClass} ${annotationIndexClassPrefix}${index} ${annotationLevelClassPrefix}${level}">`;
}

function close() {
  return `</${annotationTagName}>`;
}

function createAnnotation(
  annotationNodes: HTMLElement | HTMLElement[],
  level: number
) {
  if (!Array.isArray(annotationNodes)) {
    annotationNodes = [annotationNodes];
  }
  const annotation = new Annotation(annotations.length, annotationNodes, level);
  annotations.push(annotation);
  for (const node of annotationNodes) {
    setNodeData(node, annotationIndexDataKey, annotation.index);
  }
  return annotation;
}

function createElementFromHTML(htmlString: string) {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div.childElementCount > 1 ? div.childNodes : div.firstChild;
}
