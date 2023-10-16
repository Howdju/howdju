import React, { KeyboardEvent, MouseEvent, useState } from "react";
import { find, includes } from "lodash";
import { FontIcon } from "@react-md/icon";

import {
  makeCreateTagInput,
  cleanWhitespace,
  tagEqual,
  TagVote,
  TagOut,
  CreateTagInput,
} from "howdju-common";

import IconButton from "./components/button/IconButton";
import { combineIds } from "./viewModels";
import TagNameAutocomplete from "./TagNameAutocomplete";
import TagsViewer, { TagViewerMode } from "./TagsViewer";
import { isDeleteKey, keys } from "./keyCodes";
import {
  ComponentId,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";

import "./TagsControl.scss";

export type TagOutOrInput = CreateTagInput | TagOut;
export type OnClickTagCallback = (tag: TagOutOrInput) => void;
export type OnTagCallback = (tag: TagOutOrInput) => void;
export type OnAntitagCallback = (tag: TagOutOrInput) => void;
export type OnUntagCallback = (tag: TagOutOrInput) => void;

export interface TagsControlProps {
  id: ComponentId;
  tags: TagOutOrInput[];
  votes: TagVote[];
  recommendedTags?: TagOut[];
  commitChipKeys?: string[];
  suggestionsKey: SuggestionsKey;
  votePolarity?: {
    POSITIVE: string;
    NEGATIVE: string;
  };
  mode: TagViewerMode;
  /** Callback for when the user has added a tag using the text input. */
  onAddTag?: OnTagCallback;
  /** Callback for when the user has clicked the tag content. */
  onClickTag?: OnClickTagCallback;
  /** Callback for when a user has clicked the tag button. */
  onTagVote?: OnTagCallback;
  /** Callback for when a user has clicked to vote against a tag. */
  onTagAntivote?: OnAntitagCallback;
  /** Callback to respond when a user has removed an existing tag. */
  onTagUnvote: OnUntagCallback;
  /** Enable collapsing the tag name input */
  inputCollapsable?: boolean;
  /** The title of the button to show the input to add a tag. */
  addTitle?: string;
  /** Whether to autofocus the tag text input when it appears. */
  autoFocus?: boolean;
  /** The autocomplete suggestion fetch debounce milliseconds. */
  autocompleteDebounceMs?: number;
}

export default function TagsControl({
  id,
  tags,
  votes,
  recommendedTags,
  commitChipKeys = [keys.COMMA, keys.ENTER],
  suggestionsKey,
  votePolarity = {
    POSITIVE: "POSITIVE",
    NEGATIVE: "NEGATIVE",
  },
  inputCollapsable,
  mode,
  onClickTag: propsOnClickTag,
  onAddTag,
  onTagVote,
  onTagAntivote,
  onTagUnvote,
  addTitle = "Add tag",
  autocompleteDebounceMs,
  autoFocus,
  ...rest
}: TagsControlProps) {
  const [tagName, setTagName] = useState("");
  const [isInputCollapsed, setIsInputCollapsed] = useState(true);

  const onTagNameKeyDown: OnKeyDownCallback = (event) => {
    if (event.isDefaultPrevented()) {
      return;
    }
    if (includes([keys.ESCAPE], event.key)) {
      if (inputCollapsable) {
        setIsInputCollapsed(true);
      }
      return;
    }
    if (includes(commitChipKeys, event.key)) {
      event.preventDefault();
      // If there's a non-empty tag nam, add it.
      if (tagName) {
        addTag(tagName);
        setTagName("");
      } else if (inputCollapsable) {
        setIsInputCollapsed(true);
      }
    }
  };

  const onTagNamePropertyChange: OnPropertyChangeCallback = (properties) => {
    setTagName(properties.tagName);
  };

  const onTagNameAutocomplete = (tag: TagOut) => {
    if (onAddTag) {
      onAddTag(tag);
    }
    setTagName("");
  };

  function onKeyDownTag(
    tag: TagOutOrInput,
    _index: number,
    event: KeyboardEvent
  ) {
    if (event.isDefaultPrevented()) {
      return;
    }
    if (isDeleteKey(event.key)) {
      event.preventDefault();
      onTagUnvote(tag);
    }
  }

  function onClickTag(tag: TagOutOrInput, _index: number, event: MouseEvent) {
    if (event.isDefaultPrevented()) {
      return;
    }
    if (propsOnClickTag) {
      propsOnClickTag(tag);
    }
  }

  function onClickTagVote(
    tag: TagOutOrInput,
    _index: number,
    event: MouseEvent
  ) {
    const vote = find(votes, (vote) => tagEqual(vote.tag, tag));

    if (vote?.polarity === votePolarity.POSITIVE) {
      onTagUnvote(tag);
    } else if (onTagVote) {
      onTagVote(tag);
    }
    event.preventDefault();
  }

  function onClickTagAntivote(
    tag: TagOutOrInput,
    _index: number,
    event: MouseEvent
  ) {
    const vote = find(votes, (vote) => tagEqual(vote.tag, tag));
    if (vote?.polarity === votePolarity.NEGATIVE) {
      onTagUnvote(tag);
    } else if (onTagAntivote && tag.id) {
      // Only anti-tag existing tags on existing targets (the point of anti-tagging is to vote against tags recommended
      //  by the system; the system can't recommend tags for targets/tags that don't exist.
      onTagAntivote(tag);
    }
    event.preventDefault();
  }

  function addTag(tagName: string) {
    if (!onAddTag) {
      return;
    }
    const cleanTagName = cleanWhitespace(tagName);
    if (!cleanTagName) {
      return;
    }
    const tag = makeCreateTagInput({ name: cleanTagName });
    onAddTag(tag);
  }

  const closeInput = () => {
    if (tagName) {
      addTag(tagName);
    }
    setTagName("");
    setIsInputCollapsed(true);
  };

  const tagNameAutocompleteId = combineIds(id, "tag-name");
  const extraChildren = [];
  if (!inputCollapsable || !isInputCollapsed) {
    extraChildren.push(
      <TagNameAutocomplete
        id={tagNameAutocompleteId}
        key={tagNameAutocompleteId}
        name="tagName"
        value={tagName}
        autoFocus={autoFocus}
        className="tag-name-autocomplete"
        suggestionsKey={suggestionsKey}
        onAutoComplete={onTagNameAutocomplete}
        onPropertyChange={onTagNamePropertyChange}
        onKeyDown={onTagNameKeyDown}
        rightControls={
          inputCollapsable ? (
            <IconButton onClick={() => closeInput()}>
              <FontIcon>done</FontIcon>
            </IconButton>
          ) : undefined
        }
        autocompleteDebounceMs={autocompleteDebounceMs}
      />
    );
  }
  if (inputCollapsable && isInputCollapsed) {
    extraChildren.push(
      <IconButton
        onClick={() => setIsInputCollapsed(false)}
        title={addTitle}
        key="show-input"
      >
        <FontIcon>add</FontIcon>
      </IconButton>
    );
  }

  return (
    <TagsViewer
      id={id}
      removable={true}
      {...rest}
      tags={tags}
      votes={votes}
      recommendedTags={recommendedTags}
      votePolarity={votePolarity}
      extraChildren={extraChildren}
      onKeyDownTag={onKeyDownTag}
      onClickTag={onClickTag}
      onClickTagVote={onClickTagVote}
      onClickTagAntivote={onClickTagAntivote}
      mode={mode}
    />
  );
}
