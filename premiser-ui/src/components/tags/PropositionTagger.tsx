import React from "react";
import find from "lodash/find";

import {
  EntityId,
  PropositionTagVoteOut,
  Tag,
  tagEqual,
  TagOut,
} from "howdju-common";

import { combineIds, combineSuggestionsKeys } from "@/viewModels";
import { api, goto } from "@/actions";
import TagsControl, { TagOutOrInput } from "./TagsControl";
import { useAppDispatch } from "@/hooks";
import { ComponentId, SuggestionsKey } from "@/types";
import { toCompatibleTagVotes } from "@/util";

interface Props {
  id: ComponentId;
  tags?: TagOut[];
  votes: PropositionTagVoteOut[];
  recommendedTags?: TagOut[];
  suggestionsKey: SuggestionsKey;
  propositionId: EntityId;
  /** Whether to autofocus the tag text input when it appears. */
  autoFocus?: boolean;
}

// TODO replace with Tagger.
const PropositionTagger: React.FC<Props> = (props: Props) => {
  const {
    id,
    tags = [],
    votes = [],
    recommendedTags,
    suggestionsKey,
    propositionId,
    autoFocus,
    ...rest
  } = props;

  const dispatch = useAppDispatch();

  const onClickTag = (tag: TagOutOrInput) => {
    if (!tag.id) {
      return;
    }
    dispatch(goto.tag(tag as TagOut));
  };

  const onTagVote = (tag: Tag) => {
    const propositionTagVote = find(votes, (vote) => tagEqual(vote.tag, tag));
    dispatch(api.tagProposition(propositionId, tag, propositionTagVote));
  };

  const onTagAntivote = (tag: Tag) => {
    const propositionTagVote = find(votes, (vote) => tagEqual(vote.tag, tag));
    dispatch(api.antiTagProposition(propositionId, tag, propositionTagVote));
  };

  const onTagUnvote = (tag: Tag) => {
    const propositionTagVote = find(votes, (vote) => tagEqual(vote.tag, tag));
    // We can only delete a vote whose ID we have.  We can get here if the user quickly tags and
    // untags
    // TODO(280) this sounds like a race condition. If the user has tagged, then we should wait for
    // the ID to arrive and then untag based upon the ID.
    if (propositionTagVote?.id) {
      dispatch(api.unTagProposition(propositionTagVote));
    }
  };

  const compatibleVotes = toCompatibleTagVotes(votes);

  return (
    <TagsControl
      {...rest}
      id={combineIds(id, "tags")}
      mode="vote"
      tags={tags}
      votes={compatibleVotes}
      recommendedTags={recommendedTags}
      suggestionsKey={combineSuggestionsKeys(suggestionsKey, "tagName")}
      onAddTag={onTagVote}
      onTagVote={onTagVote}
      onTagUnvote={onTagUnvote}
      onTagAntivote={onTagAntivote}
      onClickTag={onClickTag}
      inputCollapsable={true}
      autoFocus={autoFocus}
    />
  );
};

export default PropositionTagger;
