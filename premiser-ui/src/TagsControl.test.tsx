import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import TagsControl from "./TagsControl";
import {
  renderWithProviders,
  setupUserEvent,
  withFakeTimers,
  withMockServer,
} from "./testUtils";
import {
  CreatePropositionInput,
  httpStatusCodes,
  Tag,
  TagVote,
} from "howdju-common";
import { InferResponseBody, serviceRoutes } from "howdju-service-routes";
import { rest } from "msw";

withFakeTimers();
const server = withMockServer();

describe("TagsControl", () => {
  test("pressing enter with non-empty tag name adds tag and doesn't submit enclosing form", async () => {
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

  test("pressing enter with empty tag name collapses input", async () => {
    const onTag = jest.fn();
    const onUnTag = jest.fn();

    renderWithProviders(
      <TagsControl
        id="test-tags-control"
        tags={[]}
        votes={[]}
        suggestionsKey="test-suggestions-key"
        onTag={onTag}
        onUnTag={onUnTag}
        inputCollapsable={true}
      />
    );

    const user = setupUserEvent();

    // Act
    await user.click(screen.getByRole("button", { description: /add tag/i }));
    await user.type(screen.getByLabelText(/tag/i), "{Enter}");

    // Assert
    expect(
      screen.queryByRole("input", { name: "tagName" })
    ).not.toBeInTheDocument();
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

  test("autocompleting with partial input tags only the autocompleted tag.", async () => {
    const user = setupUserEvent();
    const onTag = jest.fn();
    const onUnTag = jest.fn();

    server.use(
      rest.get(`http://localhost/search-tags`, (_req, res, ctx) => {
        const response: InferResponseBody<typeof serviceRoutes.searchTags> = {
          tags: [
            { id: "1", name: "Politics" },
            { id: "2", name: "Political" },
          ],
        };
        return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
      })
    );

    renderWithProviders(
      <TagsControl
        id="test-tags-control"
        tags={[]}
        votes={[]}
        suggestionsKey="test-suggestions-key"
        onTag={onTag}
        onUnTag={onUnTag}
        autocompleteDebounceMs={0}
      />
    );

    // Act

    const input = screen.getByLabelText(/tag/i);

    await user.type(input, "Poli");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    await user.type(input, "{Enter}");

    // Assert

    // Ensure we didn't tag both "Poli" (the text entry) and "Politics" (the first tag, selected
    // using down-arrow.)
    expect(onTag).toHaveBeenCalledOnceWith({ id: "1", name: "Politics" });
  });
  test.todo("initially shows tags with votes");
  test.todo("initially hides tags lacking votes");
  test.todo("shows tags lacking votes after clicking show all");
  test.todo("shows recommended tags initially");
  test.todo("hides recommended tags after downvoting them");
});
