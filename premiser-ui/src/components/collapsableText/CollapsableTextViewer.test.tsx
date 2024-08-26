import React from "react";
import { render } from "@testing-library/react";
import dedent from "dedent";

import CollapsableTextViewer from "./CollapsableTextViewer";

describe("CollapsableTextViewer", () => {
  test("renders text containing markdown", () => {
    const text = dedent`
      paragraph 1

      paragraph 2

      | table  | header |
      | ------ | ------ |
      | cell1  | cell2  |
      | cell3  | cell4  |
      `;
    const { container } = render(<CollapsableTextViewer text={text} />);
    expect(container).toMatchSnapshot();
  });
});
