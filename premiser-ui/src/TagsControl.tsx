import React, { FormEvent, useState } from "react";
import find from "lodash/find";
import get from "lodash/get";
import includes from "lodash/includes";
import { Button } from "react-md";

import {
  makeTag,
  cleanWhitespace,
  tagEqual,
  Tag,
  TagVote,
  logger,
} from "howdju-common";

import { combineIds } from "./viewModels";
import TagNameAutocomplete from "./TagNameAutocomplete";
import TagsViewer from "./TagsViewer";
import { Keys } from "./keyCodes";
import {
  ComponentId,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";

import "./TagsControl.scss";

export type OnClickTagCallback = (tag: Tag) => void;
export type OnTagCallback = (tag: Tag) => void;
export type OnUntagCallback = (tag: Tag) => void;
export type OnAntitagCallback = (tag: Tag) => void;

export interface Props {
  id: ComponentId;
  tags: Tag[];
  votes: TagVote[];
  recommendedTags?: Tag[];
  commitChipKeys?: string[];
  suggestionsKey: SuggestionsKey;
  votePolarity?: {
    POSITIVE: string;
    NEGATIVE: string;
  };
  onClickTag?: OnClickTagCallback;
  /**
   * Callback to respond to when a user has tagged something.
   *
   * The callback may want to add the tag to an editor or make an API call to add the tag.
   */
  onTag: OnTagCallback;
  /** Callback to respond when a user has removed an existing tag. */
  onUnTag: OnUntagCallback;
  /**
   * Callback to respond to when a user has anti-tagged something.
   *
   * An anti tag is a vote against the tag applying to the target.
   */
  onAntiTag?: OnAntitagCallback;
  /** Enable collapsing the tag name input */
  inputCollapsable?: boolean;
  addTitle?: string;
  /** The autocomplete suggestion fetch debounce milliseconds. */
  autocompleteDebounceMs?: number;
}

export default function TagsControl(props: Props) {
  const {
    tags,
    votes,
    recommendedTags,
    commitChipKeys = [Keys.COMMA],
    id,
    suggestionsKey,
    votePolarity = {
      POSITIVE: "POSITIVE",
      NEGATIVE: "NEGATIVE",
    },
    inputCollapsable,
    // ignore
    onTag,
    onUnTag,
    onAntiTag,
    addTitle = "Add tag",
    autocompleteDebounceMs,
    ...rest
  } = props;

  const [tagName, setTagName] = useState("");
  const [isInputCollapsed, setIsInputCollapsed] = useState(true);

  function submitTagName(event: FormEvent<HTMLFormElement>) {
    // Stop it from submitting an enclosing form
    event.preventDefault();
    // Stop it from propagating to an enclosing form
    event.stopPropagation();

    addTag(tagName);
    setTagName("");
    if (inputCollapsable) {
      setIsInputCollapsed(true);
    }
  }

  const onTagNameKeyDown: OnKeyDownCallback = (event) => {
    if (includes(commitChipKeys, event.key) && tagName) {
      event.preventDefault();
      addTag(tagName);
      setTagName("");
    }
  };

  const onTagNamePropertyChange: OnPropertyChangeCallback = (properties) => {
    setTagName(properties.tagName);
  };

  const onTagNameAutocomplete = (tag: Tag) => {
    onTag(tag);
    setTagName("");
  };

  const onClickTag = (tagName: string) => {
    if (props.onClickTag) {
      const tag = find(tags, (tag) => tag.name === tagName);
      if (!tag) {
        logger.error(`onClickTag: no tag wiyh name ${tagName}`);
        return;
      }
      props.onClickTag(tag);
    }
  };

  const onClickAvatar = (tagName: string) => {
    const tag = find(tags, (tag) => tag.name === tagName);
    if (!tag) {
      logger.error(`onClickAvatar: no tag wiyh name ${tagName}`);
      return;
    }
    const vote = find(votes, (vote) => tagEqual(vote.tag, tag));

    const polarity = get(vote, "polarity");
    if (polarity === votePolarity.POSITIVE) {
      onUnTag(tag);
    } else {
      onTag(tag);
    }
  };

  const onRemoveTag = (tagName: string) => {
    const tag = find(tags, (tag) => tag.name === tagName);
    if (!tag) {
      logger.error(`onRemoveTag: no tag with name ${tagName}`);
      return;
    }

    const vote = find(votes, (vote) => tagEqual(vote.tag, tag));
    const polarity = get(vote, "polarity");
    if (polarity === votePolarity.POSITIVE) {
      onUnTag(tag);
    } else if (onAntiTag && tag.id) {
      // Only anti-tag existing tags on existing targets (the point of anti-tagging is to vote against tags recommended
      //  by the system; the system can't recommend tags for targets/tags that don't exist.
      onAntiTag(tag);
    }
  };

  const addTag = (tagName: string) => {
    const cleanTagName = cleanWhitespace(tagName);
    if (!cleanTagName) {
      return;
    }
    const tag = makeTag({ name: cleanTagName });
    onTag(tag);
  };

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
      // This form makes it easier to receive a submit only when the autocomplete listbox is closed.
      // But it also makes it possible for us to nest forms, which is tecnically invalid HTML.
      // Other solutions include updating AutoComplete to call onKeyDown after it has
      // preventedDefault so that our onKeyDown could inspect that and do nothing. Or to define a
      // custom onKeyDown that passes information about the current AutoComplete state, like whether
      // the listbox is visible.
      <form onSubmit={submitTagName}>
        <TagNameAutocomplete
          id={tagNameAutocompleteId}
          key={tagNameAutocompleteId}
          name="tagName"
          value={tagName}
          className="tag-name-autocomplete"
          suggestionsKey={suggestionsKey}
          onAutoComplete={onTagNameAutocomplete}
          onPropertyChange={onTagNamePropertyChange}
          onKeyDown={onTagNameKeyDown}
          rightControls={
            inputCollapsable ? (
              <Button icon onClick={() => closeInput()}>
                done
              </Button>
            ) : undefined
          }
          autocompleteDebounceMs={autocompleteDebounceMs}
        />
      </form>
    );
  }
  if (inputCollapsable && isInputCollapsed) {
    extraChildren.push(
      <Button
        icon
        onClick={() => setIsInputCollapsed(false)}
        title={addTitle}
        key="show-input"
      >
        add
      </Button>
    );
  }

  const removeIconName = onAntiTag ? "thumb_down" : "clear";

  return (
    <TagsViewer
      removable={true}
      {...rest}
      tags={tags}
      votes={votes}
      recommendedTags={recommendedTags}
      votePolarity={votePolarity}
      extraChildren={extraChildren}
      onClickTag={onClickTag}
      onClickAvatar={onClickAvatar}
      onRemoveTag={onRemoveTag}
      removeIconName={removeIconName}
    />
  );
}
