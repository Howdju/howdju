import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { schema } from "normalizr";

import ApiAutocomplete from "./ApiAutocomplete";
import { renderWithProviders } from "./testUtils";
import { OnPropertyChangeCallback } from "./types";

describe("ApiAutocomplete", () => {
  const onSubmit = jest.fn();
  const fetchSuggestions = jest.fn();
  const cancelSuggestions = jest.fn();
  const onAutocomplete = jest.fn();
  let value = "";
  type Suggestion = { text: string };
  const suggestionSchema = new schema.Entity<Suggestion>("suggestionsSchema");
  let onPropertyChange: OnPropertyChangeCallback;

  const user = userEvent.setup();

  beforeEach(() => {
    jest.resetAllMocks();

    onPropertyChange = jest.fn((changes: any) => {
      value = changes["testValue"];
    });
  });
  test("pressing enter in singleline mode with onSubmit submits", async () => {
    renderWithProviders(
      <form onSubmit={onSubmit}>
        <ApiAutocomplete
          id="test-autocomplete"
          name="testValue"
          fetchSuggestions={fetchSuggestions}
          cancelSuggestions={cancelSuggestions}
          suggestionsKey="test-autcomplete-suggestions"
          onAutocomplete={onAutocomplete}
          suggestionSchema={suggestionSchema}
          value={value}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
        />
      </form>
    );

    // Act
    await user.type(screen.getByRole("textbox"), "{Enter}");

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onPropertyChange).not.toHaveBeenCalled();
    expect(value).toBe("");
  });
  test("pressing enter in multiline mode with onSubmit submits", async () => {
    renderWithProviders(
      <form onSubmit={onSubmit}>
        <ApiAutocomplete
          id="test-autocomplete"
          name="testValue"
          fetchSuggestions={fetchSuggestions}
          cancelSuggestions={cancelSuggestions}
          suggestionsKey="test-autcomplete-suggestions"
          onAutocomplete={onAutocomplete}
          suggestionSchema={suggestionSchema}
          value={value}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
          rows={1}
          maxRows={2}
        />
      </form>
    );

    // Act
    await user.type(screen.getByRole("textbox"), "{Enter}");

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onPropertyChange).not.toHaveBeenCalled();
    expect(value).toBe("");
  });
  test("pressing enter in singleline mode without onSubmit submits", async () => {
    renderWithProviders(
      <form onSubmit={onSubmit}>
        <ApiAutocomplete
          id="test-autocomplete"
          name="testValue"
          fetchSuggestions={fetchSuggestions}
          cancelSuggestions={cancelSuggestions}
          suggestionsKey="test-autcomplete-suggestions"
          onAutocomplete={onAutocomplete}
          suggestionSchema={suggestionSchema}
          value={value}
          onPropertyChange={onPropertyChange}
        />
      </form>
    );

    // Act
    await user.type(screen.getByRole("textbox"), "{Enter}");

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onPropertyChange).not.toHaveBeenCalled();
    expect(value).toBe("");
  });
  test("pressing enter in multiline mode without onSubmit inserts newline", async () => {
    renderWithProviders(
      <form onSubmit={onSubmit}>
        <ApiAutocomplete
          id="test-autocomplete"
          name="testValue"
          fetchSuggestions={fetchSuggestions}
          cancelSuggestions={cancelSuggestions}
          suggestionsKey="test-autcomplete-suggestions"
          onAutocomplete={onAutocomplete}
          suggestionSchema={suggestionSchema}
          value={value}
          onPropertyChange={onPropertyChange}
          rows={1}
          maxRows={2}
        />
      </form>
    );

    // Act
    await user.type(screen.getByRole("textbox"), "{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onPropertyChange).toHaveBeenCalledOnceWith({
      testValue: "\n",
    });
    expect(value).toBe("\n");
  });
});
