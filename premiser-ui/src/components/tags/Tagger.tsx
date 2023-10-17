import React from "react";
import find from "lodash/find";

import {
  Tag,
  tagEqual,
  TaggableEntityType,
  TaggedEntityOut,
  TagOut,
  TagVoteRef,
} from "howdju-common";

import { combineIds, combineSuggestionsKeys } from "@/viewModels";
import { api, goto } from "@/actions";
import TagsControl, { TagOutOrInput } from "./TagsControl";
import { useAppDispatch } from "@/hooks";
import { ComponentId, SuggestionsKey } from "@/types";

interface Props {
  target: TaggedEntityOut;
  id: ComponentId;
  suggestionsKey: SuggestionsKey;
  targetType: TaggableEntityType;
}

const Tagger: React.FC<Props> = (props: Props) => {
  const {
    target: { id: targetId, tags, tagVotes, recommendedTags },
    id,
    suggestionsKey,
    targetType,
    ...rest
  } = props;

  const dispatch = useAppDispatch();

  const onClickTag = (tag: TagOutOrInput) => {
    if (!tag.id) {
      return;
    }
    dispatch(goto.tag(tag as TagOut));
  };

  const findTagVote = (tag: Tag) => {
    return find(tagVotes, (vote) => tagEqual(vote.tag, tag));
  };

  const onTagVote = (tag: Tag) => {
    const tagVote = findTagVote(tag);
    dispatch(api.createTag(targetType, targetId, tag, tagVote));
  };

  const onTagAntivote = (tag: Tag) => {
    const tagVote = findTagVote(tag);
    dispatch(api.createAntiTag(targetType, targetId, tag, tagVote));
  };

  const onTagUnvote = (tag: Tag) => {
    const tagVote = findTagVote(tag);
    // We can only delete a vote whose ID we have.  We might be untagging a vote lacking an ID if the user quickly tags/untags
    if (tagVote?.id) {
      dispatch(api.unTag(TagVoteRef.parse(tagVote)));
    }
  };

  return (
    <TagsControl
      {...rest}
      id={combineIds(id, "tags")}
      mode="vote"
      tags={tags ?? []}
      votes={tagVotes ?? []}
      recommendedTags={recommendedTags}
      suggestionsKey={combineSuggestionsKeys(suggestionsKey, "tagName")}
      onAddTag={onTagVote}
      onTagVote={onTagVote}
      onTagUnvote={onTagUnvote}
      onTagAntivote={onTagAntivote}
      onClickTag={onClickTag}
      inputCollapsable={true}
    />
  );
};

export default Tagger;
