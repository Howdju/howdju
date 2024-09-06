import { z } from "zod";
import { CamelCasedProperties, MergeDeep, Simplify } from "type-fest";
import { toString } from "lodash";

import {
  AccountSettings,
  camelCaseKeysDeep,
  ContentReport,
  CreateRegistrationRequest,
  Justification,
  JustificationBasisType,
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationRootTargetType,
  JustificationTargetType,
  JustificationVote,
  JustificationVotePolarity,
  PersistedJustificationWithRootRef,
  PasswordResetRequest,
  Persisted,
  PersistedOrRef,
  PersistRelated,
  Persorg,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  PropositionTagVotePolarity,
  RegistrationRequest,
  SentenceType,
  Statement,
  User,
  UserExternalIds,
  Writ,
  WritQuote,
  EntityId,
  BasedJustificationWithRootRef,
  PersistedEntity,
  CreateJustificationInput,
  PropositionCreatedAsType,
  StatementCreatedAsType,
} from "howdju-common";
import { Moment } from "moment";
import { toIdString } from "./daosUtil";

export const EntityRowId = z.number().transform(toString);
export type EntityRowId = number;

export type JustStatement = Omit<
  Statement,
  "id" | "sentence" | "speaker" | "creator"
> &
  PersistedEntity & {
    sentence: { id: EntityId };
    speaker: { id: EntityId };
    creator: { id: EntityId };
  };

export interface PropositionRow {
  proposition_id: EntityRowId;
  text: string;
  normal_text: string;
  created: Moment;
  creator_user_id: EntityRowId;
  creator_long_name?: string;
  created_as_type?: PropositionCreatedAsType;
  created_as_appearance_id?: EntityRowId;
  created_as_statement_id?: EntityRowId;
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
  speaker_persorg_id: EntityRowId;
  creator_user_id: EntityRowId;
  created: Moment;
  created_as_type: StatementCreatedAsType;
  created_as_statement_id?: EntityRowId;
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

export interface SourceRow {
  source_id: EntityRowId;
  description: string;
  normal_description: string;
  creator_user_id: EntityRowId;
  created: Moment;
}

export type SpeakerBlurbRow = Pick<
  PersorgRow,
  "persorg_id" | "is_organization" | "name"
>;
export function toSpeakerBlurbMapper({ persorg_id, ...rest }: SpeakerBlurbRow) {
  return {
    id: toIdString(persorg_id),
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

export type JustificationRootTargetData =
  | {
      rootTargetType: "PROPOSITION";
      rootTarget: PersistedEntity;
    }
  | {
      rootTargetType: "STATEMENT";
      rootTarget: PersistedEntity;
    };
export type CreateJustificationDataIn = JustificationRootTargetData &
  Simplify<
    Omit<
      CreateJustificationInput,
      "basis" | "target" | "rootTargetType" | "rootTarget" | "rootPolarity"
    > & {
      basis:
        | {
            type: "PROPOSITION_COMPOUND";
            entity: PersistedEntity;
          }
        | {
            type: "MEDIA_EXCERPT";
            entity: PersistedEntity;
          }
        | {
            type: "SOURCE_EXCERPT";
            entity: PersistedEntity;
          }
        | {
            type: "WRIT_QUOTE";
            entity: PersistedEntity;
          };
      target:
        | {
            type: "PROPOSITION";
            entity: PersistedEntity;
          }
        | {
            type: "STATEMENT";
            entity: PersistedEntity;
          }
        | {
            type: "JUSTIFICATION";
            entity: PersistedEntity;
          };
    }
  >;

export type BasedJustificationDataOut = BasedJustificationWithRootRef & {
  creator?: CreatorBlurbData | PersistedEntity;
  counterJustifications: BasedJustificationDataOut[];
  score?: number;
  vote?: JustificationVoteData;
};

export type ReadJustificationDataOut = PersistedJustificationWithRootRef & {
  creator?: CreatorBlurbData | PersistedEntity;
  counterJustifications: BasedJustificationDataOut[];
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
export type ReadPropositionCompoundDataOut = MergeDeep<
  Persisted<PropositionCompound>,
  {
    atoms: {
      propositionCompoundId: EntityId;
      entity: Persisted<Proposition> & {
        rootJustificationCountByPolarity?: Partial<
          Record<"POSITIVE" | "NEGATIVE", number>
        >;
      };
    }[];
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
}
export type UserExternalIdsData = UserExternalIds;

/** A short description of a user attached to something the user created to show authorship. */
export type CreatorBlurbRow = Pick<UserRow, "user_id" | "long_name">;
export type CreatorBlurbData = PersistedEntity &
  Pick<Persisted<User>, "longName">;

export interface UserHashRow {
  user_id: number;
  hash: string;
}
export interface UserHashData {
  userId: string;
  hash: string;
}

export interface JustificationScoreRow {
  justification_id: number;
  score_type: string;
  score: number;
  created: Moment;
  creator_job_history_id: number;
  deletor_job_history_id: number;
}
export type JustificationScoreData =
  CamelCasedProperties<JustificationScoreRow>;

export interface PropositionTagVoteRow {
  proposition_tag_vote_id: number;
  polarity: PropositionTagVotePolarity;
  proposition_id: number;
  tag_id: number;
  tag_name: string;
}
export type PropositionTagVoteData = Persisted<PropositionTagVote>;

export interface PropositionTagScoreRow {
  proposition_id: number;
  tag_id: number;
  score_type: string;
  score: number;
  created: number;
  creator_job_history_id: number;
  deletor_job_history_id: number;
}
export type PropositionTagScoreData =
  CamelCasedProperties<PropositionTagScoreRow>;

export interface RegistrationRequestRow {
  registration_request_id: number;
  email: string;
  registration_code: string;
  is_consumed: boolean;
  expires: Moment;
  created: Moment;
}
export type RegistrationRequestData = Persisted<RegistrationRequest>;

export type CreateRegistrationRequestData = CreateRegistrationRequest & {
  expires: Moment;
};

export interface PasswordResetRequestRow {
  password_reset_request_id: number;
  user_id: number;
  email: string;
  password_reset_code: string;
  expires: Moment;
  isConsumed: boolean;
  created: Moment;
}
export type PasswordResetRequestData = Persisted<PasswordResetRequest>;

export interface AccountSettingsRow {
  account_settings_id: number;
  user_id: number;
  paid_contributions_disclosure: string;
}
export type AccountSettingsData = Persisted<AccountSettings> & {
  // TODO: remove in favor of id, which should always equal the user's ID.
  userId: string;
};

export interface ContentReportRow {
  content_report_id: number;
  entity_type: string;
  entity_id: number;
  url: string;
  types: string[];
  description: string;
  reporter_user_id: number;
  created: Moment;
}
export type ContentReportData = Persisted<ContentReport>;
