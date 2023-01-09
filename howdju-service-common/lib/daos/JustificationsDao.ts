import concat from "lodash/concat";
import forEach from "lodash/forEach";
import flatMap from "lodash/flatMap";
import has from "lodash/has";
import head from "lodash/head";
import map from "lodash/map";
import mapValues from "lodash/mapValues";
import snakeCase from "lodash/snakeCase";

import {
  assert,
  isDefined,
  doTargetSameRoot,
  JustificationBasisCompoundAtomTypes,
  JustificationBasisTypes,
  JustificationPolarities,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  negateRootPolarity,
  newExhaustedEnumError,
  newImpossibleError,
  pushAll,
  requireArgs,
  SortDirections,
  SourceExcerptTypes,
  Logger,
  EntityId,
  JustificationRootTargetType,
  JustificationPolarity,
  toEntries,
  isRef,
  JustificationRootPolarity,
} from "howdju-common";

import {
  toJustification,
  toPropositionCompound,
  toPropositionCompoundAtom,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
  toWritQuote,
  toProposition,
} from "./orm";
import { EntityNotFoundError } from "../serviceErrors";
import { groupRootJustifications, renumberSqlArgs } from "./daosUtil";
import { DatabaseSortDirection } from "./daoModels";
import { StatementsDao } from "./StatementsDao";
import { PropositionCompoundsDao } from "./PropositionCompoundsDao";
import { WritQuotesDao } from "./WritQuotesDao";
import { JustificationBasisCompoundsDao } from "./JustificationBasisCompoundsDao";
import { WritQuoteUrlTargetsDao } from "./WritQuoteUrlTargetsDao";
import { Database } from "../database";
import {
  JustificationRow,
  PropositionRow,
  SortDescription,
  PropositionData,
  WritQuoteRow,
  PropositionCompoundAtomRow,
  SqlClause,
  JustificationFilters,
  JustificationBasisCompoundRow,
  ReadPropositionCompoundDataOut,
  justificationRowToData,
  ReadJustificationDataOut,
  CreateJustificationDataIn,
  DeleteJustificationDataIn,
} from "./types";
import { Moment } from "moment";

export class JustificationsDao {
  logger: Logger;
  database: Database;
  statementsDao: StatementsDao;
  propositionCompoundsDao: PropositionCompoundsDao;
  writQuotesDao: WritQuotesDao;
  justificationBasisCompoundsDao: JustificationBasisCompoundsDao;
  writQuoteUrlTargetsDao: WritQuoteUrlTargetsDao;

  constructor(
    logger: Logger,
    database: Database,
    statementsDao: StatementsDao,
    propositionCompoundsDao: PropositionCompoundsDao,
    writQuotesDao: WritQuotesDao,
    justificationBasisCompoundsDao: JustificationBasisCompoundsDao,
    writQuoteUrlTargetsDao: WritQuoteUrlTargetsDao
  ) {
    requireArgs({
      logger,
      database,
      statementsDao,
      propositionCompoundsDao,
      writQuotesDao,
      justificationBasisCompoundsDao,
      writQuoteUrlTargetsDao,
    });
    this.logger = logger;
    this.database = database;
    this.statementsDao = statementsDao;
    this.propositionCompoundsDao = propositionCompoundsDao;
    this.writQuotesDao = writQuotesDao;
    this.justificationBasisCompoundsDao = justificationBasisCompoundsDao;
    this.writQuoteUrlTargetsDao = writQuoteUrlTargetsDao;
  }

  async readJustifications(
    filters: JustificationFilters,
    sorts: SortDescription[],
    count: number,
    isContinuation: boolean,
    includeUrls: boolean
  ): Promise<ReadJustificationDataOut[]> {
    const { sql: limitedJustificationsSql, args: limitedJustificationsArgs } =
      this.makeLimitedJustificationsClause(
        filters,
        sorts,
        count,
        isContinuation
      );

    const tableAlias = "j";
    const orderByExpressionsSql = makeJustificationsQueryOrderByExpressionsSql(
      sorts,
      tableAlias
    );
    const orderBySql = orderByExpressionsSql
      ? "order by " + orderByExpressionsSql
      : "";

    const justificationsSelectArgs = [
      JustificationRootTargetTypes.PROPOSITION,
      JustificationBasisTypes.WRIT_QUOTE,
      JustificationBasisTypes.PROPOSITION_COMPOUND,
      JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomTypes.PROPOSITION,
      JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
      SourceExcerptTypes.WRIT_QUOTE,
    ];
    const justificationsRenumberedLimitedJustificationsSql = renumberSqlArgs(
      limitedJustificationsSql,
      justificationsSelectArgs.length
    );
    const justificationsArgs = concat(
      justificationsSelectArgs,
      limitedJustificationsArgs
    );
    const justificationsSql = `
      with
        limited_justifications as (
          ${justificationsRenumberedLimitedJustificationsSql}
        )
      select
          ${tableAlias}.justification_id
        , ${tableAlias}.root_target_type
        , ${tableAlias}.root_target_id
        , ${tableAlias}.root_polarity
        , ${tableAlias}.target_type
        , ${tableAlias}.target_id
        , ${tableAlias}.basis_type
        , ${tableAlias}.basis_id
        , ${tableAlias}.polarity
        , ${tableAlias}.creator_user_id
        , ${tableAlias}.created

        , rp.proposition_id       as root_target_proposition_id
        , rp.text                 as root_target_proposition_text
        , rp.created              as root_target_proposition_created
        , rp.creator_user_id      as root_target_proposition_creator_user_id

        , wq.writ_quote_id          as basis_writ_quote_id
        , wq.quote_text             as basis_writ_quote_quote_text
        , wq.created                as basis_writ_quote_created
        , wq.creator_user_id        as basis_writ_quote_creator_user_id
        , w.writ_id                 as basis_writ_quote_writ_id
        , w.title                   as basis_writ_quote_writ_title
        , w.created                 as basis_writ_quote_writ_created
        , w.creator_user_id         as basis_writ_quote_writ_creator_user_id

        , sc.proposition_compound_id  as basis_proposition_compound_id
        , sca.order_position        as basis_proposition_compound_atom_order_position
        , scas.proposition_id         as basis_proposition_compound_atom_proposition_id
        , scas.text                 as basis_proposition_compound_atom_proposition_text
        , scas.created              as basis_proposition_compound_atom_proposition_created
        , scas.creator_user_id      as basis_proposition_compound_atom_proposition_creator_user_id

        , jbc.justification_basis_compound_id          as basis_jbc_id
        , jbca.justification_basis_compound_atom_id    as basis_jbc_atom_id
        , jbca.entity_type                             as basis_jbc_atom_entity_type
        , jbca.order_position                          as basis_jbc_atom_order_position

        , jbcas.proposition_id                           as basis_jbc_atom_proposition_id
        , jbcas.text                                   as basis_jbc_atom_proposition_text
        , jbcas.created                                as basis_jbc_atom_proposition_created
        , jbcas.creator_user_id                        as basis_jbc_atom_proposition_creator_user_id

        , sep.source_excerpt_paraphrase_id             as basis_jbc_atom_sep_id
        , sep_s.proposition_id                           as basis_jbc_atom_sep_paraphrasing_proposition_id
        , sep_s.text                                   as basis_jbc_atom_sep_paraphrasing_proposition_text
        , sep_s.created                                as basis_jbc_atom_sep_paraphrasing_proposition_created
        , sep_s.creator_user_id                        as basis_jbc_atom_sep_paraphrasing_proposition_creator_user_id
        , sep.source_excerpt_type                      as basis_jbc_atom_sep_source_excerpt_type
        , sep_wq.writ_quote_id                         as basis_jbc_atom_sep_writ_quote_id
        , sep_wq.quote_text                            as basis_jbc_atom_sep_writ_quote_quote_text
        , sep_wq.created                               as basis_jbc_atom_sep_writ_quote_created
        , sep_wq.creator_user_id                       as basis_jbc_atom_sep_writ_quote_creator_user_id
        , sep_wqw.writ_id                              as basis_jbc_atom_sep_writ_quote_writ_id
        , sep_wqw.title                                as basis_jbc_atom_sep_writ_quote_writ_title
        , sep_wqw.created                              as basis_jbc_atom_sep_writ_quote_writ_created
        , sep_wqw.creator_user_id                      as basis_jbc_atom_sep_writ_quote_writ_creator_user_id
      from limited_justifications
          join justifications ${tableAlias} using (justification_id)

          left join propositions rp on
                ${tableAlias}.root_target_type = $1
            and ${tableAlias}.root_target_id = rp.proposition_id

          left join writ_quotes wq on
                ${tableAlias}.basis_type = $2
            and ${tableAlias}.basis_id = wq.writ_quote_id
          left join writs w using (writ_id)

          left join proposition_compounds sc on
                ${tableAlias}.basis_type = $3
            and ${tableAlias}.basis_id = sc.proposition_compound_id
          left join proposition_compound_atoms sca using (proposition_compound_id)
          left join propositions scas on sca.proposition_id = scas.proposition_id

          left join justification_basis_compounds jbc on
                ${tableAlias}.basis_type = $4
            and ${tableAlias}.basis_id = jbc.justification_basis_compound_id
          left join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
          left join propositions jbcas on
                jbca.entity_type = $5
            and jbca.entity_id = jbcas.proposition_id
          left join source_excerpt_paraphrases sep on
                jbca.entity_type = $6
            and jbca.entity_id = sep.source_excerpt_paraphrase_id
          left join propositions sep_s on
                sep.paraphrasing_proposition_id = sep_s.proposition_id
          left join writ_quotes sep_wq on
                sep.source_excerpt_type = $7
            and sep.source_excerpt_id = sep_wq.writ_quote_id
          left join writs sep_wqw on
                sep_wq.writ_id = sep_wqw.writ_id
        where
              ${tableAlias}.deleted is null
          and rp.deleted is null
          and wq.deleted is null
          and w.deleted is null
          and sc.deleted is null
          and scas.deleted is null
          and jbc.deleted is null
          and jbcas.deleted is null
          and sep.deleted is null
          and sep_s.deleted is null
          and sep_wq.deleted is null
          and sep_wqw.deleted is null
      ${orderBySql}
    `;

    const targetJustificationsSelectArgs = [
      JustificationRootTargetTypes.PROPOSITION,
      JustificationTargetTypes.JUSTIFICATION,
      JustificationBasisTypes.WRIT_QUOTE,
      JustificationBasisTypes.PROPOSITION_COMPOUND,
      JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomTypes.PROPOSITION,
      JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
      SourceExcerptTypes.WRIT_QUOTE,
    ];
    const targetJustificationsRenumberedLimitedJustificationsSql =
      renumberSqlArgs(
        limitedJustificationsSql,
        targetJustificationsSelectArgs.length
      );
    const targetJustificationsArgs = concat(
      targetJustificationsSelectArgs,
      limitedJustificationsArgs
    );
    const targetJustificationPrefix = "tj_";
    const targetJustificationsSql = `
      with
        limited_justifications as (
          ${targetJustificationsRenumberedLimitedJustificationsSql}
        )
      select
         -- We don't use this, but just for completeness
          ${tableAlias}.justification_id

        , tj.justification_id       as ${targetJustificationPrefix}justification_id
        , tj.root_target_type       as ${targetJustificationPrefix}root_target_type
        , tj.root_target_id         as ${targetJustificationPrefix}root_target_id
        , tj.root_polarity          as ${targetJustificationPrefix}root_polarity
        , tj.target_type            as ${targetJustificationPrefix}target_type
        , tj.target_id              as ${targetJustificationPrefix}target_id
        , tj.basis_type             as ${targetJustificationPrefix}basis_type
        , tj.basis_id               as ${targetJustificationPrefix}basis_id
        , tj.polarity               as ${targetJustificationPrefix}polarity
        , tj.creator_user_id        as ${targetJustificationPrefix}creator_user_id
        , tj.created                as ${targetJustificationPrefix}created

        , rp.proposition_id         as ${targetJustificationPrefix}root_target_proposition_id
        , rp.text                   as ${targetJustificationPrefix}root_target_proposition_text
        , rp.created                as ${targetJustificationPrefix}root_target_proposition_created
        , rp.creator_user_id        as ${targetJustificationPrefix}root_target_proposition_creator_user_id

        , wq.writ_quote_id          as ${targetJustificationPrefix}basis_writ_quote_id
        , wq.quote_text             as ${targetJustificationPrefix}basis_writ_quote_quote_text
        , wq.created                as ${targetJustificationPrefix}basis_writ_quote_created
        , wq.creator_user_id        as ${targetJustificationPrefix}basis_writ_quote_creator_user_id
        , w.writ_id                 as ${targetJustificationPrefix}basis_writ_quote_writ_id
        , w.title                   as ${targetJustificationPrefix}basis_writ_quote_writ_title
        , w.created                 as ${targetJustificationPrefix}basis_writ_quote_writ_created
        , w.creator_user_id         as ${targetJustificationPrefix}basis_writ_quote_writ_creator_user_id

        , sc.proposition_compound_id  as ${targetJustificationPrefix}basis_proposition_compound_id
        , sca.order_position        as ${targetJustificationPrefix}basis_proposition_compound_atom_order_position
        , scas.proposition_id         as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_id
        , scas.text                 as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_text
        , scas.created              as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_created
        , scas.creator_user_id      as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_creator_user_id

        , jbc.justification_basis_compound_id        as ${targetJustificationPrefix}basis_jbc_id
        , jbca.justification_basis_compound_atom_id  as ${targetJustificationPrefix}basis_jbc_atom_id
        , jbca.entity_type                           as ${targetJustificationPrefix}basis_jbc_atom_entity_type
        , jbca.order_position                        as ${targetJustificationPrefix}basis_jbc_atom_order_position

        , jbcas.proposition_id                         as ${targetJustificationPrefix}basis_jbc_atom_proposition_id
        , jbcas.text                                 as ${targetJustificationPrefix}basis_jbc_atom_proposition_text
        , jbcas.created                              as ${targetJustificationPrefix}basis_jbc_atom_proposition_created
        , jbcas.creator_user_id                      as ${targetJustificationPrefix}basis_jbc_atom_proposition_creator_user_id

        , sep.source_excerpt_paraphrase_id           as ${targetJustificationPrefix}basis_jbc_atom_sep_id
        , sep_s.proposition_id                         as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_proposition_id
        , sep_s.text                                 as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_proposition_text
        , sep_s.created                              as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_proposition_created
        , sep_s.creator_user_id                      as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_proposition_creator_user_id
        , sep.source_excerpt_type                    as ${targetJustificationPrefix}basis_jbc_atom_sep_source_excerpt_type
        , sep_wq.writ_quote_id                       as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_id
        , sep_wq.quote_text                          as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_quote_text
        , sep_wq.created                             as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_created
        , sep_wq.creator_user_id                     as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_creator_user_id
        , sep_wqw.writ_id                            as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_writ_id
        , sep_wqw.title                              as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_writ_title
        , sep_wqw.created                            as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_writ_created
        , sep_wqw.creator_user_id                    as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_writ_creator_user_id
      from limited_justifications lj
          join justifications ${tableAlias} using (justification_id)

          left join propositions rp on
                ${tableAlias}.root_target_type = $1
            and ${tableAlias}.root_target_id = rp.proposition_id

          join justifications tj on
                ${tableAlias}.target_type = $2
            and ${tableAlias}.target_id = tj.justification_id

          left join writ_quotes wq on
                tj.basis_type = $3
            and tj.basis_id = wq.writ_quote_id
          left join writs w on wq.writ_id = w.writ_id

          left join proposition_compounds sc on
                tj.basis_type = $4
            and tj.basis_id = sc.proposition_compound_id
          left join proposition_compound_atoms sca using (proposition_compound_id)
          left join propositions scas on sca.proposition_id = scas.proposition_id

          left join justification_basis_compounds jbc on
                tj.basis_type = $5
            and tj.basis_id = jbc.justification_basis_compound_id
          left join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
          left join propositions jbcas on
                jbca.entity_type = $6
            and jbca.entity_id = jbcas.proposition_id
          left join source_excerpt_paraphrases sep on
                jbca.entity_type = $7
            and jbca.entity_id = sep.source_excerpt_paraphrase_id
          left join propositions sep_s on
                sep.paraphrasing_proposition_id = sep_s.proposition_id
          left join writ_quotes sep_wq on
                sep.source_excerpt_type = $8
            and sep.source_excerpt_id = sep_wq.writ_quote_id
          left join writs sep_wqw on
                sep_wq.writ_id = sep_wqw.writ_id
        where
              ${tableAlias}.deleted is null
          and rp.deleted is null
          and tj.deleted is null
          and wq.deleted is null
          and w.deleted is null
          and sc.deleted is null
          and scas.deleted is null
          and jbc.deleted is null
          and jbcas.deleted is null
          and sep.deleted is null
          and sep_s.deleted is null
          and sep_wq.deleted is null
          and sep_wqw.deleted is null
      -- no need to order because they are joined to the ordered targeting justifications
      `;

    const targetPropositionsSelectArgs = [JustificationTargetTypes.PROPOSITION];
    const targetPropositionsRenumberedLimitedJustificationsSql =
      renumberSqlArgs(
        limitedJustificationsSql,
        targetPropositionsSelectArgs.length
      );
    const targetPropositionsArgs = concat(
      targetPropositionsSelectArgs,
      limitedJustificationsArgs
    );
    const targetPropositionsSql = `
      with
        limited_justifications as (
          ${targetPropositionsRenumberedLimitedJustificationsSql}
        )
      select
          tp.proposition_id
        , tp.text
        , tp.created
        , tp.creator_user_id
      from limited_justifications lj
          join justifications j using (justification_id)
          left join propositions tp on
                j.target_type = $1
            and j.target_id = tp.proposition_id
        where
              j.deleted is null
          and tp.deleted is null
      -- no need to order because they are joined to the ordered targeting justifications
    `;
    const [
      { rows: justificationRows },
      { rows: targetJustificationRows },
      { rows: targetPropositionRows },
    ] = await Promise.all([
      this.database.query<JustificationRow>(
        "readJustifications",
        justificationsSql,
        justificationsArgs
      ),
      this.database.query<JustificationRow>(
        "readJustifications.targetJustifications",
        targetJustificationsSql,
        targetJustificationsArgs
      ),
      this.database.query<PropositionRow>(
        "readJustifications.targetPropositions",
        targetPropositionsSql,
        targetPropositionsArgs
      ),
    ]);
    const justifications = mapJustificationRows(justificationRows);
    const targetJustificationsById = mapJustificationRowsById(
      targetJustificationRows,
      targetJustificationPrefix
    );
    const targetPropositionsById = mapPropositionRowsById(
      targetPropositionRows
    );

    forEach(justifications, (justification) => {
      switch (justification.target.type) {
        case JustificationTargetTypes.JUSTIFICATION: {
          justification.target.entity =
            targetJustificationsById[justification.target.entity.id];
          break;
        }
        case JustificationTargetTypes.PROPOSITION: {
          justification.target.entity =
            targetPropositionsById[justification.target.entity.id];
          break;
        }
        case JustificationTargetTypes.STATEMENT:
          // For expediency, we add statements below rather than try to fold them in.
          // As we add new justification targets, it's not scalable to keep writing new queries for each one
          break;
        default:
          throw newExhaustedEnumError(justification.target);
      }
    });

    if (justifications.length) {
      // Add the statements here at the end; it is too much trouble to add them into the joins above;
      // we can add them into the joins, if that makes sense, after we remove the deprecated justification basis types
      await this.addStatements(justifications);
      if (includeUrls) {
        await this.addUrls(justifications);
        await this.addUrlTargets(justifications);
      }
    }

    return justifications;
  }

  async readJustificationsWithBasesAndVotesByRootTarget(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId,
    { userId }: { userId: EntityId }
  ) {
    const sql = `
      with
        extant_users as (select * from users where deleted is null)
      select
          j.*
        , v.justification_vote_id
        , v.polarity    as vote_polarity
        , v.justification_id   as vote_justification_id
        , u.long_name as creator_user_long_name
      from justifications j
        left join extant_users u on j.creator_user_id = u.user_id
        left join proposition_compounds sc on
              j.basis_type = $5
          and j.basis_id = sc.proposition_compound_id
        left join writ_quotes wq on
              j.basis_type = $4
          and j.basis_id = wq.writ_quote_id
        left join justification_votes v on
              j.justification_id = v.justification_id
          and v.user_id = $3
          and v.deleted IS NULL
        where
              j.deleted is null
          and j.root_target_type = $1
          and j.root_target_id = $2
      `;
    const [
      { rows: justification_rows },
      propositionCompoundsById,
      writQuotesById,
      justificationBasisCompoundsById,
    ] = await Promise.all([
      this.database.query(
        "readJustificationsWithBasesAndVotesByRootTarget",
        sql,
        [
          rootTargetType,
          rootTargetId,
          userId,
          JustificationBasisTypes.WRIT_QUOTE,
          JustificationBasisTypes.PROPOSITION_COMPOUND,
        ]
      ),
      this.readPropositionCompoundsByIdForRootTarget(
        rootTargetType,
        rootTargetId,
        { userId }
      ),
      this.writQuotesDao.readWritQuotesByIdForRootTarget(
        rootTargetType,
        rootTargetId
      ),
      // We won't support adding legacy justification basis types to statements
      rootTargetType === JustificationRootTargetTypes.PROPOSITION
        ? this.justificationBasisCompoundsDao.readJustificationBasisCompoundsByIdForRootPropositionId(
            rootTargetId
          )
        : [],
    ]);
    const { rootJustifications, counterJustificationsByJustificationId } =
      groupRootJustifications(rootTargetType, rootTargetId, justification_rows);
    const justifications = map(rootJustifications, (j) =>
      toJustification(
        j,
        counterJustificationsByJustificationId,
        propositionCompoundsById,
        writQuotesById,
        justificationBasisCompoundsById
      )
    );
    await this.addStatements(justifications);
    return await justifications;
  }

  async readJustificationsDependentUponPropositionId(propositionId: EntityId) {
    const sql = `
      select * from justifications where
            root_target_type = $1
        and root_target_id = $2
      union
        select j.*
        from justifications j
          join proposition_compounds sc on
                j.basis_type = $3
            and j.basis_id = sc.proposition_compound_id
          join proposition_compound_atoms pca using (proposition_compound_id)
          join propositions pcap on
                pca.proposition_id = pcap.proposition_id
            and pcap.proposition_id = $2
    `;
    const { rows } = await this.database.query(
      "readJustificationsDependentUponPropositionId",
      sql,
      [
        JustificationRootTargetTypes.PROPOSITION,
        propositionId,
        JustificationBasisTypes.PROPOSITION_COMPOUND,
      ]
    );
    const justifications = map(rows, toJustification);
    await this.addStatements(justifications);
    return await justifications;
  }

  async readJustificationForId(justificationId: EntityId) {
    const { rows } = await this.database.query(
      "readJustificationForId",
      "select * from justifications where justification_id = $1 and deleted is null",
      [justificationId]
    );
    if (rows.length > 1) {
      this.logger.error(
        `More than one justification has ID ${justificationId}`
      );
    }
    const justification = toJustification(head(rows));
    await this.addStatements([justification]);
    return await justification;
  }

  async readJustificationEquivalentTo(justification: ReadJustificationDataOut) {
    const sql = `
      select * from justifications j where
            j.deleted is null
        and j.target_type = $1
        and j.target_id = $2
        and j.polarity = $3
        and j.basis_type = $4
        and j.basis_id = $5
    `;
    const args = [
      justification.target.type,
      justification.target.entity.id,
      justification.polarity,
      justification.basis.type,
      justification.basis.entity.id,
    ];
    const { rows } = await this.database.query(
      "readJustificationEquivalentTo",
      sql,
      args
    );
    const equivalentJustification = toJustification(head(rows));
    assert(
      () =>
        !equivalentJustification ||
        doTargetSameRoot(equivalentJustification, justification),
      () =>
        `justification's (${justification.id}) rootTarget ${justification.rootTargetType} ` +
        `${justification.rootTarget.id} does not equal equivalent justification's ` +
        `(${equivalentJustification.id}) rootTarget ${justification.rootTargetType} ` +
        `${equivalentJustification.rootTarget.id}`
    );
    const justification_1 = equivalentJustification;
    if (justification_1) {
      await this.addStatements([justification_1]);
    }
    return await justification_1;
  }

  async readRootJustificationCountByPolarityForRoot(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId
  ) {
    const { rows } = await this.database.query<{
      polarity: JustificationPolarity;
      count: number;
    }>(
      "readRootJustificationCountByPolarityForRoot",
      `
      select polarity, count(*) as count
      from justifications
        where
              root_target_type = $1
          and root_target_id = $2
          and target_type = $1
          and target_id = $2
      group by polarity
    `,
      [rootTargetType, rootTargetId]
    );
    const rootJustificationCountByPolarity: Partial<
      Record<JustificationPolarity, number>
    > = {};
    forEach(rows, (row) => {
      rootJustificationCountByPolarity[row.polarity] = row.count;
    });
    return rootJustificationCountByPolarity;
  }

  async createJustification(
    justification: CreateJustificationDataIn,
    userId: EntityId,
    now: Moment
  ): Promise<ReadJustificationDataOut> {
    const rootPolarity = await this.getNewJustificationRootPolarity(
      justification
    );
    const sql = `
          insert into justifications
            (root_target_type, root_target_id, root_polarity, target_type, target_id, basis_type, basis_id, polarity, creator_user_id, created)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          returning *
          `;
    const args = [
      justification.rootTargetType,
      justification.rootTarget.id,
      rootPolarity,
      justification.target.type,
      justification.target.entity.id,
      justification.basis.type,
      justification.basis.entity.id,
      justification.polarity,
      userId,
      now,
    ];
    const {
      rows: [row],
    } = await this.database.query("createJustification", sql, args);
    return justificationRowToData(row);
  }

  deleteJustifications(
    justifications: DeleteJustificationDataIn[],
    now: Moment
  ) {
    const justificationIds = map(justifications, (j) => j.id);
    return this.deleteJustificationsById(justificationIds, now);
  }

  deleteJustificationsById(justificationIds: EntityId[], now: Moment) {
    return Promise.all(
      map(justificationIds, (id) => this.deleteJustificationById(id, now))
    );
  }

  deleteJustification(justification: DeleteJustificationDataIn, now: Moment) {
    return this.deleteJustificationById(justification.id, now);
  }

  async deleteJustificationById(justificationId: EntityId, now: Moment) {
    const { rows } = await this.database.query(
      "deleteJustificationById",
      "update justifications set deleted = $2 where justification_id = $1 returning justification_id",
      [justificationId, now]
    );
    if (rows.length > 1) {
      this.logger.error(
        `More than one (${rows.length}) justifications deleted for ID ${justificationId}`
      );
    }
    const row = head(rows);
    if (!row) {
      return null;
    }
    return row.justification_id;
  }

  async deleteCounterJustificationsToJustificationIds(
    justificationIds: EntityId[],
    now: Moment
  ) {
    const { rows } = await this.database.query(
      "deleteCounterJustificationsToJustificationIds",
      `
        update justifications set deleted = $1
        where
              target_type = $2
          and target_id = any ($3)
        returning justification_id`,
      [now, JustificationTargetTypes.JUSTIFICATION, justificationIds]
    );
    return map(rows, (row) => row.justification_id);
  }

  private async addStatements(justifications: ReadJustificationDataOut[]) {
    // Collect all the statements we need to read, as well as the justifications that need them as rootTargets and targets
    const statementIds = new Set();
    const justificationsByRootTargetStatementId = new Map();
    const justificationsByTargetStatementId = new Map();
    for (const justification of justifications) {
      if (
        justification.rootTargetType === JustificationRootTargetTypes.STATEMENT
      ) {
        statementIds.add(justification.rootTarget.id);

        let justificationsRootedInStatementId =
          justificationsByRootTargetStatementId.get(
            justification.rootTarget.id
          );
        if (!justificationsRootedInStatementId) {
          justificationsByRootTargetStatementId.set(
            justification.rootTarget.id,
            (justificationsRootedInStatementId = [])
          );
        }

        justificationsRootedInStatementId.push(justification);
      }
      if (justification.target.type === JustificationTargetTypes.STATEMENT) {
        // It is not possible to target a statement that is not also the root statement, so we don't need to add
        // to statementIds here since we did it above.

        let justificationsTargetingStatementId =
          justificationsByTargetStatementId.get(justification.target.entity.id);
        if (!justificationsTargetingStatementId) {
          justificationsByTargetStatementId.set(
            justification.target.entity.id,
            (justificationsTargetingStatementId = [])
          );
        }

        justificationsTargetingStatementId.push(justification);
      }
    }

    // Query each statement, and insert it into the justifications that need it.
    for (const statementId of statementIds.values()) {
      const statement = await this.statementsDao.readStatementForId(
        statementId
      );

      const justificationsRootTargetingStatement =
        justificationsByRootTargetStatementId.get(statement.id);
      if (justificationsRootTargetingStatement) {
        for (const justification of justificationsRootTargetingStatement) {
          justification.rootTarget = statement;
        }
      }

      const justificationsTargetingStatement =
        justificationsByTargetStatementId.get(statement.id);
      if (justificationsTargetingStatement) {
        for (const justification of justificationsTargetingStatement) {
          justification.target.entity = statement;
        }
      }
    }
  }

  private async addUrls(justifications: ReadJustificationDataOut[]) {
    for (const justification of justifications) {
      if (
        justification.basis.type === JustificationBasisTypes.WRIT_QUOTE &&
        !isRef(justification.basis.entity)
      ) {
        const writQuoteId = justification.basis.entity.id;
        justification.basis.entity.urls =
          await this.writQuotesDao.readUrlsForWritQuoteId(writQuoteId);
      }
    }
  }
  async addUrlTargets(justifications: ReadJustificationDataOut[]) {
    const justificationIds = map(justifications, (j) => j.id);
    const urlTargetByUrlIdByWritQuoteId =
      await this.writQuoteUrlTargetsDao.readByUrlIdByWritQuoteIdForJustificationIds(
        justificationIds
      );
    for (const justification of justifications) {
      if (
        justification.basis.type !== JustificationBasisTypes.WRIT_QUOTE ||
        !("urls" in justification.basis.entity)
      ) {
        continue;
      }
      const urlTargetByUrlId = urlTargetByUrlIdByWritQuoteId.get(
        justification.basis.entity.id
      );
      if (!urlTargetByUrlId) {
        continue;
      }
      for (const url of justification.basis.entity.urls) {
        if (!("target" in url)) {
          continue;
        }
        url.target = urlTargetByUrlId.get(url.id);
      }
    }
  }

  /** Generates SQL and arguments for limit-querying filtered justifications.
   *
   * @param logger - a logger
   * @param filters object - key values of values upon which to filter.
   * @param sorts {property, direction} - an array of instructions for sorting the justifications
   * @param count integer - the maximum number of justifications to return
   * @param isContinuation boolean - whether the query is a continuation of a pagination query
   */
  private makeLimitedJustificationsClause(
    filters: Record<string, string>,
    sorts: SortDescription[],
    count: number,
    isContinuation: boolean
  ) {
    const tableAlias = "j";

    const { whereConditionsSql, orderByExpressionsSql, args } =
      makeLimitedJustificationsOrderClauseParts(
        sorts,
        isContinuation,
        tableAlias
      );

    const filteredJustificationClauses = this.makeFilteredJustificationClauses(
      filters,
      sorts
    );
    const renumberedFilteredJustificationClauseSqls: string[] = [];
    forEach(filteredJustificationClauses, (filterClause) => {
      renumberedFilteredJustificationClauseSqls.push(
        renumberSqlArgs(filterClause.sql, args.length)
      );
      pushAll(args, filterClause.args);
    });

    const whereSql = whereConditionsSql ? "where " + whereConditionsSql : "";
    const orderBySql = orderByExpressionsSql
      ? "order by " + orderByExpressionsSql
      : "";

    args.push(count);
    const sql = `
    select ${tableAlias}.*
    from (
      ${renumberedFilteredJustificationClauseSqls.join("\n union \n")}
    ) ${tableAlias}
    ${whereSql}
    ${orderBySql}
    limit $${args.length}
  `;

    return {
      sql: sql,
      args: args,
    };
  }

  private makeFilteredJustificationClauses(
    filters: JustificationFilters,
    sorts: SortDescription[]
  ) {
    const clauses: SqlClause[] = [];

    const columnNames = ["justification_id"];
    forEach(sorts, (sort) => {
      const sortProperty = sort.property;
      // We already include the ID, so ignore it
      if (sortProperty !== "id") {
        const columnName = snakeCase(sortProperty);
        columnNames.push(columnName);
      }
    });

    for (const [filterName, filterValue] of toEntries(filters)) {
      if (!filterValue) {
        this.logger.warn(
          `skipping filter ${filterName} because it has no value`
        );
        return;
      }
      switch (filterName) {
        case "propositionId": {
          pushAll(
            clauses,
            makePropositionJustificationClause(filterValue, columnNames)
          );
          break;
        }
        case "propositionCompoundId": {
          clauses.push(
            makePropositionCompoundJustificationClause(filterValue, columnNames)
          );
          break;
        }
        case "sourceExcerptParaphraseId": {
          clauses.push(
            makeSourceExcerptParaphraseJustificationClause(
              filterValue,
              columnNames
            )
          );
          break;
        }
        case "writQuoteId": {
          pushAll(
            clauses,
            makeWritQuoteJustificationClause(filterValue, columnNames)
          );
          break;
        }
        case "writId": {
          pushAll(
            clauses,
            makeWritJustificationClause(filterValue, columnNames)
          );
          break;
        }
        case "url": {
          clauses.push(
            makeWritQuoteUrlJustificationClause(filterValue, columnNames)
          );
          break;
        }
        default:
          throw newExhaustedEnumError(filterName);
      }
    }

    if (clauses.length < 1) {
      clauses.push(makeDefaultJustificationSql(columnNames));
    }

    return clauses;
  }

  // here
  private async getNewJustificationRootPolarity(
    justification: CreateJustificationDataIn
  ) {
    switch (justification.target.type) {
      case JustificationTargetTypes.PROPOSITION:
      case JustificationTargetTypes.STATEMENT:
        // root justifications have root polarity equal to their polarity
        return justification.polarity;
      case JustificationTargetTypes.JUSTIFICATION: {
        const rootPolarity = await this.readTargetRootPolarity(justification);
        assert(
          justification.polarity === JustificationPolarities.NEGATIVE,
          "Justifications targeting justifications must be negative"
        );
        return negateRootPolarity(rootPolarity);
      }
      default:
        throw newImpossibleError(
          `Cannot create justification because had unsupported target type: ${justification.target}`
        );
    }
  }

  private async readTargetRootPolarity(
    justification: CreateJustificationDataIn
  ) {
    const { rows } = await this.database.query(
      "getTargetRootPolarity",
      "select root_polarity from justifications where justification_id = $1",
      [justification.target.entity.id]
    );
    if (rows.length < 1) {
      throw new EntityNotFoundError(
        `Could not create justification because target justification having ID ${justification.target.entity.id} did not exist`
      );
    } else if (rows.length > 1) {
      this.logger.error(
        `while creating justification, found more than one target justification having ID ${justification.target.entity.id}`
      );
    }

    const { root_polarity } = head(rows);
    return root_polarity as JustificationRootPolarity;
  }

  private async readPropositionCompoundsByIdForRootTarget(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId,
    { userId }: { userId: EntityId }
  ) {
    const propositionCompoundsById =
      await this.propositionCompoundsDao.readPropositionCompoundsByIdForRootTarget(
        rootTargetType,
        rootTargetId,
        {
          userId,
        }
      );
    await this.addRootJustificationCountByPolarity(propositionCompoundsById);
    return propositionCompoundsById;
  }

  private async addRootJustificationCountByPolarity(
    propositionCompoundsById: Record<EntityId, ReadPropositionCompoundDataOut>
  ) {
    const atoms = flatMap(
      propositionCompoundsById,
      (propositionCompound) => propositionCompound.atoms
    );
    const justificationCounts = await Promise.all(
      map(
        atoms,
        (atom) =>
          "entity" in atom &&
          this.readRootJustificationCountByPolarityForRoot(
            JustificationRootTargetTypes.PROPOSITION,
            atom.entity.id
          )
      )
    );
    forEach(atoms, (atom, i) => {
      if (!("entity" in atom) || isRef(atom.entity)) {
        return;
      }
      const justificationCount = justificationCounts[i];
      if (!justificationCount) {
        return;
      }
      atom.entity.rootJustificationCountByPolarity = justificationCount;
    });
  }
}

/** Directly return an object of the justifications keyed by their ID */
function mapJustificationRowsById(rows: JustificationRow[], prefix = "") {
  const [justificationsById] = mapJustificationRowsWithOrdering(rows, prefix);
  return justificationsById;
}

function mapPropositionRowsById(
  rows: PropositionRow[]
): Record<EntityId, PropositionData> {
  const byId: Record<EntityId, PropositionData> = {};
  forEach(rows, (row) => {
    const proposition = toProposition(row);
    byId[proposition.id] = proposition;
  });
  return byId;
}

/** Use the ordering to return the justifications as an array in query-order */
function mapJustificationRows(rows: JustificationRow[], prefix = "") {
  const [justificationsById, orderedJustificationIds] =
    mapJustificationRowsWithOrdering(rows, prefix);
  const orderedJustifications: ReadJustificationDataOut[] = [];
  forEach(orderedJustificationIds, (justificationId) => {
    orderedJustifications.push(justificationsById[justificationId]);
  });
  return orderedJustifications;
}

function mapJustificationRowsWithOrdering(
  rows: JustificationRow[],
  prefix = ""
): [Record<EntityId, ReadJustificationDataOut>, EntityId[]] {
  // Keep track of the order so that we can efficiently put them back in order
  const orderedJustificationIds: EntityId[] = [];
  const justificationRowsById: Record<EntityId, JustificationRow> = {};
  const writQuotesRowsById: Record<EntityId, WritQuoteRow> = {};
  const propositionCompoundRowsById: Record<
    EntityId,
    { proposition_compound_id: EntityId }
  > = {};
  const propositionCompoundAtomsByCompoundId: Record<
    EntityId,
    Record<EntityId, PropositionCompoundAtomRow[]>
  > = {};
  const justificationBasisCompoundRowsById: Record<
    EntityId,
    { justification_basis_compound_id: EntityId }
  > = {};
  const justificationBasisCompoundAtomsByCompoundId: Record<
    EntityId,
    Record<EntityId, JustificationBasisCompoundRow[]>
  > = {};

  forEach(rows, (row: any) => {
    const rowId = row[prefix + "justification_id"];

    if (!has(justificationRowsById, rowId)) {
      orderedJustificationIds.push(rowId);
      justificationRowsById[rowId] = {
        justification_id: rowId,
        root_polarity: row[prefix + "root_polarity"],
        root_target_type: row[prefix + "root_target_type"],
        root_target_id: row[prefix + "root_target_id"],
        root_target_proposition_id: row[prefix + "root_target_proposition_id"],
        root_target_text: row[prefix + "root_target_proposition_text"],
        root_target_created: row[prefix + "root_target_proposition_created"],
        root_target_creator_user_id:
          row[prefix + "root_target_proposition_creator_user_id"],
        target_type: row[prefix + "target_type"],
        target_id: row[prefix + "target_id"],
        basis_type: row[prefix + "basis_type"],
        basis_id: row[prefix + "basis_id"],
        polarity: row[prefix + "polarity"],
        creator_user_id: row[prefix + "creator_user_id"],
        created: row[prefix + "created"],
      };
    }

    const basisWritQuoteId = row[prefix + "basis_writ_quote_id"];
    if (basisWritQuoteId) {
      writQuotesRowsById[basisWritQuoteId] = toWritQuote({
        writ_quote_id: basisWritQuoteId,
        quote_text: row[prefix + "basis_writ_quote_quote_text"],
        created: row[prefix + "basis_writ_quote_created"],
        creator_user_id: row[prefix + "basis_writ_quote_creator_user_id"],
        writ_id: row[prefix + "basis_writ_quote_writ_id"],
        writ_title: row[prefix + "basis_writ_quote_writ_title"],
        writ_created: row[prefix + "basis_writ_quote_writ_created"],
        writ_creator_user_id: row[prefix + "basis_writ_quote_creator_user_id"],
      });
    }

    const propositionCompoundId = row[prefix + "basis_proposition_compound_id"];
    if (isDefined(propositionCompoundId)) {
      const propositionCompoundRow =
        propositionCompoundRowsById[propositionCompoundId];
      if (!propositionCompoundRow) {
        propositionCompoundRowsById[propositionCompoundId] = {
          proposition_compound_id: propositionCompoundId,
        };
      }

      // Atoms are stored by proposition ID because proposition compound atoms don't have their own ID
      let atomsByPropositionId: Record<EntityId, PropositionCompoundAtomRow[]> =
        propositionCompoundAtomsByCompoundId[propositionCompoundId];
      if (!atomsByPropositionId) {
        propositionCompoundAtomsByCompoundId[propositionCompoundId] =
          atomsByPropositionId = {};
      }
      if (
        !has(
          atomsByPropositionId,
          row[prefix + "basis_proposition_compound_atom_proposition_id"]
        )
      ) {
        const atom = toPropositionCompoundAtom({
          proposition_compound_id: propositionCompoundId,
          proposition_id:
            row[prefix + "basis_proposition_compound_atom_proposition_id"],
          proposition_text:
            row[prefix + "basis_proposition_compound_atom_proposition_text"],
          proposition_created:
            row[prefix + "basis_proposition_compound_atom_proposition_created"],
          proposition_creator_user_id:
            row[
              prefix +
                "basis_proposition_compound_atom_proposition_creator_user_id"
            ],
          order_position:
            row[prefix + "basis_proposition_compound_atom_order_position"],
        });
        atomsByPropositionId[atom.entity.id] = atom;
      }
    }

    const justificationBasisCompoundId = row[prefix + "basis_jbc_id"];
    if (isDefined(justificationBasisCompoundId)) {
      const justificationBasisCompoundRow =
        justificationBasisCompoundRowsById[justificationBasisCompoundId];
      if (!justificationBasisCompoundRow) {
        justificationBasisCompoundRowsById[justificationBasisCompoundId] = {
          justification_basis_compound_id: justificationBasisCompoundId,
        };
      }

      let atomsById =
        justificationBasisCompoundAtomsByCompoundId[
          justificationBasisCompoundId
        ];
      if (!atomsById) {
        justificationBasisCompoundAtomsByCompoundId[
          justificationBasisCompoundId
        ] = atomsById = {};
      }

      const atomId = row[prefix + "basis_jbc_atom_id"];
      if (!atomsById[atomId]) {
        const atom = toJustificationBasisCompoundAtom({
          justification_basis_compound_atom_id: atomId,
          justification_basis_compound_id: justificationBasisCompoundId,
          entity_type: row[prefix + "basis_jbc_atom_entity_type"],
          order_position: row[prefix + "basis_jbc_atom_order_position"],

          proposition_id: row[prefix + "basis_jbc_atom_proposition_id"],
          proposition_text: row[prefix + "basis_jbc_atom_proposition_text"],
          proposition_created:
            row[prefix + "basis_jbc_atom_proposition_created"],
          proposition_creator_user_id:
            row[prefix + "basis_jbc_atom_proposition_creator_user_id"],
          source_excerpt_paraphrase_id: row[prefix + "basis_jbc_atom_sep_id"],
          source_excerpt_paraphrasing_proposition_id:
            row[prefix + "basis_jbc_atom_sep_paraphrasing_proposition_id"],
          source_excerpt_paraphrasing_proposition_text:
            row[prefix + "basis_jbc_atom_sep_paraphrasing_proposition_text"],
          source_excerpt_paraphrasing_proposition_created:
            row[prefix + "basis_jbc_atom_sep_paraphrasing_proposition_created"],
          source_excerpt_paraphrasing_proposition_creator_user_id:
            row[
              prefix +
                "basis_jbc_atom_sep_paraphrasing_proposition_creator_user_id"
            ],
          source_excerpt_type:
            row[prefix + "basis_jbc_atom_sep_source_excerpt_type"],
          source_excerpt_writ_quote_id:
            row[prefix + "basis_jbc_atom_sep_writ_quote_id"],
          source_excerpt_writ_quote_quote_text:
            row[prefix + "basis_jbc_atom_sep_writ_quote_quote_text"],
          source_excerpt_writ_quote_created:
            row[prefix + "basis_jbc_atom_sep_writ_quote_created"],
          source_excerpt_writ_quote_creator_user_id:
            row[prefix + "basis_jbc_atom_sep_writ_quote_creator_user_id"],
          source_excerpt_writ_quote_writ_id:
            row[prefix + "basis_jbc_atom_sep_writ_quote_writ_id"],
          source_excerpt_writ_quote_writ_title:
            row[prefix + "basis_jbc_atom_sep_writ_quote_writ_title"],
          source_excerpt_writ_quote_writ_created:
            row[prefix + "basis_jbc_atom_sep_writ_quote_writ_created"],
          source_excerpt_writ_quote_writ_creator_user_id:
            row[prefix + "basis_jbc_atom_sep_writ_quote_writ_creator_user_id"],
        });

        atomsById[atomId] = atom;
      }
    }

    assert(
      basisWritQuoteId || propositionCompoundId || justificationBasisCompoundId,
      "justification must have a basis"
    );
  });

  const propositionCompoundsById = mapValues(
    propositionCompoundRowsById,
    (row, id) =>
      toPropositionCompound(row, propositionCompoundAtomsByCompoundId[id])
  );

  const justificationBasisCompoundsById = mapValues(
    justificationBasisCompoundRowsById,
    (row, id) =>
      toJustificationBasisCompound(
        row,
        justificationBasisCompoundAtomsByCompoundId[id]
      )
  );

  const justificationsById = mapValues(justificationRowsById, (row) =>
    toJustification(
      row,
      null,
      propositionCompoundsById,
      writQuotesRowsById,
      justificationBasisCompoundsById
    )
  );
  return [justificationsById, orderedJustificationIds];
}

function toSelect(columns: string[], tableAlias: string) {
  const tablePrefix = tableAlias ? tableAlias + "." : "";
  return map(columns, (c) => tablePrefix + c).join(", ");
}

function makeDefaultJustificationSql(justificationColumns: string[]) {
  const select = toSelect(justificationColumns, "j");
  const sql = `select ${select} from justifications j where j.deleted is null`;
  return {
    sql,
    args: [],
  };
}

function makeWritQuoteJustificationClause(
  writQuoteId: EntityId,
  justificationColumns: string[]
) {
  const justificationTableAlias = "j";
  const select = toSelect(justificationColumns, justificationTableAlias);
  return [
    // writ-quote-based justifications
    {
      sql: `
        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join writ_quotes wq on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = wq.writ_quote_id
          where
                ${justificationTableAlias}.deleted is null
            and wq.deleted is null
            and wq.writ_quote_id = $2
      `,
      args: [JustificationBasisTypes.WRIT_QUOTE, writQuoteId],
    },
    // paraphrased writ-quotes
    {
      sql: `
        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join justification_basis_compounds jbc on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms bca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  bca.entity_type = $2
              and bca.entity_id = sep.source_excerpt_paraphrase_id
            join writ_quotes wq on
                  sep.source_excerpt_type = $3
              and sep.source_excerpt_id = wq.writ_quote_id
          where
                ${justificationTableAlias}.deleted is null
            and jbc.deleted is null
            and sep.deleted is null
            and wq.deleted is null
            and wq.writ_quote_id = $4
      `,
      args: [
        JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
        SourceExcerptTypes.WRIT_QUOTE,
        writQuoteId,
      ],
    },
  ];
}

function makeWritJustificationClause(
  writId: EntityId,
  justificationColumns: string[]
) {
  const justificationTableAlias = "j";
  const select = toSelect(justificationColumns, justificationTableAlias);
  return [
    {
      sql: `
        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join writ_quotes wq on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = wq.writ_quote_id
            join writs w using (writ_id)
          where
                ${justificationTableAlias}.deleted is null
            and wq.deleted is null
            and w.deleted is null
            and w.writ_id = $2
      `,
      args: [JustificationBasisTypes.WRIT_QUOTE, writId],
    },
    // paraphrased writ-quote writs
    {
      sql: `
        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join justification_basis_compounds jbc on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms bca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  bca.entity_type = $2
              and bca.entity_id = sep.source_excerpt_id
            join writ_quotes wq on
                  sep.source_excerpt_type = $3
              and sep.source_excerpt_id = wq.writ_quote_id
            join writs w using (writ_id)
          where
                ${justificationTableAlias}.deleted is null
            and jbc.deleted is null
            and sep.deleted is null
            and wq.deleted is null
            and w.deleted is null
            and w.writ_id = $4
      `,
      args: [
        JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
        SourceExcerptTypes.WRIT_QUOTE,
        writId,
      ],
    },
  ];
}

function makePropositionCompoundJustificationClause(
  propositionCompoundId: EntityId,
  justificationColumns: string[]
) {
  const select = toSelect(justificationColumns, "j");
  const sql = `
    select
      ${select}
    from
      justifications j
        join proposition_compounds sc on
              j.basis_type = $1
          and j.basis_id = sc.proposition_compound_id
      where
            j.deleted is null
        and sc.deleted is null
        and sc.proposition_compound_id = $2
  `;
  const args = [
    JustificationBasisTypes.PROPOSITION_COMPOUND,
    propositionCompoundId,
  ];
  return {
    sql,
    args,
  };
}

function makeSourceExcerptParaphraseJustificationClause(
  sourceExcerptParaphraseId: EntityId,
  justificationColumns: string[]
) {
  const select = toSelect(justificationColumns, "j");
  const sql = `
    select
      ${select}
    from
      justifications j
        join justification_basis_compounds jbc on
              j.basis_type = $1
          and j.basis_id = jbc.justification_basis_compound_id
        join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
        join source_excerpt_paraphrases sep on
              jbca.entity_type = $2
          and jbca.entity_id = sep.source_excerpt_paraphrase_id
      where
            j.deleted is null
        and sep.deleted is null
        and sep.source_excerpt_paraphrase_id = $3
  `;
  const args = [
    JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
    JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
    sourceExcerptParaphraseId,
  ];
  return {
    sql,
    args,
  };
}

function makeWritQuoteUrlJustificationClause(
  url: string,
  justificationColumns: string[]
) {
  const justificationTableAlias = "j";
  const select = toSelect(justificationColumns, justificationTableAlias);
  return {
    sql: `
        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join writ_quotes wq on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = wq.writ_quote_id
            join writ_quote_url_targets wqut using (writ_quote_id)
            join urls u using (url_id)
          where
                ${justificationTableAlias}.deleted is null
            and wq.deleted is null
            and wqut.deleted is null
            and u.url = $2

        union

        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join writ_quotes wq on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = wq.writ_quote_id
            join writ_quote_urls wqu using (writ_quote_id)
            join urls u using (url_id)
          where
                ${justificationTableAlias}.deleted is null
            and wq.deleted is null
            and wqu.deleted is null
            and u.url = $2
      `,
    args: [JustificationBasisTypes.WRIT_QUOTE, url],
  };
}

function makePropositionJustificationClause(
  propositionId: EntityId,
  justificationColumns: string[]
): SqlClause[] {
  const justificationTableAlias = "j";
  const select = toSelect(justificationColumns, justificationTableAlias);
  return [
    // Proposition compound propositions
    {
      sql: `
        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join proposition_compounds sc on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = sc.proposition_compound_id
            join proposition_compound_atoms sca using (proposition_compound_id)
          where
                ${justificationTableAlias}.deleted is null
            and sc.deleted is null
            and sca.proposition_id = $2
      `,
      args: [JustificationBasisTypes.PROPOSITION_COMPOUND, propositionId],
    },
    // compound justification propositions
    {
      sql: `
        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join justification_basis_compounds jbc on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
            join propositions s on
                  jbca.entity_type = $2
              and jbca.entity_id = s.proposition_id
          where
                ${justificationTableAlias}.deleted is null
            and jbc.deleted is null
            and s.proposition_id = $3
      `,
      args: [
        JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomTypes.PROPOSITION,
        propositionId,
      ],
    },
    // paraphrasing propositions
    {
      sql: `
        select
          ${select}
        from
          justifications ${justificationTableAlias}
            join justification_basis_compounds jbc on
                  ${justificationTableAlias}.basis_type = $1
              and ${justificationTableAlias}.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  jbca.entity_type = $2
              and jbca.entity_id = sep.source_excerpt_paraphrase_id
            join propositions ps on
              sep.paraphrasing_proposition_id = ps.proposition_id
          where
                ${justificationTableAlias}.deleted is null
            and jbc.deleted is null
            and sep.deleted is null
            and ps.proposition_id = $3
      `,
      args: [
        JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
        propositionId,
      ],
    },
  ];
}

function makeLimitedJustificationsOrderClauseParts(
  sorts: SortDescription[],
  isContinuation: boolean,
  tableAlias: string
) {
  const args: any[] = [];
  const whereConditionSqls: string[] = [];
  const orderByExpressionSqls: string[] = [];

  const continuationWhereConditionSqls: string[] = [];
  const prevContinuationWhereConditionSqls: string[] = [];
  forEach(sorts, (sort) => {
    // The default direction is ascending, so if it is missing that's ok
    const direction =
      sort.direction === SortDirections.DESCENDING
        ? DatabaseSortDirection.DESCENDING
        : DatabaseSortDirection.ASCENDING;

    const sortProperty = sort.property;
    // 'id' is a special property name for entities. The column is prefixed by the entity type
    const columnName =
      sortProperty === "id" ? "justification_id" : snakeCase(sortProperty);

    whereConditionSqls.push(`${tableAlias}.${columnName} is not null`);
    orderByExpressionSqls.push(`${tableAlias}.${columnName} ${direction}`);

    if (isContinuation) {
      const operator =
        direction === DatabaseSortDirection.ASCENDING ? ">" : "<";
      const value = sort.value;
      args.push(value);
      const currContinuationWhereSql = concat(
        prevContinuationWhereConditionSqls,
        [`${tableAlias}.${columnName} ${operator} $${args.length}`]
      );
      continuationWhereConditionSqls.push(
        currContinuationWhereSql.join(" and ")
      );
      prevContinuationWhereConditionSqls.push(
        `${tableAlias}.${columnName} = $${args.length}`
      );
    }
  });

  if (continuationWhereConditionSqls.length > 0) {
    whereConditionSqls.push(`(
      ${continuationWhereConditionSqls.join("\n or ")}
    )`);
  }

  const whereConditionsSql = whereConditionSqls.join("\n and ");
  const orderByExpressionsSql = orderByExpressionSqls.join(", ");

  return {
    whereConditionsSql,
    orderByExpressionsSql,
    args,
  };
}

function makeJustificationsQueryOrderByExpressionsSql(
  sorts: SortDescription[],
  tableAlias: string
) {
  const orderByExpressionSqls: string[] = [];
  const tablePrefix = tableAlias ? tableAlias + "." : "";
  forEach(sorts, (sort) => {
    // The default direction is ascending, so if it is missing that's ok
    const direction =
      sort.direction === SortDirections.DESCENDING
        ? DatabaseSortDirection.DESCENDING
        : DatabaseSortDirection.ASCENDING;

    const sortProperty = sort.property;
    // 'id' is a special property name for entities. The column is prefixed by the entity type
    const columnName =
      sortProperty === "id" ? "justification_id" : snakeCase(sortProperty);

    orderByExpressionSqls.push(`${tablePrefix}${columnName} ${direction}`);
  });

  return orderByExpressionSqls.join(", ");
}
