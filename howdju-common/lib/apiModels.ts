/**
 * Models that define requests and responses to APIs.
 *
 * Requests often will contain CreateX or EditX models. Responses often will contain XOuts.
 * Where X is an Entity.
 */

import { ApiErrorCode } from "./codes";
import { ContinuationToken } from "./entities";
import { ModelErrors } from "./zodError";
import {
  CreateJustification,
  CreateProposition,
  Entity,
  Justification,
  JustificationVote,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  Tag,
  TagVote,
} from "./zodSchemas";
import { Persisted, PersistRelated } from "./zodSchemaTypes";

/**
 * An out model representing errors for any CRUD action.
 *
 * @typeparam T the shape of the In model. Determines the shape of the errors.
 */
export interface ErrorOut<T extends object> {
  /** The overall error code. */
  errorCode: ApiErrorCode;
  /** The errors corresponding to the in model. */
  errors: ModelErrors<T>;
}

export interface PostPropositionIn {
  proposition: CreateProposition;
}

export interface PostPropositionOut {
  proposition: PropositionOut;
}

export interface PostJustificationIn {
  justification: CreateJustification;
}

export interface PostJustificationOut {
  justification: Persisted<Justification>;
}

export interface GetPropositionOut {
  proposition: PropositionOut;
}

export interface GetPropositionsOut {
  propositions: PropositionOut[];
  continuationToken: ContinuationToken;
}

export interface PropositionOut
  extends Persisted<Proposition>,
    TaggedEntityOut<Proposition> {
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

export type PropositionCompoundOut = Persisted<PropositionCompound>;

export type PropositionCompoundAtomOut =
  PersistRelated<PropositionCompoundAtom>;

// TagVoteViewModel don't need a target because they are added to their targets
export type TagVoteViewModel = TagVote;

export type PropositionTagVoteOut = Persisted<PropositionTagVote>;

export type TaggedEntityOut<T extends Entity = Entity> = Persisted<T> & {
  tags?: Tag[];
  // TODO put votes on tags and type it as a viewmodel
  tagVotes?: TagVoteViewModel[];
  recommendedTags?: Tag[];
};
