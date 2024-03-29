import React, { useState } from "react";
import cn from "classnames";
import {
  concat,
  filter,
  find,
  get,
  map,
  sortBy,
  zipObject,
  some,
} from "lodash";
import { Avatar } from "@react-md/avatar";
import { FontIcon } from "@react-md/icon";
import { MaterialSymbol } from "react-material-symbols";

import { tagEqual, Tag, TagVote } from "howdju-common";

import { ChipsList } from "@/components/chip/ChipsList";
import { Chip } from "@/components/chip/Chip";
import { ComponentId, ListClickCallback, ListKeyDownCallback } from "@/types";
import TextButton from "@/components/button/TextButton";

import "./TagsViewer.scss";

/**
 * The mode of the TagsViewer.
 *
 * `add` is only for adding tags, say in an editor for a new entity where
 * voting against the tag doesn't make sense since the entity doesn't exist yet.
 *
 * `vote` is for adding tags to an existing entity, where a vote for or against
 * the tag applying to the entity makes sense.
 *
 * `view` is only for viewing tags. They cannot be added or voted on.s
 */
export type TagViewerMode = "view" | "add" | "vote";

export interface TagsViwerProps {
  id: ComponentId;
  tags: Tag[];
  recommendedTags?: Tag[];
  votable?: boolean;
  /** Determines the value of votes considered voted for and against for display. */
  votePolarity?: {
    POSITIVE: string;
    NEGATIVE: string;
  };
  removable?: boolean;
  extraChildren?: JSX.Element[];
  votes?: TagVote[];
  mode: TagViewerMode;
  /** Callback for when a user keys down on a tag. */
  onKeyDownTag?: ListKeyDownCallback<Tag>;
  /** Callback for when a user clicks a tag's main content. */
  onClickTag: ListClickCallback<Tag>;
  /** Callback for when a user clicks a tag's vote icon. */
  onClickTagVote?: ListClickCallback<Tag>;
  /** Callback for when a user clicks a tag's anti-vote icon. */
  onClickTagAntivote?: ListClickCallback<Tag>;
  /** Whether the viewer supports hiding tags. */
  canHide?: boolean;
}

/** Displays a list of tags as chips. */
export default function TagsViewer({
  id,
  tags,
  votes = [],
  recommendedTags,
  votePolarity = { POSITIVE: "POSITIVE", NEGATIVE: "NEGATIVE" },
  extraChildren = [],
  onKeyDownTag,
  onClickTag,
  onClickTagVote,
  onClickTagAntivote,
  canHide = true,
  mode,
}: TagsViwerProps) {
  const [doShowAllTags, setDoShowAllTags] = useState(false);

  const voteByTagName = zipObject(
    map(votes, (vote) => vote.tag.name),
    votes
  );

  const alwaysVisibleTags = filter(tags, (tag) => {
    const isRecommended = some(recommendedTags, (recommendedTag) =>
      tagEqual(recommendedTag, tag)
    );
    const vote = voteByTagName[tag.name];
    const polarity = get(vote, "polarity");
    const isVoted = polarity === votePolarity.POSITIVE;
    const isAntiVoted = polarity === votePolarity.NEGATIVE;
    return isVoted || (isRecommended && !isAntiVoted);
  });
  const visibleTags = !canHide || doShowAllTags ? tags : alwaysVisibleTags;

  const hasHideableTags = alwaysVisibleTags.length < tags.length;
  const hideControls = [];
  if (canHide && hasHideableTags) {
    if (doShowAllTags) {
      hideControls.push(
        <TextButton
          key="dont-show-all-button"
          onClick={() => setDoShowAllTags(false)}
        >
          Show fewer
        </TextButton>
      );
    } else {
      hideControls.push(
        <TextButton
          key="show-all-button"
          onClick={() => setDoShowAllTags(true)}
        >
          Show all
        </TextButton>
      );
    }
  }

  const sortedVisibleTags = sortBy(visibleTags, (tag) => {
    const vote = voteByTagName[tag.name];
    const polarity = get(vote, "polarity");
    const isVoted = polarity && polarity === votePolarity.POSITIVE;
    const isAntiVoted = polarity && polarity === votePolarity.NEGATIVE;
    const isRecommended = find(recommendedTags, (recommendedTag) =>
      tagEqual(recommendedTag, tag)
    );

    if (isVoted) {
      return -2;
    }
    if (isAntiVoted) {
      return 2;
    }
    if (isRecommended) {
      return -1;
    }
    return 1;
  });

  const chips = map(sortedVisibleTags, (tag, i) => {
    const vote = voteByTagName[tag.name];
    const polarity = get(vote, "polarity");
    const isVoted = polarity && polarity === votePolarity.POSITIVE;
    const isAntivoted = polarity && polarity === votePolarity.NEGATIVE;
    const voteLabel = isVoted
      ? `Remove vote for tag ${tag.name}`
      : `Vote for tag ${tag.name}`;
    const antivoteLabel = isAntivoted
      ? `Remove vote against tag ${tag.name}`
      : `Vote against tag ${tag.name}`;
    return (
      <Chip
        key={tag.name}
        className={cn({
          "has-vote": isVoted,
          "has-antivote": isAntivoted,
        })}
        theme="outline"
        onKeyDown={(e) => onKeyDownTag && onKeyDownTag(tag, i, e)}
        onClick={(e) => onClickTag(tag, i, e)}
        leftIcon={
          mode === "vote" && (
            <Avatar
              aria-label={voteLabel}
              title={voteLabel}
              onClick={(e) => onClickTagVote && onClickTagVote(tag, i, e)}
            >
              <MaterialSymbol icon="thumb_up" className="flipped-icon" />
            </Avatar>
          )
        }
        rightIcon={
          mode === "vote" ? (
            <Avatar
              aria-label={antivoteLabel}
              title={antivoteLabel}
              onClick={(e) =>
                onClickTagAntivote && onClickTagAntivote(tag, i, e)
              }
            >
              <MaterialSymbol icon="thumb_down" className="flipped-icon" />
            </Avatar>
          ) : mode === "add" ? (
            <Avatar
              aria-label={`Remove tag ${tag.name}`}
              onClick={(e) =>
                onClickTagAntivote && onClickTagAntivote(tag, i, e)
              }
            >
              <FontIcon>close</FontIcon>
            </Avatar>
          ) : null
        }
      >
        {tag.name}
      </Chip>
    );
  });

  const extraChipListChildren = concat(hideControls, extraChildren);

  return (
    <ChipsList id={id} chips={chips} extraChildren={extraChipListChildren} />
  );
}
