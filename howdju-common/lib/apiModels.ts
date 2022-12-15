/**
 * Models that define requests and responses to APIs.
 *
 * Requests often will contain CreateX models. Responses often will contain XViewModels.
 * Where X is an Entity.
 */

import {
  Entity,
  Justification,
  JustificationVote,
  Proposition,
  PropositionTagVote,
  Tag,
  TagVote,
} from "./zodSchemas";
import { Persisted } from "./zodSchemaTypes";

export interface GetPropositionResponse {
  proposition: PropositionOutModel;
}

export interface PropositionOutModel
  extends Persisted<Proposition>,
    TaggedEntityViewModel {
  justifications?: JustificationOutModel[];
  propositionTagVotes?: PropositionTagVoteViewModel[];
}

export type JustificationOutModel = Persisted<Justification> & {
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
  // The sorting score for the current user
  score?: number;
  // Justifications countering this justification.
  counterJustifications?: JustificationOutModel[];
};

// TagVoteViewModel don't need a target because they are added to their targets
export type TagVoteViewModel = Omit<TagVote, "target">;

export type PropositionTagVoteViewModel = Omit<
  PropositionTagVote,
  "proposition"
>;

export interface TaggedEntityViewModel extends Persisted<Entity> {
  tags?: Tag[];
  // TODO put votes on tags and type it as a viewmodel
  tagVotes?: TagVoteViewModel[];
  recommendedTags?: Tag[];
}
