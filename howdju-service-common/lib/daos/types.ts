import { z } from "zod";
import { CamelCasedProperties, MergeDeep } from "type-fest";
import { camelCase, mapKeys, toString } from "lodash";

import {
  CreateJustification,
  EntityName,
  Justification,
  JustificationBasisType,
  JustificationPolarity,
  JustificationRef,
  JustificationRootPolarity,
  JustificationRootTargetType,
  JustificationTargetType,
  newUnimplementedError,
  Persisted,
  PersistedOrRef,
  Proposition,
  PropositionCompound,
  PropositionCompoundRef,
  PropositionRef,
  Ref,
  SourceExcerptRef,
  Statement,
  StatementRef,
  User,
  UserRef,
  WritQuoteRef,
} from "howdju-common";
import { Moment } from "moment";

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
  created: Moment;
}
export type ReadPropositionDataOut = Persisted<Proposition>;

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
  polarity: JustificationPolarity;
  creator_user_id: EntityRowId;
  created: Moment;
  deleted?: Moment;
  // TODO: remove these joined proposition columns
  root_target_proposition_id?: EntityRowId;
  root_target_text?: string;
  root_target_created?: Moment;
  root_target_creator_user_id?: EntityRowId;
}
export const justificationRowToData = ({
  justification_id,
  root_target_id,
  target_type,
  target_id,
  basis_type,
  basis_id,
  creator_user_id,
  ...o
}: JustificationRow): ReadJustificationDataOut => ({
  id: toString(justification_id),
  creator: UserRef.parse({ id: toString(creator_user_id) }),
  rootTarget: { id: toString(root_target_id) },
  target: toTarget(target_type, target_id),
  basis: toBasis(basis_type, basis_id),
  ...(mapKeys(o, camelCaseKey) as CamelCasedProperties<typeof o>),
  counterJustifications: [],
});
export type CreateJustificationDataIn = CreateJustification & {
  rootTargetType: JustificationRootTargetType;
  // TODO(1): I wanted this to be EntityRef<JustificationRootTarget>, but zod's brand doesn't
  // distribute over the union.
  rootTarget: Ref<EntityName<Proposition>> | Ref<EntityName<Statement>>;
};
export type CreateJustificationDataOut = ReadJustificationDataOut;
export type ReadJustificationDataOut = Persisted<Justification> & {
  creator: UserRef;
  counterJustifications: ReadJustificationDataOut[];
};
export type DeleteJustificationDataIn = PersistedOrRef<Justification>;

function toTarget(type: JustificationTargetType, id: number | string) {
  switch (type) {
    case "JUSTIFICATION":
      return {
        type,
        entity: JustificationRef.parse({ id: toString(id) }),
      };
    case "PROPOSITION":
      return {
        type,
        entity: PropositionRef.parse({ id: toString(id) }),
      };
    case "STATEMENT":
      return { type, entity: StatementRef.parse({ id: toString(id) }) };
  }
}

function toBasis(type: JustificationBasisType, id: number | string) {
  switch (type) {
    case "JUSTIFICATION_BASIS_COMPOUND":
      throw newUnimplementedError("JustificationBasisCompound is deprecated");
    case "PROPOSITION_COMPOUND":
      return {
        type,
        entity: PropositionCompoundRef.parse({ id: toString(id) }),
      };
    case "SOURCE_EXCERPT":
      return {
        type,
        entity: SourceExcerptRef.parse({ id: toString(id) }),
      };
    case "WRIT_QUOTE":
      return {
        type,
        entity: WritQuoteRef.parse({ id: toString(id) }),
      };
  }
}

export interface PropositionCompoundRow {
  proposition_compound_id: EntityRowId;
  creator_user_id: EntityRowId;
  created: Moment;
  deleted: Moment;
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

export interface WritQuoteRow {
  writ_quote_id: EntityRowId;
  quote_text: string;
  normal_quote_text: string;
  writ_id: EntityRowId;
  creator_user_id: EntityRowId;
  created: Moment;
  deleted: Moment;
}

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
  UserData,
  "created" | "deleted" | "id" | "creatorUserId" | "externalIds"
> & {
  acceptedTerms: Moment;
  affirmedMajorityConsent: Moment;
  affirmed13YearsOrOlder: Moment;
  affirmedNotGdpr: Moment;
};

export interface SqlClause {
  sql: string;
  args: any[];
}
