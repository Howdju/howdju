import concat from "lodash/concat";
import forEach from "lodash/forEach";
import head from "lodash/head";
import isFinite from "lodash/isFinite";
import map from "lodash/map";
import snakeCase from "lodash/snakeCase";
import toNumber from "lodash/toNumber";
import { Moment } from "moment";

import {
  brandedParse,
  cleanWhitespace,
  CreateProposition,
  EntityId,
  JustificationBasisTypes,
  JustificationRootTargetTypes,
  Proposition,
  PropositionRef,
  requireArgs,
  SortDescription,
  SortDirections,
  toSlug,
  UpdateProposition,
} from "howdju-common";

import { toProposition } from "./orm";
import { normalizeText, toIdString } from "./daosUtil";
import { DatabaseSortDirection } from "./daoModels";
import {
  Database,
  EntityNotFoundError,
  PropositionData,
  PropositionRow,
} from "..";
import { toString } from "lodash";

export class PropositionsDao {
  constructor(private database: Database) {}

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
      insert into propositions (text, normal_text, creator_user_id, created)
      values ($1, $2, $3, $4)
      returning proposition_id`,
      [
        cleanWhitespace(createProposition.text),
        normalizeText(createProposition.text),
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

  async readPropositionsForIds(propositionIds: EntityId[]) {
    const { rows } = await this.database.query<PropositionRow>(
      "readPropositionsForIds",
      `select * from propositions where proposition_id = any ($1) and deleted is null`,
      [propositionIds]
    );
    return rows.map(toProposition);
  }

  async readPropositionForId(propositionId: EntityId) {
    const {
      rows: [row],
    } = await this.database.query<PropositionRow>(
      "readPropositionForId",
      `
        with
          extant_users as (select * from users where deleted is null)
        select
            s.*
          , u.long_name as creator_long_name
        from propositions s left join extant_users u on s.creator_user_id = u.user_id
          where s.proposition_id = $1 and s.deleted is null`,
      [propositionId]
    );
    if (!row) {
      return undefined;
    }
    return toProposition(row);
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

  async readPropositions(
    sorts: SortDescription[],
    count: number
  ): Promise<PropositionData[]> {
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
      select *
      from propositions where ${whereSql}
      ${orderBySql}
      ${countSql}
      `;
    const { rows } = await this.database.query("readPropositions", sql, args);
    return rows.map((row) =>
      brandedParse(PropositionRef, {
        id: toIdString(row.proposition_id),
        text: row.text,
        normalText: row.normal_text,
        slug: toSlug(row.text),
        created: row.created,
      })
    );
  }

  async readMorePropositions(
    sortContinuations: SortDescription[],
    count: number
  ): Promise<PropositionData[]> {
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
      select *
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
    return rows.map((row) =>
      brandedParse(PropositionRef, {
        id: toIdString(row.proposition_id),
        text: row.text,
        normalText: row.normal_text,
        slug: toSlug(row.text),
        created: row.created,
      })
    );
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

  deleteProposition(proposition: PropositionRef, deletedAt: Moment) {
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
}
