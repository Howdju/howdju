import React from "react";
import find from "lodash/find";

import {
  EntityId,
  PropositionTagVotePolarities,
  PropositionTagVoteOut,
  Tag,
  tagEqual,
  TagVote,
} from "howdju-common";

import { combineIds, combineSuggestionsKeys } from "./viewModels";
import { api, goto } from "./actions";
import TagsControl from "./TagsControl";
import { useAppDispatch } from "./hooks";
import { ComponentId, SuggestionsKey } from "./types";

interface Props {
  id: ComponentId;
  tags?: Tag[];
  votes: PropositionTagVoteOut[];
  recommendedTags?: Tag[];
  suggestionsKey: SuggestionsKey;
  propositionId: EntityId;
}

const PropositionTagger: React.FC<Props> = (props: Props) => {
  const {
    id,
    tags = [],
    votes = [],
    recommendedTags,
    suggestionsKey,
    propositionId,
    ...rest
  } = props;

  const dispatch = useAppDispatch();

  const onClickTag = (tag: Tag) => {
    dispatch(goto.tag(tag));
  };

  const onTag = (tag: Tag) => {
    const propositionTagVote = find(votes, (vote) => tagEqual(vote.tag, tag));
    dispatch(api.tagProposition(propositionId, tag, propositionTagVote));
  };

  const onAntiTag = (tag: Tag) => {
    const propositionTagVote = find(votes, (vote) => tagEqual(vote.tag, tag));
    dispatch(api.antiTagProposition(propositionId, tag, propositionTagVote));
  };

  const onUnTag = (tag: Tag) => {
    const propositionTagVote = find(votes, (vote) => tagEqual(vote.tag, tag));
    // We can only delete a vote whose ID we have.  We can get here if the user quickly tags and
    // untags
    // TODO: this sounds like a race condition. If hte user has tagged, then we should wait for
    // the ID to arrive and then untag based upon the ID.
    if (propositionTagVote?.id) {
      dispatch(api.unTagProposition(propositionTagVote));
    }
  };

  const compatibleVotes = votes.map(
    (v) =>
      ({
        ...v,
        target: v.proposition,
        targetType: "PROPOSITION",
      } as TagVote)
  );

  return (
    <TagsControl
      {...rest}
      id={combineIds(id, "tags")}
      tags={tags}
      votes={compatibleVotes}
      recommendedTags={recommendedTags}
      votePolarity={{
        POSITIVE: PropositionTagVotePolarities.POSITIVE,
        NEGATIVE: PropositionTagVotePolarities.NEGATIVE,
      }}
      suggestionsKey={combineSuggestionsKeys(suggestionsKey, "tagName")}
      onTag={onTag}
      onUnTag={onUnTag}
      onAntiTag={onAntiTag}
      onClickTag={onClickTag}
      inputCollapsable={true}
    />
  );
};

export default PropositionTagger;
