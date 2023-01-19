import React from "react";
import { screen } from "@testing-library/react";
import TagsControl from "./TagsControl";
import {
  renderWithProviders,
  setupUserEvent,
  withFakeTimers,
} from "./testUtils";
import { CreatePropositionInput, Tag, TagVote } from "howdju-common";

withFakeTimers();

describe("TagsControl", () => {
  test("pressing enter with non-empty tag name adds tag", async () => {
    const onSubmit = jest.fn();
    const onTag = jest.fn();
    const onUnTag = jest.fn();

    renderWithProviders(
      <form onSubmit={onSubmit}>
        <TagsControl
          id="test-tags-control"
          tags={[]}
          votes={[]}
          suggestionsKey="test-suggestions-key"
          onTag={onTag}
          onUnTag={onUnTag}
        />
      </form>
    );

    const user = setupUserEvent();
    const tagName = "A wee bonny tag";
    await user.type(screen.getByLabelText(/tag/i), tagName);

    // Act
    await user.type(screen.getByLabelText(/tag/i), "{Enter}");

    // Assert
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onTag).toHaveBeenCalledOnceWith({ name: tagName });
    expect(onUnTag).not.toHaveBeenCalled();
  });

  test("pressing enter with empty tag name submits", async () => {
    const onSubmit = jest.fn();
    const onTag = jest.fn();
    const onUnTag = jest.fn();

    renderWithProviders(
      <form onSubmit={onSubmit}>
        <TagsControl
          id="test-tags-control"
          tags={[]}
          votes={[]}
          suggestionsKey="test-suggestions-key"
          onTag={onTag}
          onUnTag={onUnTag}
          onSubmit={onSubmit}
        />
      </form>
    );

    const user = setupUserEvent();

    // Act
    await user.type(screen.getByLabelText(/tag/i), "{Enter}");

    // Assert
    // Ensure we didn't submit for both form and TagsControl.
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("downvoting tag calls untag", async () => {
    const onTag = jest.fn();
    const onUnTag = jest.fn();

    const target: CreatePropositionInput = { text: "A modest proposal" };
    const tag: Tag = { name: "A wee bonny tag" };
    const vote: TagVote = {
      target,
      targetType: "PROPOSITION",
      tag,
      polarity: "POSITIVE",
    };
    renderWithProviders(
      <TagsControl
        id="test-tags-control"
        tags={[tag]}
        votes={[vote]}
        suggestionsKey="test-suggestions-key"
        onTag={onTag}
        onUnTag={onUnTag}
      />
    );
    const user = setupUserEvent();

    // Act
    await user.click(document.querySelector(".remove-chip-icon") as Element);

    // Assert
    expect(onUnTag).toHaveBeenCalled();
  });
  // TODO(222): add more coverage
});
