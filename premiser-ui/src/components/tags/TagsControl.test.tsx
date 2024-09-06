import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { rest } from "msw";

import {
  CreatePropositionInput,
  httpStatusCodes,
  TagOut,
  TagVote,
} from "howdju-common";
import { InferResponseBody, serviceRoutes } from "howdju-service-routes";

import TagsControl from "./TagsControl";
import {
  renderWithProviders,
  setupUserEvent,
  withFakeTimers,
  withMockServer,
} from "@/testUtils";

withFakeTimers();
const server = withMockServer();

describe("TagsControl", () => {
  test("pressing enter with non-empty tag name adds tag and doesn't submit enclosing form", async () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    const onAddTag = jest.fn();
    const onTagUnvote = jest.fn();

    renderWithProviders(
      <form onSubmit={onSubmit}>
        <TagsControl
          id="test-tags-control"
          mode="vote"
          tags={[]}
          votes={[]}
          suggestionsKey="test-suggestions-key"
          onAddTag={onAddTag}
          onTagUnvote={onTagUnvote}
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
    expect(onAddTag).toHaveBeenCalledOnceWith({ name: tagName });
    expect(onTagUnvote).not.toHaveBeenCalled();
  });

  test("pressing enter with empty tag name collapses input", async () => {
    const onTagVote = jest.fn();
    const onTagUnvote = jest.fn();

    renderWithProviders(
      <TagsControl
        id="test-tags-control"
        mode="vote"
        tags={[]}
        votes={[]}
        suggestionsKey="test-suggestions-key"
        onTagVote={onTagVote}
        onTagUnvote={onTagUnvote}
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

  test("antivoting a voted tag calls antitag", async () => {
    const onTagVote = jest.fn();
    const onTagUnvote = jest.fn();
    const onTagAntivote = jest.fn();

    const target: CreatePropositionInput = { text: "A modest proposal" };
    const tag: TagOut = {
      id: "1",
      name: "A wee bonny tag",
    };
    const vote: TagVote = {
      target,
      targetType: "PROPOSITION",
      tag,
      polarity: "POSITIVE",
    };
    renderWithProviders(
      <TagsControl
        id="test-tags-control"
        mode="vote"
        tags={[tag]}
        votes={[vote]}
        suggestionsKey="test-suggestions-key"
        onTagVote={onTagVote}
        onTagUnvote={onTagUnvote}
        onTagAntivote={onTagAntivote}
      />
    );
    const user = setupUserEvent();

    // Act
    await user.click(
      screen.getByLabelText(`Vote against tag ${tag.name}`) as Element
    );

    // Assert
    expect(onTagAntivote).toHaveBeenCalled();
    // The client does not undo the vote, so the API and reducers must remove any votes inconsistent
    // with the new antivote.
    expect(onTagUnvote).not.toHaveBeenCalled();
  });

  test("autocompleting with partial input tags only the autocompleted tag.", async () => {
    const user = setupUserEvent();
    const onTagVote = jest.fn();
    const onAddTag = jest.fn();
    const onTagUnvote = jest.fn();

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
        mode="vote"
        tags={[]}
        votes={[]}
        suggestionsKey="test-suggestions-key"
        onTagVote={onTagVote}
        onAddTag={onAddTag}
        onTagUnvote={onTagUnvote}
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
    expect(onAddTag).toHaveBeenCalledOnceWith({ id: "1", name: "Politics" });
    expect(onTagVote).not.toHaveBeenCalled();
  });
  test.todo("initially shows tags with votes");
  test.todo("initially hides tags lacking votes");
  test.todo("shows tags lacking votes after clicking show all");
  test.todo("shows recommended tags initially");
  test.todo("hides recommended tags after downvoting them");
});
