import {
  concat,
  forEach,
  flatMap,
  has,
  head,
  map,
  mapValues,
  merge,
  snakeCase,
  isArray,
  sortBy,
  toString,
  reduce,
} from "lodash";
import { Moment } from "moment";

import {
  assert,
  isDefined,
  JustificationBasisCompoundAtomTypes,
  JustificationBasisTypes,
  JustificationPolarities,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  negateRootPolarity,
  newExhaustedEnumError,
  newImpossibleError,
  pushAll,
  SortDirections,
  SourceExcerptTypes,
  Logger,
  EntityId,
  JustificationRootTargetType,
  JustificationPolarity,
  JustificationRootPolarity,
  filterDefined,
  JustificationFilters,
  SortDescription,
  toJson,
} from "howdju-common";

import {
  toJustification,
  toPropositionCompound,
  toPropositionCompoundAtom,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
  toWritQuote,
  toProposition,
  ToJustificationMapperRow,
  ToPropositionCompoundAtomMapperRow,
} from "./orm";
import { EntityNotFoundError } from "../serviceErrors";
import {
  groupRootJustifications,
  renumberSqlArgs,
  toCountNumber,
  toIdString,
} from "./daosUtil";
import { DatabaseSortDirection } from "./daoModels";
import { StatementsDao } from "./StatementsDao";
import { MediaExcerptsDao } from "./MediaExcerptsDao";
import { PropositionCompoundsDao } from "./PropositionCompoundsDao";
import { WritQuotesDao } from "./WritQuotesDao";
import { JustificationBasisCompoundsDao } from "./JustificationBasisCompoundsDao";
import { WritQuoteUrlTargetsDao } from "./WritQuoteUrlTargetsDao";
import { Database } from "../database";
import {
  JustificationRow,
  PropositionRow,
  ReadPropositionDataOut,
  JustificationBasisCompoundRow,
  ReadPropositionCompoundDataOut,
  ReadJustificationDataOut,
  CreateJustificationDataIn,
  DeleteJustificationDataIn,
  PropositionCompoundRow,
  WritQuoteData,
  PropositionCompoundAtomRow,
  BasedJustificationDataOut,
} from "./dataTypes";
import { SqlClause } from "./daoTypes";
import { ensurePresent } from "../services/patterns";

export const MAX_COUNT = 1024;

export class JustificationsDao {
  constructor(
    private readonly logger: Logger,
    private readonly database: Database,
    private readonly statementsDao: StatementsDao,
    private readonly propositionCompoundsDao: PropositionCompoundsDao,
    private readonly mediaExcerptsDao: MediaExcerptsDao,
    private readonly writQuotesDao: WritQuotesDao,
    private readonly justificationBasisCompoundsDao: JustificationBasisCompoundsDao,
    private readonly writQuoteUrlTargetsDao: WritQuoteUrlTargetsDao
  ) {}

  async readJustifications(
    filters: JustificationFilters | undefined,
    sorts: SortDescription[] = [],
    count: number = MAX_COUNT,
    isContinuation = false,
    includeUrls = true
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

        , u.long_name as creator_long_name

        , rp.proposition_id       as root_target_proposition_id
        , rp.text                 as root_target_proposition_text
        , rp.normal_text          as root_target_proposition_normal_text
        , rp.created              as root_target_proposition_created
        , rp.creator_user_id      as root_target_proposition_creator_user_id
        , rpu.long_name           as root_target_proposition_creator_long_name

        , wq.writ_quote_id          as basis_writ_quote_writ_quote_id
        , wq.quote_text             as basis_writ_quote_quote_text
        , wq.normal_quote_text      as basis_writ_quote_normal_quote_text
        , wq.created                as basis_writ_quote_created
        , wq.creator_user_id        as basis_writ_quote_creator_user_id
        , w.writ_id                 as basis_writ_quote_writ_id
        , w.title                   as basis_writ_quote_writ_title
        , w.created                 as basis_writ_quote_writ_created
        , w.creator_user_id         as basis_writ_quote_writ_creator_user_id

        , sc.proposition_compound_id as basis_proposition_compound_proposition_compound_id
        , sc.created                 as basis_proposition_compound_created
        , sc.creator_user_id         as basis_proposition_compound_creator_user_id
        , sca.order_position         as basis_proposition_compound_atom_order_position
        , scas.proposition_id        as basis_proposition_compound_atom_proposition_id
        , scas.text                  as basis_proposition_compound_atom_proposition_text
        , scas.normal_text           as basis_proposition_compound_atom_proposition_normal_text
        , scas.created               as basis_proposition_compound_atom_proposition_created
        , scas.creator_user_id       as basis_proposition_compound_atom_proposition_creator_user_id
        , scasu.long_name            as basis_proposition_compound_atom_proposition_creator_long_name

        , jbc.justification_basis_compound_id          as basis_jbc_id
        , jbca.justification_basis_compound_atom_id    as basis_jbc_atom_id
        , jbca.entity_type                             as basis_jbc_atom_entity_type
        , jbca.order_position                          as basis_jbc_atom_order_position

        , jbcas.proposition_id                         as basis_jbc_atom_proposition_id
        , jbcas.text                                   as basis_jbc_atom_proposition_text
        , jbcas.created                                as basis_jbc_atom_proposition_created
        , jbcas.creator_user_id                        as basis_jbc_atom_proposition_creator_user_id

        , sep.source_excerpt_paraphrase_id             as basis_jbc_atom_sep_id
        , sep_s.proposition_id                         as basis_jbc_atom_sep_paraphrasing_proposition_id
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

          left join users u on ${tableAlias}.creator_user_id = u.user_id

          left join propositions rp on
                ${tableAlias}.root_target_type = $1
            and ${tableAlias}.root_target_id = rp.proposition_id
          left join users rpu on rp.creator_user_id = rpu.user_id

          left join writ_quotes wq on
                ${tableAlias}.basis_type = $2
            and ${tableAlias}.basis_id = wq.writ_quote_id
          left join writs w using (writ_id)

          left join proposition_compounds sc on
                ${tableAlias}.basis_type = $3
            and ${tableAlias}.basis_id = sc.proposition_compound_id
          left join proposition_compound_atoms sca using (proposition_compound_id)
          left join propositions scas on sca.proposition_id = scas.proposition_id
          left join users scasu on scas.creator_user_id = scasu.user_id

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
        , rp.normal_text            as ${targetJustificationPrefix}root_target_proposition_normal_text
        , rp.created                as ${targetJustificationPrefix}root_target_proposition_created
        , rp.creator_user_id        as ${targetJustificationPrefix}root_target_proposition_creator_user_id

        , wq.writ_quote_id          as ${targetJustificationPrefix}basis_writ_quote_writ_quote_id
        , wq.quote_text             as ${targetJustificationPrefix}basis_writ_quote_quote_text
        , wq.created                as ${targetJustificationPrefix}basis_writ_quote_created
        , wq.creator_user_id        as ${targetJustificationPrefix}basis_writ_quote_creator_user_id
        , w.writ_id                 as ${targetJustificationPrefix}basis_writ_quote_writ_id
        , w.title                   as ${targetJustificationPrefix}basis_writ_quote_writ_title
        , w.created                 as ${targetJustificationPrefix}basis_writ_quote_writ_created
        , w.creator_user_id         as ${targetJustificationPrefix}basis_writ_quote_writ_creator_user_id

        , sc.proposition_compound_id  as ${targetJustificationPrefix}basis_proposition_compound_proposition_compound_id
        , sc.created                as ${targetJustificationPrefix}basis_proposition_compound_created
        , sc.creator_user_id        as ${targetJustificationPrefix}basis_proposition_compound_creator_user_id
        , sca.order_position        as ${targetJustificationPrefix}basis_proposition_compound_atom_order_position
        , scas.proposition_id         as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_id
        , scas.text                 as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_text
        , scas.normal_text          as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_normal_text
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

    // TODO(228) convert this to a map where the result of the map always has a target, and so is a ReadJustificationDataOut.
    forEach(justifications, (justification) => {
      switch (justification.target.type) {
        case JustificationTargetTypes.JUSTIFICATION: {
          // TODO(228) topologically sort the justifications using targets as edges and map them in order.
          // BasedJustificationDataOut should not be directly assignable to
          // PersistedJustificationWithRootRef because there's no guarantee we've set the target of
          // right-hand side to a materialized target.
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
      // TODO(228) add statement targets similarly to how we handle justifications and propositions above
      // (add targetStatementsById)
      await this.addStatements(justifications);
      await this.addMediaExcerpts(justifications);
      if (includeUrls) {
        await this.addUrls(justifications);
        await this.addUrlTargets(justifications);
      }
    }

    // TODO(288) remove this cast after converting the forEach to a map above and ensuring all targets
    // are set after the map.
    return justifications as ReadJustificationDataOut[];
  }

  async readJustificationsForRootTarget(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId,
    userId: EntityId
  ): Promise<BasedJustificationDataOut[]> {
    const sql = `
      with
        extant_users as (select * from users where deleted is null)
      select
          j.*
        , v.justification_vote_id as vote_justification_vote_id
        , v.polarity              as vote_polarity
        , v.justification_id      as vote_justification_id
        , u.long_name             as creator_long_name
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
      order by j.justification_id
      `;
    const [
      { rows: justification_rows },
      propositionCompoundsById,
      writQuotesById,
      justificationBasisCompoundsById,
    ] = await Promise.all([
      this.database.query<ToJustificationMapperRow>(
        "readJustificationsForRootTarget",
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
        rootTargetId
      ),
      this.writQuotesDao.readWritQuotesByIdForRootTarget(
        rootTargetType,
        rootTargetId
      ) as Promise<Record<EntityId, WritQuoteData>>,
      // We won't support adding legacy justification basis types to statements
      rootTargetType === JustificationRootTargetTypes.PROPOSITION
        ? this.justificationBasisCompoundsDao.readJustificationBasisCompoundsByIdForRootPropositionId(
            rootTargetId
          )
        : [],
    ]);
    const { rootJustifications, counterJustificationsByJustificationId } =
      groupRootJustifications(rootTargetType, rootTargetId, justification_rows);
    const justifications = filterDefined(
      map(rootJustifications, (j) =>
        toJustification(
          j,
          counterJustificationsByJustificationId,
          propositionCompoundsById,
          writQuotesById,
          justificationBasisCompoundsById
        )
      )
    );
    await this.addStatements(justifications);
    await this.addMediaExcerpts(justifications);
    return justifications;
  }

  async readJustificationsDependentUponPropositionId(propositionId: EntityId) {
    const sql = `
      select justification_id from justifications where
            root_target_type = $1
        and root_target_id = $2
      union
        select j.justification_id
        from justifications j
          join proposition_compounds sc on
                j.basis_type = $3
            and j.basis_id = sc.proposition_compound_id
          join proposition_compound_atoms pca using (proposition_compound_id)
          join propositions pcap on
                pca.proposition_id = pcap.proposition_id
            and pcap.proposition_id = $2
    `;
    const { rows } = await this.database.query<{ justification_id: string }>(
      "readJustificationsDependentUponPropositionId",
      sql,
      [
        JustificationRootTargetTypes.PROPOSITION,
        propositionId,
        JustificationBasisTypes.PROPOSITION_COMPOUND,
      ]
    );
    if (!rows.length) {
      return [];
    }
    const justificationIds = rows.map((row) => toString(row.justification_id));
    return await this.readJustifications({ justificationId: justificationIds });
  }

  async readJustificationForId(
    justificationId: EntityId
  ): Promise<ReadJustificationDataOut | undefined> {
    const [justification] = await this.readJustifications(
      { justificationId },
      [],
      1
    );
    return justification;
  }

  async readJustificationEquivalentTo(
    justification: Omit<
      CreateJustificationDataIn,
      "rootTarget" | "rootTargetType"
    >
  ) {
    const sql = `
      select justification_id from justifications j where
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
    const { rows } = await this.database.query<JustificationRow>(
      "readJustificationEquivalentTo",
      sql,
      args
    );
    if (!rows.length) {
      return undefined;
    }
    const [{ justification_id }] = rows;
    return this.readJustificationForId(toIdString(justification_id));
  }

  private async readRootJustificationCountByPolarityForRoots(
    rootTargetType: JustificationRootTargetType,
    rootTargetIds: EntityId[]
  ) {
    const { rows } = await this.database.query<{
      target_id: number;
      polarity: JustificationPolarity;
      count: number;
    }>(
      "readRootJustificationCountByPolarityForRoots",
      `
      select
          target_id
        , polarity
        , count(*) as count
      from justifications
        where
              target_type = $1
          and target_id = any ($2)
      group by target_id, polarity
    `,
      [rootTargetType, rootTargetIds]
    );
    const countByIdByPolarity: Record<
      EntityId,
      Record<JustificationPolarity, number>
    > = {};
    forEach(rows, ({ target_id, polarity, count }) => {
      if (!(target_id in countByIdByPolarity)) {
        countByIdByPolarity[toIdString(target_id)] = {} as Record<
          JustificationPolarity,
          number
        >;
      }
      countByIdByPolarity[target_id][polarity] = count;
    });
    return countByIdByPolarity;
  }

  async createJustification(
    createJustification: CreateJustificationDataIn,
    userId: EntityId,
    now: Moment
  ): Promise<ReadJustificationDataOut> {
    const rootPolarity = await this.getNewJustificationRootPolarity(
      createJustification
    );
    const sql = `
          insert into justifications
            (root_target_type, root_target_id, root_polarity, target_type, target_id, basis_type, basis_id, polarity, creator_user_id, created)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          returning justification_id
          `;
    const args = [
      createJustification.rootTargetType,
      createJustification.rootTarget.id,
      rootPolarity,
      createJustification.target.type,
      createJustification.target.entity.id,
      createJustification.basis.type,
      createJustification.basis.entity.id,
      createJustification.polarity,
      userId,
      now,
    ];
    const {
      rows: [{ justification_id }],
    } = await this.database.query<{ justification_id: number }>(
      "createJustification",
      sql,
      args
    );
    const justification = await this.readJustificationForId(
      toIdString(justification_id)
    );
    if (!justification) {
      throw new Error(`Could not read justification ${justification_id}`);
    }
    return justification;
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

  async deleteJustification(
    justification: DeleteJustificationDataIn,
    now: Moment
  ) {
    return await this.deleteJustificationById(justification.id, now);
  }

  async deleteJustificationById(justificationId: EntityId, now: Moment) {
    const { rows } = await this.database.query<{ justification_id: number }>(
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
      return undefined;
    }
    return toIdString(row.justification_id);
  }

  async deleteCounterJustificationsToJustificationIds(
    justificationIds: EntityId[],
    now: Moment
  ) {
    const { rows } = await this.database.query<{ justification_id: number }>(
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

  private async addStatements(justifications: BasedJustificationDataOut[]) {
    // Collect all the statements we need to read, as well as the justifications that need them as rootTargets and targets
    const statementIds = new Set<EntityId>();
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
      if (!statement) {
        throw newImpossibleError(
          `Failed to read Statement ID ${statementId} even though referential integrity should have guaranteed its presence.`
        );
      }

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

  private async addMediaExcerpts(justifications: BasedJustificationDataOut[]) {
    const mediaExcerptIdSet = new Set<EntityId>();
    const justificationsByBasisMediaExcerptId = new Map();
    for (let justification of justifications) {
      // Follow counter-justification's targets until we reach the root justification.
      if (justification.target.type === "JUSTIFICATION") {
        // Check that the chain of counter-justifications has been materialized.
        // TODO(#228) improve the types to confirm the materialization (retype
        // justification.target.entity from `Ref<"Justification"> |
        // BasedJustificationWithRootRef` to BasedJustificationDataOut) and remove the typecast below.
        while (justification.target.type === "JUSTIFICATION") {
          if (!justification.target.entity) {
            this.logger.error(
              `Incorrectly materialized justification: ${toJson(justification)}`
            );
            break;
          }
          if (!("counterJustifications" in justification.target.entity)) {
            this.logger.error(
              `Counter justification was not materialized (ID ${justification.target.entity.id}))`
            );
            break;
          }

          // TODO(#228) remove this block
          // Counter-justifications should only ever be PropositionCompound-based, but it's possible
          // that we may find some. We should ensure we have a check to prevent creating them,
          // check the DB for any existing ones, migrate them if necessary, and then remove this block.
          if (justification.basis.type === "MEDIA_EXCERPT") {
            const mediaExcerptId = justification.basis.entity.id;
            if (!justificationsByBasisMediaExcerptId.has(mediaExcerptId)) {
              justificationsByBasisMediaExcerptId.set(mediaExcerptId, []);
            }
            justificationsByBasisMediaExcerptId
              .get(mediaExcerptId)
              .push(justification);
            mediaExcerptIdSet.add(mediaExcerptId);
          }

          // TODO(#228) remove this typecast
          justification = justification.target
            .entity as BasedJustificationDataOut;
        }
      }
      if (justification.basis.type !== "MEDIA_EXCERPT") {
        continue;
      }
      const mediaExcerptId = justification.basis.entity.id;
      if (!justificationsByBasisMediaExcerptId.has(mediaExcerptId)) {
        justificationsByBasisMediaExcerptId.set(mediaExcerptId, []);
      }
      justificationsByBasisMediaExcerptId
        .get(mediaExcerptId)
        .push(justification);
      mediaExcerptIdSet.add(mediaExcerptId);
    }
    const mediaExcerptIds = Array.from(mediaExcerptIdSet);
    const mediaExcerpts = await this.mediaExcerptsDao.readMediaExcerptsForIds(
      mediaExcerptIds
    );
    ensurePresent(mediaExcerptIds, mediaExcerpts, "MEDIA_EXCERPT");
    for (const mediaExcerpt of mediaExcerpts) {
      for (const justification of justificationsByBasisMediaExcerptId.get(
        mediaExcerpt.id
      )) {
        justification.basis.entity = mediaExcerpt;
      }
    }
  }

  private async addUrls(justifications: BasedJustificationDataOut[]) {
    for (const justification of justifications) {
      if (
        justification.basis.type === JustificationBasisTypes.WRIT_QUOTE &&
        "urls" in justification.basis.entity
      ) {
        const writQuoteId = justification.basis.entity.id;
        justification.basis.entity.urls =
          await this.writQuotesDao.readUrlsForWritQuoteId(writQuoteId);
      }
    }
  }

  private async addUrlTargets(justifications: BasedJustificationDataOut[]) {
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
    filters: JustificationFilters | undefined,
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
    filters: JustificationFilters | undefined,
    sorts: SortDescription[]
  ) {
    const clauses: SqlClause[] = [];
    if (!filters) {
      return clauses;
    }

    const columnNames = ["justification_id"];
    forEach(sorts, (sort) => {
      const sortProperty = sort.property;
      // We already include the ID, so ignore it
      if (sortProperty !== "id") {
        const columnName = snakeCase(sortProperty);
        columnNames.push(columnName);
      }
    });

    let filterName: keyof typeof filters;
    for (filterName in filters) {
      const filter = filters[filterName];
      if (!filter) {
        this.logger.warn(
          `skipping filter ${filterName} because it has no value`
        );
        continue;
      }

      switch (filterName) {
        case "justificationId": {
          clauses.push(
            makeJustificationIdJustificationClause(filter, columnNames)
          );
          break;
        }
        case "propositionId": {
          pushAll(
            clauses,
            makePropositionJustificationClause(filter, columnNames)
          );
          break;
        }
        case "propositionCompoundId": {
          clauses.push(
            makePropositionCompoundJustificationClause(filter, columnNames)
          );
          break;
        }
        case "mediaExcerptId": {
          clauses.push(
            makeMediaExcerptJustificationClause(filter, columnNames)
          );
          break;
        }
        case "sourceExcerptParaphraseId": {
          clauses.push(
            makeSourceExcerptParaphraseJustificationClause(filter, columnNames)
          );
          break;
        }
        case "writQuoteId": {
          pushAll(
            clauses,
            makeWritQuoteJustificationClause(filter, columnNames)
          );
          break;
        }
        case "writId": {
          pushAll(clauses, makeWritJustificationClause(filter, columnNames));
          break;
        }
        case "url": {
          clauses.push(
            makeWritQuoteUrlJustificationClause(filter, columnNames)
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
    const { rows } = await this.database.query<{
      root_polarity: JustificationRootPolarity;
    }>(
      "getTargetRootPolarity",
      "select root_polarity from justifications where justification_id = $1",
      [justification.target.entity.id]
    );
    if (rows.length > 1) {
      this.logger.error(
        `while creating justification, found more than one target justification having ID ${justification.target.entity.id}`
      );
    }
    const row = head(rows);
    if (!row) {
      this.logger.error(
        `Could not create justification because target justification having ID ${justification.target.entity.id} did not exist`
      );
      throw new EntityNotFoundError(
        "JUSTIFICATION",
        justification.target.entity.id
      );
    }

    const { root_polarity } = row;
    return root_polarity;
  }

  private async readPropositionCompoundsByIdForRootTarget(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId
  ): Promise<Record<EntityId, ReadPropositionCompoundDataOut>> {
    const propositionCompoundsById =
      await this.propositionCompoundsDao.readPropositionCompoundsByIdForRootTarget(
        rootTargetType,
        rootTargetId
      );
    return this.addAtomRelations(propositionCompoundsById);
  }

  private async addAtomRelations(
    propositionCompoundsById: Record<EntityId, ReadPropositionCompoundDataOut>
  ): Promise<Record<EntityId, ReadPropositionCompoundDataOut>> {
    const atoms = flatMap(
      propositionCompoundsById,
      (propositionCompound) => propositionCompound.atoms
    );
    const propositionIds = map(atoms, (atom) => atom.entity.id);
    const [justificationCountsByPropositionId, appearanceCountByPropositionId] =
      await Promise.all([
        this.readRootJustificationCountByPolarityForRoots(
          JustificationRootTargetTypes.PROPOSITION,
          propositionIds
        ),
        this.readAppearanceCountForPropositionIds(propositionIds),
      ]);
    return mapValues(propositionCompoundsById, (compound) => ({
      ...compound,
      atoms: map(compound.atoms, (atom) =>
        merge(atom, {
          entity: {
            rootJustificationCountByPolarity:
              justificationCountsByPropositionId[atom.entity.id],
            appearanceCount: appearanceCountByPropositionId[atom.entity.id],
          },
        })
      ),
    }));
  }

  async readAppearanceCountForPropositionIds(propositionIds: string[]) {
    const { rows } = await this.database.query<{
      proposition_id: number;
      count: string;
    }>(
      "readAppearanceCountForPropositionIds",
      `
        select
            proposition_id
          , count(*) as count
        from
          propositions p join appearances a using (proposition_id)
        where
              p.proposition_id = any ($1)
          and p.deleted is null
          and a.deleted is null
        group by proposition_id
      `,
      [propositionIds]
    );
    return reduce(
      rows,
      (acc, { proposition_id, count }) => {
        acc[toIdString(proposition_id)] = toCountNumber(count);
        return acc;
      },
      {} as Record<string, number>
    );
  }
}

/** Directly return an object of the justifications keyed by their ID */
function mapJustificationRowsById(rows: JustificationRow[], prefix = "") {
  const [justificationsById] = mapJustificationRowsWithOrdering(rows, prefix);
  return justificationsById;
}

function mapPropositionRowsById(
  rows: PropositionRow[]
): Record<EntityId, ReadPropositionDataOut> {
  const byId: Record<EntityId, ReadPropositionDataOut> = {};
  forEach(rows, (row) => {
    const proposition = toProposition(row);
    if (!proposition) {
      return;
    }
    byId[proposition.id] = proposition;
  });
  return byId;
}

/** Use the ordering to return the justifications as an array in query-order */
function mapJustificationRows(rows: JustificationRow[], prefix = "") {
  const [justificationsById, orderedJustificationIds] =
    mapJustificationRowsWithOrdering(rows, prefix);
  const orderedJustifications: BasedJustificationDataOut[] = [];
  forEach(orderedJustificationIds, (justificationId) => {
    orderedJustifications.push(justificationsById[justificationId]);
  });
  return orderedJustifications;
}

function mapJustificationRowsWithOrdering(
  rows: JustificationRow[],
  prefix = ""
): [Record<EntityId, BasedJustificationDataOut>, EntityId[]] {
  // Keep track of the order so that we can efficiently put them back in order
  const orderedJustificationIds: EntityId[] = [];
  const justificationRowsById: Record<EntityId, ToJustificationMapperRow> = {};
  const writQuotesRowsById: Record<EntityId, WritQuoteData> = {};
  const propositionCompoundRowsById: Record<EntityId, PropositionCompoundRow> =
    {};
  const propositionCompoundAtomRowsByCompoundId: Record<
    EntityId,
    Record<EntityId, ToPropositionCompoundAtomMapperRow>
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
        root_target_normal_text:
          row[prefix + "root_target_proposition_normal_text"],
        root_target_created: row[prefix + "root_target_proposition_created"],
        root_target_creator_user_id:
          row[prefix + "root_target_proposition_creator_user_id"],
        root_target_creator_long_name:
          row[prefix + "root_target_proposition_creator_long_name"],
        target_type: row[prefix + "target_type"],
        target_id: row[prefix + "target_id"],
        basis_type: row[prefix + "basis_type"],
        basis_id: row[prefix + "basis_id"],
        basis_writ_quote_writ_quote_id: undefined,
        basis_proposition_compound_proposition_compound_id: undefined,
        polarity: row[prefix + "polarity"],
        creator_user_id: row[prefix + "creator_user_id"],
        creator_long_name: row[prefix + "creator_long_name"],
        created: row[prefix + "created"],
        vote_justification_vote_id: undefined,
      };
    }

    const basisWritQuoteId = row[prefix + "basis_writ_quote_writ_quote_id"];
    if (basisWritQuoteId) {
      const writQuote = toWritQuote({
        writ_quote_id: basisWritQuoteId,
        quote_text: row[prefix + "basis_writ_quote_quote_text"],
        normal_quote_text: row[prefix + "basis_writ_quote_normal_quote_text"],
        created: row[prefix + "basis_writ_quote_created"],
        creator_user_id: row[prefix + "basis_writ_quote_creator_user_id"],
        writ_id: row[prefix + "basis_writ_quote_writ_id"],
        writ_writ_id: row[prefix + "basis_writ_quote_writ_id"],
        writ_title: row[prefix + "basis_writ_quote_writ_title"],
        writ_created: row[prefix + "basis_writ_quote_writ_created"],
        writ_creator_user_id: row[prefix + "basis_writ_quote_creator_user_id"],
        writ_creator_long_name: "",
      });
      if (writQuote) {
        writQuotesRowsById[basisWritQuoteId] = writQuote;
      }
    }

    const propositionCompoundId =
      row[prefix + "basis_proposition_compound_proposition_compound_id"];
    if (isDefined(propositionCompoundId)) {
      const propositionCompoundRow =
        propositionCompoundRowsById[propositionCompoundId];
      if (!propositionCompoundRow) {
        propositionCompoundRowsById[propositionCompoundId] = {
          proposition_compound_id: propositionCompoundId,
          created: row[prefix + "basis_proposition_compound_created"],
          creator_user_id:
            row[prefix + "basis_proposition_compound_creator_user_id"],
        };
      }

      // Atoms are stored by proposition ID because proposition compound atoms don't have their own ID
      let atomRowsByPropositionId: Record<
        EntityId,
        PropositionCompoundAtomRow
      > = propositionCompoundAtomRowsByCompoundId[propositionCompoundId];
      if (!atomRowsByPropositionId) {
        propositionCompoundAtomRowsByCompoundId[propositionCompoundId] =
          atomRowsByPropositionId = {};
      }
      if (
        !has(
          atomRowsByPropositionId,
          row[prefix + "basis_proposition_compound_atom_proposition_id"]
        )
      ) {
        const atomRow = {
          proposition_compound_id: propositionCompoundId,
          proposition_id:
            row[prefix + "basis_proposition_compound_atom_proposition_id"],
          proposition_proposition_id:
            row[prefix + "basis_proposition_compound_atom_proposition_id"],
          proposition_text:
            row[prefix + "basis_proposition_compound_atom_proposition_text"],
          proposition_normal_text:
            row[
              prefix + "basis_proposition_compound_atom_proposition_normal_text"
            ],
          proposition_created:
            row[prefix + "basis_proposition_compound_atom_proposition_created"],
          proposition_creator_user_id:
            row[
              prefix +
                "basis_proposition_compound_atom_proposition_creator_user_id"
            ],
          proposition_creator_long_name:
            row[
              prefix +
                "basis_proposition_compound_atom_proposition_creator_long_name"
            ],
          order_position:
            row[prefix + "basis_proposition_compound_atom_order_position"],
        };
        if (atomRow) {
          atomRowsByPropositionId[atomRow.proposition_id] = atomRow;
        }
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
    (row, id) => {
      const atomRows = propositionCompoundAtomRowsByCompoundId[id];
      const sortedAtomRows = sortBy(atomRows, (a) => a.order_position);
      const atoms = filterDefined(
        map(sortedAtomRows, (r) => toPropositionCompoundAtom(r))
      );
      return toPropositionCompound(row, atoms);
    }
  );

  const justificationBasisCompoundsById = mapValues(
    justificationBasisCompoundRowsById,
    (row, id) =>
      toJustificationBasisCompound(
        row,
        justificationBasisCompoundAtomsByCompoundId[id]
      )
  );

  const justificationsById = filterDefined(
    mapValues(justificationRowsById, (row) =>
      toJustification(
        row,
        undefined,
        propositionCompoundsById,
        writQuotesRowsById,
        justificationBasisCompoundsById
      )
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
  writQuoteId: EntityId | EntityId[],
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
            and wq.writ_quote_id in ($2)
      `,
      args: [JustificationBasisTypes.WRIT_QUOTE, toInArgString(writQuoteId)],
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
  writId: EntityId | EntityId[],
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
            and w.writ_id in ($2)
      `,
      args: [JustificationBasisTypes.WRIT_QUOTE, toInArgString(writId)],
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
  propositionCompoundId: EntityId | EntityId[],
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
        and sc.proposition_compound_id in ($2)
  `;
  const args = [
    JustificationBasisTypes.PROPOSITION_COMPOUND,
    toInArgString(propositionCompoundId),
  ];
  return {
    sql,
    args,
  };
}

function makeMediaExcerptJustificationClause(
  mediaExcerptId: EntityId | EntityId[],
  justificationColumns: string[]
) {
  const select = toSelect(justificationColumns, "j");
  const sql = `
    select
      ${select}
    from
      justifications j
        join media_excerpts me on
              j.basis_type = $1
          and j.basis_id = me.media_excerpt_id
      where
            j.deleted is null
        and me.deleted is null
        and me.media_excerpt_id in ($2)
  `;
  const args = ["MEDIA_EXCERPT", toInArgString(mediaExcerptId)];
  return {
    sql,
    args,
  };
}

function makeJustificationIdJustificationClause(
  justificationId: EntityId | EntityId[],
  justificationColumns: string[]
) {
  const select = toSelect(justificationColumns, "j");
  const sql = `
    select
      ${select}
    from
      justifications j
      where
            j.deleted is null
        and j.justification_id in ($1)
  `;
  const justificationIdsString = toInArgString(justificationId);
  const args = [justificationIdsString];
  return {
    sql,
    args,
  };
}

function toInArgString(entityIds: EntityId | EntityId[]) {
  return isArray(entityIds) ? entityIds.join(",") : entityIds;
}

function makeSourceExcerptParaphraseJustificationClause(
  sourceExcerptParaphraseId: EntityId | EntityId[],
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
        and sep.source_excerpt_paraphrase_id in ($3)
  `;
  const args = [
    JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
    JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
    toInArgString(sourceExcerptParaphraseId),
  ];
  return {
    sql,
    args,
  };
}

function makeWritQuoteUrlJustificationClause(
  url: string | string[],
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
            and u.url in ($2)
      `,
    args: [JustificationBasisTypes.WRIT_QUOTE, toInArgString(url)],
  };
}

function makePropositionJustificationClause(
  propositionId: EntityId | EntityId[],
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
            and sca.proposition_id in ($2)
      `,
      args: [
        JustificationBasisTypes.PROPOSITION_COMPOUND,
        toInArgString(propositionId),
      ],
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
