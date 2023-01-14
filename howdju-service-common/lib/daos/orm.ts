import isArray from "lodash/isArray";
import map from "lodash/map";
import merge from "lodash/merge";
import sortBy from "lodash/sortBy";
import values from "lodash/values";
import { QueryResultRow } from "pg";

import {
  AccountSettingsRef,
  camelCaseKeysDeep,
  ContentReportRef,
  ContentReportType,
  Entity,
  EntityId,
  EntityType,
  JustificationBasisCompoundAtomTypes,
  JustificationBasisTypes,
  JustificationRef,
  JustificationVoteRef,
  logger,
  newExhaustedEnumError,
  newImpossibleError,
  newProgrammingError,
  newUnimplementedError,
  PasswordResetRequestRef,
  PersorgRef,
  PropositionCompoundRef,
  PropositionRef,
  PropositionTagVoteRef,
  RegistrationRequestRef,
  requireArgs,
  SentenceTypes,
  SourceExcerptRef,
  SourceExcerptTypes,
  StatementRef,
  TagRef,
  toSlug,
  UserRef,
  WritQuoteRef,
  WritRef,
} from "howdju-common";

import {
  AccountSettingsData,
  AccountSettingsRow,
  ContentReportData,
  ContentReportRow,
  CreatorBlurbData,
  CreatorBlurbRow,
  JustificationRow,
  JustificationScoreData,
  JustificationScoreRow,
  JustificationVoteData,
  JustificationVoteRow,
  PasswordResetRequestData,
  PasswordResetRequestRow,
  PersorgData,
  PersorgRow,
  PropositionCompoundAtomData,
  PropositionCompoundAtomRow,
  PropositionCompoundRow,
  PropositionData,
  PropositionRow,
  PropositionTagScoreData,
  PropositionTagScoreRow,
  PropositionTagVoteData,
  PropositionTagVoteRow,
  ReadJustificationDataOut,
  ReadPropositionCompoundDataOut,
  RegistrationRequestData,
  RegistrationRequestRow,
  SpeakerBlurbRow,
  StatementData,
  StatementRow,
  toSpeakerBlurbMapper,
  UserData,
  UserExternalIdsData,
  UserExternalIdsRow,
  UserHashData,
  UserHashRow,
  UserRow,
  WritData,
  WritQuoteData,
  WritQuoteRow,
  WritRow,
} from "./dataTypes";
import { RowMapper, toIdString } from "./daosUtil";
import { isUndefined } from "lodash";

export function fromIdString(val: string) {
  return parseInt(val);
}

/**
 * Returns obj without any keys that contained undefined.
 *
 * If all keys contained undefined, return undefined.
 */
function removeUndefinedProperties<T extends Record<string, any>>(obj: T) {
  let hasDefinedProperty = false;
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined || obj[key] === null) {
      delete obj[key];
    } else {
      hasDefinedProperty = true;
    }
  }

  return hasDefinedProperty ? obj : undefined;
}

/**
 * Wrap a mapper.
 *
 * Guards for undefined row, sets ID if missing, and removes undefined values. */
function wrapMapper<
  T extends QueryResultRow,
  Args extends any[],
  R extends object
>(mapper: RowMapper<T, Args, R>) {
  return function (row: T | undefined, ...args: Args) {
    if (!row) {
      return row;
    }

    const mapped = mapper(row, ...args);
    if (!("id" in mapped) && "id" in row) {
      (mapped as any).id = toIdString(row.id);
    }
    return removeUndefinedProperties(mapped);
  };
}

/** Unprefixes and maps fields from row, which correspond to a related table. */
function mapRelation<
  T extends QueryResultRow,
  P extends string,
  Args extends any[],
  R extends Entity
>(mapper: RowMapper<UnprefixProperties<T, P>, Args, R>, prefix: P, row: T) {
  requireArgs({ mapper, prefix, row });
  const unprefixed = unprefix(row, prefix);
  if (!unprefixed) {
    return unprefixed;
  }
  const mapped = mapper(unprefixed);
  return removeUndefinedProperties(mapped);
}

/**
 * Test if K extends string, and if so, unprefix it.
 *
 * If K == string, then we can't statically type it and just return it as-is.
 */
type Unprefix<P extends string, K> = K extends string
  ? string extends K
    ? K
    : UnprefixString<P, K>
  : K;
/** Remove prefix P from string S. */
type UnprefixString<
  P extends string,
  S extends string
> = S extends `${P}${infer U}` ? U : never;
/** Remove the prefix P from the keys of Value. */
type UnprefixProperties<Value, P extends string> = Value extends (
  ...args: any[]
) => any
  ? Value
  : Value extends Array<unknown>
  ? Value
  : {
      [K in keyof Value as Unprefix<P, K>]: Value[K];
    };

type PrefixString<P extends string, K extends string> = `${P}${K}`;
type Prefix<P extends string, K> = K extends string
  ? string extends K
    ? K
    : PrefixString<P, K>
  : K;
/** Prefix the properties of Value with P. */
type PrefixProperties<P extends string, Value extends Record<string, any>> = {
  [K in keyof Value as Prefix<P, K>]: Value[K];
};

/**
 * Returns obj removing prefix from its keys.
 *
 * Keys that don't start with prefix are removed.
 */
function unprefix<T extends QueryResultRow, P extends string>(
  obj: T,
  prefix: P
): UnprefixProperties<T, P> | undefined {
  const unprefixed = {} as Record<string, any>;
  let hasPrefixedKey = false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith(prefix)) {
      hasPrefixedKey = true;
      const unprefixedKey = key.substr(prefix.length);
      unprefixed[unprefixedKey] = obj[key];
    }
  }
  return hasPrefixedKey ? (unprefixed as UnprefixProperties<T, P>) : undefined;
}

function toUserMapper(row: UserRow & UserExternalIdsRow): UserData {
  const user = merge(
    UserRef.parse({
      id: toIdString(row.user_id),
    }),
    {
      email: row.email,
      username: row.username,
      longName: row.long_name,
      shortName: row.short_name,
      created: row.created,
      isActive: row.is_active,
      externalIds: toUserExternalIds(row),
    }
  );

  return user;
}
export const toUser = wrapMapper(toUserMapper);

function toCreatorBlurbMapper(row: CreatorBlurbRow): CreatorBlurbData {
  return {
    id: toIdString(row.user_id),
    longName: row.long_name,
  };
}
export const toCreatorBlurb = wrapMapper(toCreatorBlurbMapper);

export const toUserExternalIds = wrapMapper(function (
  row: UserExternalIdsRow
): UserExternalIdsData {
  return {
    googleAnalyticsId: row.google_analytics_id,
    heapAnalyticsId: row.heap_analytics_id,
    mixpanelId: row.mixpanel_id,
    sentryId: row.sentry_id,
    smallchatId: row.smallchat_id,
  };
});

function toPropositionMapper(row: PropositionRow): PropositionData {
  const propositionId = row.proposition_id;
  const proposition: PropositionData = {
    ...PropositionRef.parse({ id: toIdString(propositionId) }),
    text: row.text,
    normalText: row.normal_text,
    slug: toSlug(row.normal_text),
    created: row.created,
  };

  if (row.creator_user_id) {
    if (!row.creator_long_name) {
      logger.error(
        "If row.creator_user_id is present, so must row.creator_long_name."
      );
    }
    proposition.creator = toCreatorBlurb({
      user_id: row.creator_user_id,
      long_name: row.creator_long_name || "",
    });
  }

  return proposition;
}
export const toProposition = wrapMapper(toPropositionMapper);

type StatementMapperRow = StatementRow &
  PrefixProperties<"creator_", CreatorBlurbRow> &
  PrefixProperties<"speaker_", SpeakerBlurbRow> &
  PrefixProperties<"sentence_proposition_", PropositionRow>;
function toStatementMapper(row: StatementMapperRow): StatementData {
  const speaker = mapRelation(toSpeakerBlurbMapper, "speaker_", row);
  if (!speaker) {
    throw newProgrammingError(
      "Must map statement.speaker successfully, but it failed."
    );
  }
  const statementId = row.statement_id || row.id;
  if (isUndefined(statementId)) {
    throw newProgrammingError(
      "statementId is required when mapping a Statement."
    );
  }
  const statement: Omit<StatementData, "sentence"> = {
    ...StatementRef.parse({ id: toIdString(statementId) }),
    creator: mapRelation(toCreatorBlurbMapper, "creator_", row),
    speaker,
    sentenceType: row["sentence_type"],
    created: row.created,
  };

  const sentenceRef = { id: toIdString(row["sentence_id"]) };
  switch (statement.sentenceType) {
    case SentenceTypes.STATEMENT: {
      const sentence = StatementRef.parse(sentenceRef);
      return { ...statement, sentence };
    }
    case SentenceTypes.PROPOSITION: {
      const sentence =
        mapRelation(toPropositionMapper, "sentence_proposition_", row) ??
        PropositionRef.parse(sentenceRef);
      return { ...statement, sentence };
    }
    default:
      throw newExhaustedEnumError(statement.sentenceType);
  }
}
export const toStatement = wrapMapper(toStatementMapper);

function mapJustificationRootTargetRelation(row: ToJustificationMapperRow) {
  switch (row.root_target_type) {
    case "PROPOSITION":
      if (row.root_target_proposition_id) {
        return mapRelation(toPropositionMapper, "root_target_", row);
      } else {
        return PropositionRef.parse({ id: toIdString(row.root_target_id) });
      }
    case "STATEMENT":
      return StatementRef.parse({
        id: toIdString(row.root_target_id),
      });
  }
}

/** A type that condtionally includes all keys from row iff Id is defined. */
type PossibleRow<
  Prefix extends string,
  Id extends string,
  Row extends Record<string, any>
> =
  | {
      [key in `${Prefix}${Id}`]: undefined;
    }
  | {
      [key in keyof PrefixProperties<Prefix, Row>]: PrefixProperties<
        Prefix,
        Row
      >[key];
    };

export type ToJustificationMapperRow = JustificationRow &
  PossibleRow<"basis_writ_quote_", "writ_quote_id", ToWritQuoteMapperRow> &
  PossibleRow<
    "basis_proposition_compound_",
    "proposition_compound_id",
    PropositionCompoundRow
  > &
  PrefixProperties<"root_target_", PropositionRow> &
  Partial<PrefixProperties<"creator_", CreatorBlurbRow>> &
  PossibleRow<"vote_", "justification_vote_id", JustificationVoteRow>;
function toJustificationMapper(
  row: ToJustificationMapperRow,
  counterJustificationsByJustificationId?: Record<
    EntityId,
    ToJustificationMapperRow[]
  >,
  propositionCompoundsById?: Record<EntityId, ReadPropositionCompoundDataOut>,
  writQuotesById?: Record<EntityId, WritQuoteData>,
  justificationBasisCompoundsById?: Record<EntityId, any>
): ReadJustificationDataOut {
  const rootTarget = mapJustificationRootTargetRelation(row);
  if (!rootTarget) {
    throw newProgrammingError(
      "rootTarget relation must be mappable but was undefined."
    );
  }
  const justification: ReadJustificationDataOut = {
    ...JustificationRef.parse({ id: toIdString(row.justification_id) }),
    created: row.created,
    rootTargetType: row.root_target_type,
    rootTarget,
    rootPolarity: row.root_polarity,
    target: parseJustificationTargetRef(row),
    basis: parseJustificationBasisRef(row),
    polarity: row.polarity,
    score: row.score,
    creator: toJustificationCreator(row),
    vote: row.vote_justification_vote_id
      ? toJustificationVote(unprefix(row, "vote_"))
      : undefined,
    counterJustifications: [],
  };

  function toJustificationCreator(row: ToJustificationMapperRow) {
    if (!row.creator_user_id) {
      return undefined;
    }
    if (row.creator_long_name) {
      return toCreatorBlurbMapper({
        user_id: row.creator_user_id,
        long_name: row.creator_long_name,
      });
    }
    return UserRef.parse({
      id: toIdString(row.creator_user_id),
    });
  }

  switch (row.basis_type) {
    case JustificationBasisTypes.WRIT_QUOTE: {
      const basisId = row.basis_id || row.basis_writ_quote_writ_quote_id;
      if (basisId) {
        if (writQuotesById) {
          justification.basis.entity = writQuotesById[basisId];
        }
        // justification.basis.entity was certainly set above to parseJustificationBasisRef.
        // So the only way it would be missing is if basisId were truthy, but writQuotesById was
        // missing that basisId.
        // TODO(1): after getting test coverage of all calls to this mapper, confirm whether we
        // ever trigger the following condition.
        if (!justification.basis.entity && row.basis_writ_quote_writ_quote_id) {
          justification.basis.entity = toWritQuoteMapper({
            writ_quote_id: row.basis_writ_quote_writ_quote_id,
            quote_text: row.basis_writ_quote_quote_text,
            normal_quote_text: row.basis_writ_quote_normal_quote_text,
            creator_user_id: row.basis_writ_quote_creator_user_id,
            created: row.basis_writ_quote_created,
            writ_id: row.basis_writ_quote_writ_id,
            writ_title: row.basis_writ_quote_writ_title,
            writ_writ_id: row.basis_writ_quote_writ_id,
            writ_creator_user_id: row.basis_writ_quote_writ_creator_user_id,
            writ_creator_long_name: row.basis_writ_quote_writ_creator_long_name,
            writ_created: row.basis_writ_quote_writ_created,
          });
        }
      }
      break;
    }

    case JustificationBasisTypes.PROPOSITION_COMPOUND: {
      const basisId =
        row.basis_id || row.basis_proposition_compound_proposition_compound_id;
      if (basisId) {
        if (propositionCompoundsById) {
          justification.basis.entity = propositionCompoundsById[basisId];
        }
        if (
          !justification.basis.entity &&
          row.basis_proposition_compound_proposition_compound_id
        ) {
          justification.basis.entity = toPropositionCompound({
            proposition_compound_id:
              row.basis_proposition_compound_proposition_compound_id,
            created: row.basis_proposition_compound_created,
            creator_user_id: row.basis_proposition_compound_creator_user_id,
          });
        }
      }
      break;
    }

    case JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND: {
      const basisId = row.basis_id || row.basis_justification_basis_compound_id;
      if (basisId) {
        if (justificationBasisCompoundsById) {
          justification.basis.entity = justificationBasisCompoundsById[basisId];
        }
        if (
          !justification.basis.entity &&
          row.basis_justification_basis_compound_id
        ) {
          justification.basis.entity = toJustificationBasisCompound({
            justification_basis_compound_id:
              row.basis_justification_basis_compound_id,
            created: row.basis_justification_basis_compound_created,
            creator_user_id:
              row.basis_justification_basis_compound_creator_user_id,
          });
        }
      }
      break;
    }

    default:
      throw newImpossibleError(
        `Unsupported JustificationBasisTypes: ${row.basis_type}`
      );
  }

  if (!justification.basis.entity) {
    justification.basis = parseJustificationBasisRef(row);
  }

  if (counterJustificationsByJustificationId) {
    const counterJustifications =
      counterJustificationsByJustificationId[justification.id];
    if (counterJustifications) {
      justification.counterJustifications = map(counterJustifications, (j) =>
        toJustificationMapper(
          j,
          counterJustificationsByJustificationId,
          propositionCompoundsById,
          writQuotesById,
          justificationBasisCompoundsById
        )
      );
    }
  }

  return justification;
}
export const toJustification = wrapMapper(toJustificationMapper);

function parseJustificationTargetRef(row: JustificationRow) {
  const type = row.target_type;
  const id = toIdString(row.target_id);
  switch (type) {
    case "JUSTIFICATION": {
      const entity = JustificationRef.parse({ id });
      return { type, entity };
    }
    case "PROPOSITION": {
      const entity = PropositionRef.parse({ id });
      return { type, entity };
    }
    case "STATEMENT": {
      const entity = StatementRef.parse({ id });
      return { type, entity };
    }
  }
}

function parseJustificationBasisRef(row: JustificationRow) {
  const type = row.basis_type;
  const id = toIdString(row.basis_id);
  switch (type) {
    case "PROPOSITION_COMPOUND": {
      const entity = PropositionCompoundRef.parse({ id });
      return { type, entity };
    }
    case "SOURCE_EXCERPT": {
      const entity = SourceExcerptRef.parse({ id });
      return { type, entity };
    }
    case "WRIT_QUOTE": {
      const entity = WritQuoteRef.parse({ id });
      return { type, entity };
    }
    case "JUSTIFICATION_BASIS_COMPOUND":
      throw newUnimplementedError(
        "TODO(28) JustificationBasisCompound is unsupported"
      );
  }
}

type ToWritQuoteMapperRow = WritQuoteRow &
  PrefixProperties<"writ_", ToWritMapperRow>;
function toWritQuoteMapper(row: ToWritQuoteMapperRow): WritQuoteData {
  const writ = toWrit({
    writ_id: row.writ_id,
    title: row.writ_title,
    created: row.writ_created,
    creator_user_id: row.writ_creator_user_id,
    creator_long_name: row.writ_creator_long_name,
  });
  if (!writ) {
    throw newProgrammingError("writ is required when mapping writQuote");
  }
  return {
    ...WritQuoteRef.parse({ id: toIdString(row.writ_quote_id) }),
    quoteText: row.quote_text,
    created: row.created,
    creatorUserId: toIdString(row.creator_user_id),
    writ,
    urls: [],
  };
}
export const toWritQuote = wrapMapper(toWritQuoteMapper);

type ToWritMapperRow = WritRow & PrefixProperties<"creator_", CreatorBlurbRow>;
function toWritMapper(row: ToWritMapperRow): WritData {
  const creatorBlurb = unprefix(row, "creator_");
  if (!creatorBlurb) {
    throw newProgrammingError("creatorBlurb is required when mapping a Writ.");
  }
  const creator = toCreatorBlurb(creatorBlurb);
  if (!creator) {
    throw newProgrammingError("creator is required when mapping a Writ.");
  }
  return {
    ...WritRef.parse({ id: toIdString(row.writ_id) }),
    title: row.title,
    created: row.created,
    creator,
  };
}
export const toWrit = wrapMapper(toWritMapper);

export const toUrl = wrapMapper(function toUrlMapper(row) {
  return {
    id: toIdString(row.url_id),
    url: row.url,
  };
});

export const toJustificationVote = wrapMapper(
  function toJustificationVoteMapper(
    row: JustificationVoteRow
  ): JustificationVoteData {
    return {
      ...JustificationVoteRef.parse({
        id: toIdString(row.justification_vote_id),
      }),
      polarity: row.polarity,
      justificationId: toIdString(row.justification_id),
      justification: JustificationRef.parse({
        id: toIdString(row.justification_id),
      }),
    };
  }
);

export const toWritQuoteUrl = wrapMapper(function toWriteQuoteUrlMapper(row) {
  return {
    writQuoteId: toIdString(row.writ_quote_id),
    urlId: toIdString(row.url_id),
  };
});

export const toPropositionCompound = (
  row: PropositionCompoundRow,
  atoms: PropositionCompoundAtomData[] = []
): ReadPropositionCompoundDataOut => {
  if (!row) {
    return row;
  }

  return {
    ...PropositionCompoundRef.parse({
      id: toIdString(row.proposition_compound_id),
    }),
    created: row.created,
    creatorUserId: toIdString(row.creator_user_id),
    atoms,
  };
};

export type ToPropositionCompoundAtomMapperRow = PropositionCompoundAtomRow &
  PrefixProperties<"proposition_", PropositionRow>;
export const toPropositionCompoundAtom = wrapMapper(
  function toPropositionCompoundAtomMapper(
    row: ToPropositionCompoundAtomMapperRow
  ): PropositionCompoundAtomData {
    const entity = toProposition({
      proposition_id: row.proposition_id,
      text: row.proposition_text,
      normal_text: row.proposition_normal_text,
      creator_user_id: row.proposition_creator_user_id,
      created: row.proposition_created,
    });
    if (!entity) {
      throw newProgrammingError("Proposition required.");
    }
    return {
      compoundId: toIdString(row.proposition_compound_id),
      entity,
    };
  }
);

export const toPerspective = (row: any) =>
  row && {
    id: toIdString(row.perspective_id),
    proposition: { id: toIdString(row.proposition_id) },
    creatorUserId: row.creator_user_id,
  };

export const toUserHash = (row: UserHashRow): UserHashData =>
  row && camelCaseKeysDeep(row);

export const toJobHistory = (row: any) =>
  row && {
    id: toIdString(row.job_history_id),
    type: row.job_type,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    wasSuccess: row.was_success,
    message: row.message,
  };

export const toJustificationScore = (
  row: JustificationScoreRow
): JustificationScoreData => row && camelCaseKeysDeep(row);

export const toJustificationBasisCompound = (row: any, atoms?: any) => {
  if (!row) {
    return row;
  }

  const compound = {
    id: toIdString(row.justification_basis_compound_id),
    atoms: [],
    creatorUserId: row.creator_user_id,
    created: row.created,
  };

  if (atoms) {
    if (!isArray(atoms)) {
      // Assume a non-array is an object of atoms by propositionId
      atoms = values(atoms);
      atoms = sortBy(atoms, (a) => a.orderPosition);
    }
    compound.atoms = atoms;
  }

  return compound;
};

export const toJustificationBasisCompoundAtom = (row: any) => {
  if (!row) {
    return row;
  }

  const atom: any = {
    id: toIdString(row.justification_basis_compound_atom_id),
    compoundId: row.justification_basis_compound_id,
    type: row.entity_type,
    entity: {
      id: toIdString(row.entity_id),
    },
    orderPosition: row.order_position,
  };

  switch (atom.type) {
    case JustificationBasisCompoundAtomTypes.PROPOSITION:
      if (row.proposition_id) {
        atom.entity = toProposition({
          proposition_id: row.proposition_id,
          text: row.proposition_text,
          normal_text: row.proposition_normal_text,
          created: row.proposition_created,
          creator_user_id: row.proposition_creator_user_id,
        });
      }
      break;
    case JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE:
      if (row.source_excerpt_paraphrase_id) {
        atom.entity = toSourceExcerptParaphrase({
          source_excerpt_paraphrase_id: toIdString(
            row.source_excerpt_paraphrase_id
          ),
          paraphrasing_proposition_id:
            row.source_excerpt_paraphrasing_proposition_id,
          paraphrasing_proposition_text:
            row.source_excerpt_paraphrasing_proposition_text,
          paraphrasing_proposition_created:
            row.source_excerpt_paraphrasing_proposition_created,
          paraphrasing_proposition_creator_user_id:
            row.source_excerpt_paraphrasing_proposition_creator_user_id,
          source_excerpt_type: row.source_excerpt_type,
          writ_quote_id: toIdString(row.source_excerpt_writ_quote_id),
          writ_quote_quote_text: row.source_excerpt_writ_quote_quote_text,
          writ_quote_created: row.source_excerpt_writ_quote_created,
          writ_quote_creator_user_id:
            row.source_excerpt_writ_quote_creator_user_id,
          writ_quote_writ_id: toIdString(row.source_excerpt_writ_quote_writ_id),
          writ_quote_writ_title: row.source_excerpt_writ_quote_writ_title,
          writ_quote_writ_created: row.source_excerpt_writ_quote_writ_created,
          writ_quote_writ_creator_user_id:
            row.source_excerpt_writ_quote_writ_creator_user_id,
        });
      }
      break;
  }

  return atom;
};

export const toSourceExcerptParaphrase = (row: any) => {
  if (!row) {
    return row;
  }
  const sourceExcerptParaphrase = {
    id: toIdString(row.source_excerpt_paraphrase_id),
    paraphrasingProposition: {
      id: toIdString(row.paraphrasing_proposition_id),
    },
    sourceExcerpt: {
      type: row.source_excerpt_type,
      entity: {
        id: toIdString(row.source_excerpt_id),
      },
    },
  };

  const paraphrasingProposition = toProposition({
    proposition_id: row.paraphrasing_proposition_id,
    text: row.paraphrasing_proposition_text,
    normal_text: row.paraphrasing_proposition_normal_text,
    created: row.paraphrasing_proposition_created,
    creator_user_id: row.paraphrasing_proposition_creator_user_id,
  });
  if (!paraphrasingProposition) {
    throw newProgrammingError(
      "paraphrasingProposition is required when mapping sourceExcerptParaphrase."
    );
  }
  if (paraphrasingProposition.id) {
    sourceExcerptParaphrase.paraphrasingProposition = paraphrasingProposition;
  }

  const sourceExcerptEntity = toSourceExcerptEntity(row);
  if (sourceExcerptEntity.id) {
    sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity;
  }

  return sourceExcerptParaphrase;
};

export const toSourceExcerptEntity = (row: any) => {
  if (!row) {
    return row;
  }

  switch (row.source_excerpt_type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      return toWritQuote({
        writ_quote_id: row.writ_quote_id,
        quote_text: row.writ_quote_quote_text,
        normal_quote_text: row.writ_quote_normal_quote_text,
        created: row.writ_quote_created,
        creator_user_id: row.writ_quote_creator_user_id,
        writ_id: row.writ_quote_writ_id,
        writ_title: row.writ_quote_writ_title,
        writ_created: row.writ_quote_writ_created,
        writ_writ_id: row.writ_quote_writ_id,
        writ_creator_long_name: row.writ_quote_writ_creator_long_name,
        writ_creator_user_id: row.writ_quote_writ_creator_user_id,
      });
    default:
      throw newUnimplementedError(`Unimplemented`);
  }
};

export function toPropositionTagVote(
  row: PropositionTagVoteRow
): PropositionTagVoteData {
  if (!row) {
    return row;
  }

  return {
    ...PropositionTagVoteRef.parse({
      id: toIdString(row.proposition_tag_vote_id),
    }),
    polarity: row.polarity,
    proposition: PropositionRef.parse({
      id: toIdString(row.proposition_id),
    }),
    tag: TagRef.parse({
      id: toIdString(row.tag_id),
    }),
  };
}

export function toPropositionTagScore(
  row: PropositionTagScoreRow
): PropositionTagScoreData {
  if (!row) {
    return row;
  }

  return {
    propositionId: row.proposition_id,
    tagId: row.tag_id,
    scoreType: row.score_type,
    score: row.score,
    created: row.created,
    creatorJobHistoryId: row.creator_job_history_id,
    deletorJobHistoryId: row.deletor_job_history_id,
  };
}

export const toTag = wrapMapper(function toTagMapper(row) {
  return {
    id: toIdString(row.tag_id),
    name: row.name,
  };
});

export const toPersorg = wrapMapper(function toPersorgMapper(
  row: PersorgRow & PrefixProperties<"creator_", CreatorBlurbRow>
): PersorgData {
  const persorg = {
    ...PersorgRef.parse({ id: toIdString(row.persorg_id) }),
    isOrganization: row.is_organization,
    name: row.name,
    knownFor: row.known_for,
    websiteUrl: row.website_url,
    twitterUrl: row.twitter_url,
    wikipediaUrl: row.wikipedia_url,
    normalName: row.normal_name,
    created: row.created,
    modified: row.modified,
  };

  const creator = row.creator_user_id
    ? toCreatorBlurb({
        user_id: row.creator_user_id,
        long_name: row.creator_long_name,
      })
    : undefined;

  return { ...persorg, creator };
});

export const toRegistrationRequest = wrapMapper(
  function toRegistrationRequestMapper(
    row: RegistrationRequestRow
  ): RegistrationRequestData {
    return {
      ...RegistrationRequestRef.parse({
        id: toIdString(row.registration_request_id),
      }),
      email: row.email,
      registrationCode: row.registration_code,
      isConsumed: row.is_consumed,
      expires: row.expires,
      created: row.created,
    };
  }
);

export const toPasswordResetRequest = wrapMapper(
  function toPasswordResetRequestMapper(
    row: PasswordResetRequestRow
  ): PasswordResetRequestData {
    return {
      ...PasswordResetRequestRef.parse({
        id: toIdString(row.password_reset_request_id),
      }),
      userId: toIdString(row.user_id),
      email: row.email,
      passwordResetCode: row.password_reset_code,
      expires: row.expires,
      isConsumed: row.isConsumed,
      created: row.created,
    };
  }
);

export const toAccountSettings = wrapMapper(function toAccountSettingsMapper(
  row: AccountSettingsRow
): AccountSettingsData {
  return {
    ...AccountSettingsRef.parse({ id: toIdString(row.account_settings_id) }),
    userId: toIdString(row.user_id),
    paidContributionsDisclosure: row.paid_contributions_disclosure,
  };
});

export const toContentReport = wrapMapper(function toContentReportMapper(
  row: ContentReportRow
): ContentReportData {
  return {
    ...ContentReportRef.parse({ id: toIdString(row.content_report_id) }),
    entityType: row.entity_type as EntityType,
    entityId: toIdString(row.entity_id),
    url: row.url,
    types: row.types as ContentReportType[],
    description: row.description,
    reporterUserId: toIdString(row.reporter_user_id),
    created: row.created,
  };
});
