import concat from "lodash/concat";
import forEach from "lodash/forEach";
import head from "lodash/head";
import isFinite from "lodash/isFinite";
import map from "lodash/map";
import snakeCase from "lodash/snakeCase";
import toNumber from "lodash/toNumber";
import { Moment } from "moment";

import {
  cleanWhitespace,
  CreateProposition,
  EntityId,
  JustificationBasisTypes,
  JustificationRootTargetTypes,
  Logger,
  PersistedEntity,
  Proposition,
  PropositionCreatedAsType,
  PropositionOut,
  requireArgs,
  SortDescription,
  SortDirections,
  toSlug,
  UpdateProposition,
} from "howdju-common";

import { toProposition } from "./orm";
import { normalizeText, toCountNumber, toIdString } from "./daosUtil";
import { DatabaseSortDirection } from "./daoModels";
import { Database, EntityNotFoundError, PropositionRow, UsersDao } from "..";
import { keyBy, reduce, toString, uniq } from "lodash";

export class PropositionsDao {
  constructor(
    private readonly database: Database,
    private readonly logger: Logger,
    private readonly usersDao: UsersDao
  ) {}

  async createProposition(
    userId: EntityId,
    createProposition: CreateProposition,
    now: Moment
  ) {
    const {
      rows: [row],
    } = await this.database.query<PropositionRow>(
      "createProposition",
      `
      insert into propositions (
        text, normal_text, created_as_type, creator_user_id, created
      )
      values ($1, $2, $3, $4, $5)
      returning proposition_id`,
      [
        cleanWhitespace(createProposition.text),
        normalizeText(createProposition.text),
        createProposition.isQuestion ? "QUESTION" : undefined,
        userId,
        now,
      ]
    );

    const proposition = await this.readPropositionForId(
      toIdString(row.proposition_id)
    );
    if (!proposition) {
      throw new Error(
        `Unable to read proposition we just created (id: ${row.proposition_id})`
      );
    }
    return proposition;
  }

  async readPropositionForId(propositionId: EntityId) {
    const [proposition] = await this.readPropositionsForIds([propositionId]);
    return proposition;
  }

  async readPropositionsForIds(
    propositionIds: EntityId[]
  ): Promise<PropositionOut[]> {
    const { rows } = await this.database.query<PropositionRow>(
      "readPropositionsForIds",
      `
        select
            p.*
        from propositions p
          where
              p.proposition_id = any($1)
          and p.deleted is null
        order by array_position($1, p.proposition_id)
      `,
      [propositionIds]
    );

    const creatorIds = uniq(rows.map((row) => toIdString(row.creator_user_id)));
    const creators = await this.usersDao.readUserBlurbsForIds(creatorIds);
    const creatorsById = keyBy(creators, "id");

    return rows.map((row) => {
      const proposition: PropositionOut = {
        id: toString(row.proposition_id),
        text: row.text,
        normalText: row.normal_text,
        slug: toSlug(row.text),
        creator: creatorsById[toString(row.creator_user_id)],
        created: row.created,
      };
      if (row.created_as_type) {
        proposition.createdAs = {
          type: row.created_as_type,
          id: this.getCreatedAsId(row),
        };
      }
      return proposition;
    });
  }

  private getCreatedAsId(row: PropositionRow) {
    if (!row.created_as_type) {
      throw new Error(
        `Cannot call getCreatedAsId if row.created_as_type is undefined`
      );
    }
    switch (row.created_as_type) {
      case "APPEARANCE":
        if (!row.created_as_appearance_id) {
          this.logger.error(
            `Proposition ${row.proposition_id} has created_as_type APPEARANCE but no created_as_appearance_id`
          );
          return undefined;
        }
        return toIdString(row.created_as_appearance_id);
      case "STATEMENT":
        if (!row.created_as_statement_id) {
          this.logger.error(
            `Proposition ${row.proposition_id} has created_as_type STATEMENT but no created_as_statement_id`
          );
          return undefined;
        }
        return toIdString(row.created_as_statement_id);
      case "QUESTION":
        return undefined;
    }
  }

  async readPropositionByText(propositionText: string) {
    const {
      rows: [row],
    } = await this.database.query<PropositionRow>(
      "readPropositionByText",
      `
      select p.proposition_id
      from propositions p
      where p.normal_text = $1 and p.deleted is null`,
      [normalizeText(propositionText)]
    );
    if (!row) {
      return undefined;
    }
    return this.readPropositionForId(toString(row.proposition_id));
  }

  async readPropositionIds(sorts: SortDescription[], count: number) {
    requireArgs({ sorts, count });

    const args = [];
    let countSql = "";
    if (isFinite(count)) {
      args.push(count);
      countSql = `limit $${args.length}`;
    }

    const whereSqls = ["deleted is null"];
    const orderBySqls: string[] = [];
    forEach(sorts, (sort) => {
      const columnName =
        sort.property === "id" ? "proposition_id" : snakeCase(sort.property);
      const direction =
        sort.direction === SortDirections.DESCENDING
          ? DatabaseSortDirection.DESCENDING
          : DatabaseSortDirection.ASCENDING;
      whereSqls.push(`${columnName} is not null`);
      orderBySqls.push(columnName + " " + direction);
    });
    const whereSql = whereSqls.join("\nand ");
    const orderBySql =
      orderBySqls.length > 0 ? "order by " + orderBySqls.join(",") : "";

    const sql = `
      select proposition_id
      from propositions where ${whereSql}
      ${orderBySql}
      ${countSql}
      `;
    const { rows } = await this.database.query("readPropositions", sql, args);
    return rows.map((row) => toIdString(row.proposition_id));
  }

  async readMorePropositionIds(
    sortContinuations: SortDescription[],
    count: number
  ) {
    const args = [];
    let countSql = "";
    if (isFinite(count)) {
      args.push(count);
      countSql = `\nlimit $${args.length}`;
    }

    const whereSqls = ["deleted is null"];
    const continuationWhereSqls: string[] = [];
    const prevWhereSqls: string[] = [];
    const orderBySqls: string[] = [];
    forEach(sortContinuations, (sortContinuation) => {
      const value = sortContinuation.value;
      // The default direction is ascending
      const direction =
        sortContinuation.direction === SortDirections.DESCENDING
          ? DatabaseSortDirection.DESCENDING
          : DatabaseSortDirection.ASCENDING;
      // 'id' is a special property name for entities. The column is prefixed by the entity type
      const columnName =
        sortContinuation.property === "id"
          ? "proposition_id"
          : snakeCase(sortContinuation.property);
      const operator =
        direction === DatabaseSortDirection.ASCENDING ? ">" : "<";
      args.push(value);
      const currContinuationWhereSql = concat(prevWhereSqls, [
        `${columnName} ${operator} $${args.length}`,
      ]);
      continuationWhereSqls.push(currContinuationWhereSql.join(" and "));
      prevWhereSqls.push(`${columnName} = $${args.length}`);
      whereSqls.push(`${columnName} is not null`);
      orderBySqls.push(`${columnName} ${direction}`);
    });

    const continuationWhereSql = continuationWhereSqls.join("\n or ");
    const whereSql = whereSqls.join("\nand ");
    const orderBySql =
      orderBySqls.length > 0 ? "order by " + orderBySqls.join(",") : "";

    const sql = `
      select proposition_id
      from propositions where
        ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `;
    const { rows } = await this.database.query(
      "readMorePropositions",
      sql,
      args
    );
    return rows.map((row) => toIdString(row.proposition_id));
  }

  async updateProposition(proposition: UpdateProposition) {
    const { rows } = await this.database.query<PropositionRow>(
      "updateProposition",
      "update propositions set text = $1, normal_text = $2 where proposition_id = $3 and deleted is null returning *",
      [
        cleanWhitespace(proposition.text),
        normalizeText(proposition.text),
        proposition.id,
      ]
    );
    if (rows.length < 1) {
      return undefined;
    }
    return toProposition(rows[0]);
  }

  updateCreatedAsForId(
    propositionId: EntityId,
    createdAsType: PropositionCreatedAsType,
    createdAsEntityId: string
  ) {
    if (!["APPEARANCE", "STATEMENT"].includes(createdAsType)) {
      throw new Error(
        `Unsupported createdAsType for proposition update: ${createdAsType}. Must be APPEARANCE or STATEMENT`
      );
    }
    return this.database.query(
      "updateCreatedAsForId",
      `
        update propositions
        set created_as_type = $1, created_as_appearance_id = $2, created_as_statement_id = $3
        where proposition_id = $4
        `,
      [
        createdAsType,
        createdAsType === "APPEARANCE" ? createdAsEntityId : undefined,
        createdAsType === "STATEMENT" ? createdAsEntityId : undefined,
        propositionId,
      ]
    );
  }

  deleteProposition(proposition: PersistedEntity, deletedAt: Moment) {
    return this.deletePropositionById(proposition.id, deletedAt);
  }

  async deletePropositionById(propositionId: EntityId, deletedAt: Moment) {
    const { rows } = await this.database.query(
      "deletePropositionById",
      "update propositions set deleted = $2 where proposition_id = $1 returning proposition_id",
      [propositionId, deletedAt]
    );
    if (!rows.length) {
      throw new EntityNotFoundError("PROPOSITION", propositionId);
    }
    return head(map(rows, (r) => toIdString(r.proposition_id)));
  }

  async countEquivalentPropositions(
    proposition: Proposition | UpdateProposition
  ) {
    const sql = `
      select count(*) as count
      from propositions
        where
              normal_text = $1
          and proposition_id != $2
          and deleted is null
      `;
    const result = await this.database.query(
      "countEquivalentPropositions",
      sql,
      [normalizeText(proposition.text), proposition.id]
    );
    const {
      rows: [{ count }],
    } = result;
    return toNumber(count);
  }

  async hasOtherUsersRootedJustifications(
    proposition: Proposition | UpdateProposition,
    userId: EntityId
  ) {
    const sql = `
      select count(*) > 0 as result
      from justifications
        where
              root_target_type = $1
          and root_target_id = $2
          and creator_user_id != $3
          and deleted is null
    `;
    const {
      rows: [{ result }],
    } = await this.database.query("hasOtherUsersRootedJustifications", sql, [
      JustificationRootTargetTypes.PROPOSITION,
      proposition.id,
      userId,
    ]);
    return result;
  }

  async hasOtherUsersRootedJustificationsVotes(
    proposition: Proposition | UpdateProposition,
    userId: EntityId
  ) {
    const sql = `
      with
        proposition_justifications as (
          select * from justifications where root_target_type = $1 and root_target_id = $2
        )
      select count(v.*) > 0 as result
      from proposition_justifications sj
        join justification_votes v on
              v.justification_id = sj.justification_id
          and v.user_id != $3
          and v.deleted is null
    `;
    const {
      rows: [{ result }],
    } = await this.database.query(
      "hasOtherUsersRootedJustificationsVotes",
      sql,
      [JustificationRootTargetTypes.PROPOSITION, proposition.id, userId]
    );
    return result;
  }

  async isBasisToOtherUsersJustifications(
    proposition: Proposition | UpdateProposition,
    userId: EntityId
  ) {
    const sql = `
      select count(*) > 0 as result
      from justifications j
        join proposition_compounds sc on
              j.creator_user_id != $3
          and j.basis_type = $2
          and j.basis_id = sc.proposition_compound_id
        join proposition_compound_atoms sca using (proposition_compound_id)
        join propositions scas on
              sca.proposition_id = scas.proposition_id
          and scas.proposition_id = $1
    `;
    const {
      rows: [{ result }],
    } = await this.database.query("isBasisToOtherUsersJustifications", sql, [
      proposition.id,
      JustificationBasisTypes.PROPOSITION_COMPOUND,
      userId,
    ]);
    return result;
  }

  async readAppearanceCountForPropositionId(
    propositionId: EntityId
  ): Promise<number> {
    const countsById = await this.readAppearanceCountForPropositionIds([
      propositionId,
    ]);
    return countsById[propositionId];
  }

  async readAppearanceCountForPropositionIds(propositionIds: EntityId[]) {
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

  async readJustificationBasisUsageCountForPropositionIds(
    propositionIds: EntityId[]
  ) {
    const { rows } = await this.database.query<{
      proposition_id: number;
      count: string;
    }>(
      "readJustificationBasisUsageCountForPropositionIds",
      `
        select
            proposition_id
          , count(*) as count
        from
          propositions p
            join proposition_compound_atoms a using (proposition_id)
            join proposition_compounds c using (proposition_compound_id)
            join justifications j on
                  j.basis_type = $2
              and j.basis_id = c.proposition_compound_id
        where
              p.proposition_id = any ($1)
          and p.deleted is null
          and c.deleted is null
          and j.deleted is null
        group by proposition_id
      `,
      [propositionIds, "PROPOSITION_COMPOUND"]
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
