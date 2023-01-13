import { z } from "zod";
import { CamelCasedProperties, MergeDeep } from "type-fest";
import { camelCase, mapKeys, toString } from "lodash";

import {
  camelCaseKeysDeep,
  CreateJustification,
  EntityRef,
  Justification,
  JustificationBasisType,
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationRootTarget,
  JustificationRootTargetType,
  JustificationTargetType,
  JustificationVote,
  JustificationVotePolarity,
  JustificationWithRootRef,
  Persisted,
  PersistedOrRef,
  PersistRelated,
  Persorg,
  PersorgRef,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  SentenceType,
  Statement,
  User,
  UserExternalIds,
  UserRef,
  Writ,
  WritQuote,
} from "howdju-common";
import { Moment } from "moment";
import { toIdString } from "./daosUtil";

export interface SortDescription {
  property: string;
  direction: string;
  /** For continuations, the sort should filter out this value and any before it according to `direction`. */
  value?: string;
}

export type JustificationFilterName =
  // Justifications based on this proposition in a PropositionCompound
  | "propositionId"
  // Justifications based on this PropositionCompound
  | "propositionCompoundId"
  | "sourceExcerptParaphraseId"
  | "writQuoteId"
  | "writId"
  | "justificationId"
  | "url";
export type JustificationFilters = Partial<
  Record<JustificationFilterName, string>
>;

export const EntityRowId = z.number().transform(toString);
export type EntityRowId = number;

const camelCaseKey = (_val: any, key: string) => camelCase(key);

export interface PropositionRow {
  proposition_id: EntityRowId;
  text: string;
  normal_text: string;
  created: Moment;
  creator_user_id?: EntityRowId;
  creator_long_name?: string;
}
export type PropositionData = Persisted<Proposition> & {
  normalText?: string;
  slug?: string;
  creator?: CreatorBlurbData;
};
export type ReadPropositionDataOut = Persisted<Proposition>;

export interface StatementRow {
  statement_id: EntityRowId;
  // TODO get rid of this id in favor of statement_id
  id?: EntityRowId;
  sentence_type: SentenceType;
  sentence_id: EntityRowId;
  created: Moment;
}
export type StatementData = Omit<
  Persisted<Statement>,
  "sentence" | "speaker"
> & {
  creator?: CreatorBlurbData;
  speaker: SpeakerBlurbData;
  sentence: PersistedOrRef<Proposition> | PersistedOrRef<Statement>;
};
export type SentenceData = Statement["sentence"];

export interface PersorgRow {
  persorg_id: EntityRowId;
  is_organization: boolean;
  name: string;
  normal_name: string;
  known_for: string;
  website_url?: string;
  twitter_url?: string;
  wikipedia_url?: string;
  created: Moment;
  modified: Moment;
}
export type PersorgData = Persisted<Persorg> & {
  creator?: CreatorBlurbData;
};

export type SpeakerBlurbRow = Pick<
  PersorgRow,
  "persorg_id" | "is_organization" | "name"
>;
export function toSpeakerBlurbMapper({ persorg_id, ...rest }: SpeakerBlurbRow) {
  return {
    ...PersorgRef.parse({ id: toIdString(persorg_id) }),
    ...camelCaseKeysDeep(rest),
  };
}
export type SpeakerBlurbData = ReturnType<typeof toSpeakerBlurbMapper>;

export interface JustificationBasisCompoundRow {
  justification_basis_compound_id: EntityRowId;
  creator_user_id: EntityRowId;
  created: Moment;
  deleted: Moment;
}

export interface JustificationRow {
  justification_id: EntityRowId;
  // TODO remove this in favor of justification_id
  id?: EntityRowId;
  root_target_id: EntityRowId;
  root_target_type: JustificationRootTargetType;
  root_polarity: JustificationRootPolarity;
  target_type: JustificationTargetType;
  target_id: EntityRowId;
  basis_type: JustificationBasisType;
  basis_id: EntityRowId;
  // TODO(28): remove justification basis compound
  basis_justification_basis_compound_id?: EntityRowId;
  basis_justification_basis_compound_created?: Moment;
  basis_justification_basis_compound_creator_user_id?: EntityRowId;
  polarity: JustificationPolarity;
  creator_user_id: EntityRowId;
  created: Moment;
  deleted?: Moment;
  // TODO: remove these joined proposition columns
  root_target_proposition_id?: EntityRowId;
  root_target_text?: string;
  root_target_created?: Moment;
  root_target_creator_user_id?: EntityRowId;
  // TODO do we ever populate this?
  score?: number;
}
export type CreateJustificationDataIn = PersistRelated<CreateJustification> & {
  rootTargetType: JustificationRootTargetType;
  rootTarget: EntityRef<JustificationRootTarget>;
};
export type CreateJustificationDataOut = Persisted<CreateJustification> & {
  rootPolarity: JustificationRootPolarity;
  created: Moment;
  counterJustifications: [];
  creator: UserRef;
};
export type ReadJustificationDataOut = JustificationWithRootRef & {
  creator?: CreatorBlurbData | EntityRef<User>;
  counterJustifications: ReadJustificationDataOut[];
  score?: number;
  vote?: JustificationVoteData;
};
export type DeleteJustificationDataIn = PersistedOrRef<Justification>;

export type JustificationVoteRow = {
  justification_vote_id: EntityRowId;
  polarity: JustificationVotePolarity;
  justification_id: EntityRowId;
};
export type JustificationVoteData = Persisted<JustificationVote>;

export interface PropositionCompoundRow {
  proposition_compound_id: EntityRowId;
  creator_user_id: EntityRowId;
  created: Moment;
}
export const propositionCompoundRowToData = ({
  proposition_compound_id,
  ...o
}: PropositionCompoundRow) => ({
  id: toString(proposition_compound_id),
  ...(mapKeys(o, camelCaseKey) as CamelCasedProperties<typeof o>),
});
export type ReadPropositionCompoundDataOut = MergeDeep<
  Persisted<PropositionCompound>,
  {
    atoms: {
      entity: Persisted<Proposition> & {
        rootJustificationCountByPolarity: Partial<
          Record<"POSITIVE" | "NEGATIVE", number>
        >;
      };
    };
  }
>;

export interface PropositionCompoundAtomRow {
  proposition_compound_id: EntityRowId;
  proposition_id: EntityRowId;
  order_position: number;
}
export type PropositionCompoundAtomData =
  PersistRelated<PropositionCompoundAtom>;

export interface WritQuoteRow {
  writ_quote_id: EntityRowId;
  quote_text: string;
  normal_quote_text: string;
  writ_id: EntityRowId;
  creator_user_id: EntityRowId;
  created: Moment;
}
export type WritQuoteData = Persisted<WritQuote> & {
  // TODO replace with CreatorBlurb
  creatorUserId: string;
};

export interface WritRow {
  writ_id: EntityRowId;
  title: string;
  created: Moment;
}
export type WritData = Persisted<Writ> & {
  creator: CreatorBlurbData;
};

export interface UserRow {
  user_id: EntityRowId;
  email: string;
  short_name?: string;
  long_name: string;
  phone_number?: string;
  creator_user_id: EntityRowId;
  last_login?: Moment;
  created: Moment;
  deleted: Moment;
  is_active: boolean;
  username: string;
  accepted_terms: Moment;
  affirmed_majority_consent: Moment;
  affirmed_13_years_or_older: Moment;
  affirmed_not_gdpr: Moment;
}
export type UserData = Persisted<User>;
export type CreateUserDataIn = Omit<
  User,
  "created" | "deleted" | "id" | "creatorUserId" | "externalIds"
> & {
  acceptedTerms: Moment;
  affirmedMajorityConsent: Moment;
  affirmed13YearsOrOlder: Moment;
  affirmedNotGdpr: Moment;
};

export interface UserExternalIdsRow {
  google_analytics_id: string;
  heap_analytics_id: string;
  mixpanel_id: string;
  sentry_id: string;
  smallchat_id: string;
}
export type UserExternalIdsData = UserExternalIds;

/** A short description of a user attached to something the user created to show authorship. */
export type CreatorBlurbRow = Pick<UserRow, "user_id" | "long_name">;
export type CreatorBlurbData = Pick<User, "id" | "longName">;

export interface SqlClause {
  sql: string;
  args: any[];
}
