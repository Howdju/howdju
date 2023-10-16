import React from "react";
import { screen } from "@testing-library/react";
import { schema } from "normalizr";

import ApiAutoComplete from "./ApiAutoComplete";
import {
  renderWithProviders,
  setupUserEvent,
  withFakeTimers,
} from "@/testUtils";

withFakeTimers();

describe("ApiAutoComplete", () => {
  test("enter submits", async () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    interface Thingy {
      name: string;
    }
    const suggestionSchema = new schema.Entity<Thingy>("thingies");

    renderWithProviders(
      <form onSubmit={onSubmit}>
        <ApiAutoComplete
          id="test-api-autocomplete"
          name="test-api-autocomplete"
          fetchSuggestions={(_value, _suggestionsKey) => ({
            type: "TEST_TYPE",
            payload: {},
          })}
          cancelSuggestions={(_suggestionsKey) => ({
            type: "TEST_TYPE",
            payload: {},
          })}
          suggestionsKey="test-api-autocomplete"
          suggestionSchema={suggestionSchema}
          labelKey="name"
        />
      </form>
    );

    const user = setupUserEvent();
    const input = screen.getByRole("textbox");
    await user.type(input, "Hi diddily do");

    // Act
    await user.type(input, "{Enter}");

    // Assert
    expect(onSubmit).toHaveBeenCalled();
  });
});
