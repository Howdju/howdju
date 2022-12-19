/**
 * Models that define requests and responses to APIs.
 *
 * Requests often will contain CreateX or EditX models. Responses often will contain XOuts.
 * Where X is an Entity.
 */

import { ApiErrorCode } from "./codes";
import { ModelErrors } from "./zodError";
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

/**
 * An out model representing errors for any CRUD action.
 *
 * @typeparam T the shape of the In model. Determines the shape of the errors.
 */
export interface ModelErrorOut<T extends object> {
  /** The overall error code. */
  errorCode: ApiErrorCode;
  /** The errors corresponding to the in model. */
  errors: ModelErrors<T>;
}

export interface GetPropositionResponse {
  proposition: PropositionOut;
}

export interface PropositionOut
  extends Persisted<Proposition>,
    TaggedEntityOut {
  justifications?: JustificationOut[];
  propositionTagVotes?: PropositionTagVoteOut[];
}

export type JustificationOut = Persisted<Justification> & {
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
  // The sorting score for the current user
  score?: number;
  // Justifications countering this justification.
  counterJustifications?: JustificationOut[];
};

// TagVoteViewModel don't need a target because they are added to their targets
export type TagVoteViewModel = Omit<TagVote, "target">;

export type PropositionTagVoteOut = Omit<PropositionTagVote, "proposition">;

export interface TaggedEntityOut extends Persisted<Entity> {
  tags?: Tag[];
  // TODO put votes on tags and type it as a viewmodel
  tagVotes?: TagVoteViewModel[];
  recommendedTags?: Tag[];
}
