import React, { useState } from "react";
import cn from "classnames";
import concat from "lodash/concat";
import filter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import map from "lodash/map";
import sortBy from "lodash/sortBy";
import zipObject from "lodash/zipObject";
import { some } from "lodash";

import { tagEqual, Tag, TagVote } from "howdju-common";

import ChipsList from "./ChipsList";
import { ListClickCallback, ListEventCallback } from "./types";

import "./TagsViewer.scss";
import TextButton from "./components/button/TextButton";

interface Props {
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
  removeIconName?: string;
  onClickTag: ListClickCallback<string>;
  onClickAvatar?: ListClickCallback<string>;
  onRemoveTag?: ListEventCallback<string>;
  canHide?: boolean;
}

/** A list of tags. */
export default function TagsViewer(props: Props) {
  const {
    tags,
    votes = [],
    recommendedTags,
    votePolarity = { POSITIVE: "POSITIVE", NEGATIVE: "NEGATIVE" },
    extraChildren = [],
    votable = true,
    removable = false,
    onClickTag,
    onClickAvatar,
    onRemoveTag,
    removeIconName = "clear",
    canHide = true,
  } = props;

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
          Don&rquo;t show all
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

  const chips = map(sortedVisibleTags, (tag) => {
    const vote = voteByTagName[tag.name];
    const polarity = get(vote, "polarity");
    const isVoted = polarity && polarity === votePolarity.POSITIVE;
    const isAntiVoted = polarity && polarity === votePolarity.NEGATIVE;
    return {
      label: tag.name,
      isAntiVoted,
      className: cn({
        "has-vote": isVoted,
        "has-anti-vote": isAntiVoted,
      }),
    };
  });

  const extraChipListChildren = concat(hideControls, extraChildren);

  return (
    <ChipsList
      chips={chips}
      extraChildren={extraChipListChildren}
      removable={removable}
      onClickChip={onClickTag}
      onClickAvatar={onClickAvatar}
      onRemoveChip={onRemoveTag}
      removeIconName={removeIconName}
      showAvatars={votable}
    />
  );
}
