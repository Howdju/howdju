import React from "react";
import { createMemoryHistory } from "history";
import userEvent from "@testing-library/user-event";

import { clickEnabledButton, renderWithProviders } from "@/testUtils";
import SubmitButton from "./editors/SubmitButton";

describe("clickEnabledButton", () => {
  test("throws if button is disabled", () => {
    // Arrange
    const user = userEvent.setup();
    const history = createMemoryHistory();
    renderWithProviders(
      <SubmitButton appearDisabled={true}>Submit</SubmitButton>,
      { history }
    );

    // Act
    expect(() => clickEnabledButton(user, /submit/i)).toThrow(
      "Expected the element not to have class"
    );
  });
  test("clicks if button is enabled", async () => {
    // Arrange
    const user = userEvent.setup();
    const history = createMemoryHistory();
    const onClick = jest.fn();
    renderWithProviders(
      <SubmitButton appearDisabled={false} onClick={onClick}>
        Submit
      </SubmitButton>,
      { history }
    );

    // Act
    await clickEnabledButton(user, /submit/i);

    expect(onClick).toHaveBeenCalled();
  });
});
