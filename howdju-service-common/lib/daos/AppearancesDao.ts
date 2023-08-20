import {
  AppearanceSearchFilter,
  EntityId,
  Logger,
  SortDescription,
  toJson,
} from "howdju-common";
import { concat, snakeCase } from "lodash";
import { Moment } from "moment";
import { Database, InvalidRequestError } from "..";
import { toDbDirection } from "./daoModels";
import { renumberSqlArgs, toIdString } from "./daosUtil";
import { SqlClause } from "./daoTypes";

export class AppearancesDao {
  constructor(
    private readonly database: Database,
    private readonly logger: Logger
  ) {}

  async createAppearanceReturningId(
    creatorUserId: EntityId,
    mediaExcerptId: EntityId,
    { propositionId }: { propositionId?: EntityId },
    createdAt: Moment
  ) {
    const {
      rows: [{ appearance_id }],
    } = await this.database.query(
      `createAppearanceReturningId`,
      `insert into appearances (media_excerpt_id, proposition_id, creator_user_id, created)
       values ($1, $2, $3, $4)
       returning appearance_id`,
      [mediaExcerptId, propositionId, creatorUserId, createdAt]
    );
    return toIdString(appearance_id);
  }

  async readAppearanceForId(appearanceId: string) {
    const [appearance] = await this.readAppearancesForIds([appearanceId]);
    return appearance;
  }

  async readAppearancesForIds(appearanceIds: EntityId[]) {
    const { rows } = await this.database.query(
      `readAppearancesForIds`,
      `select appearance_id, media_excerpt_id, proposition_id, creator_user_id, created
       from appearances
       where appearance_id = any($1)
         and deleted is null`,
      [appearanceIds]
    );
    return rows.map((row) => ({
      id: toIdString(row.appearance_id),
      mediaExcerptId: toIdString(row.media_excerpt_id),
      propositionId: toIdString(row.proposition_id),
      creatorUserId: toIdString(row.creator_user_id),
      created: row.created,
    }));
  }

  async readAppearanceIds(
    filters: AppearanceSearchFilter | undefined,
    sorts: SortDescription[],
    count: number
  ) {
    const args: any[] = [count];
    const limitSql = `limit $${args.length}`;

    const whereSqls = ["deleted is null"];
    const orderBySqls: string[] = [];
    sorts.forEach((sort) => {
      const columnName =
        sort.property === "id" ? "appearance_id" : snakeCase(sort.property);
      const direction = toDbDirection(sort.direction);
      whereSqls.push(`${columnName} is not null`);
      orderBySqls.push(`${columnName} ${direction}`);
    });

    const filterSubselects = this.makeFilterSubselects(filters);
    filterSubselects.forEach(({ sql, args: subselectArgs }) => {
      const renumberedSql = renumberSqlArgs(sql, args.length);
      whereSqls.push(`appearance_id in (${renumberedSql})`);
      args.push(...subselectArgs);
    });

    const whereSql = whereSqls.join("\nand ");
    const orderBySql =
      orderBySqls.length > 0 ? "order by " + orderBySqls.join(",") : "";

    const sql = `
      select appearance_id
      from appearances
        where
          ${whereSql}
      ${orderBySql}
      ${limitSql}
      `;
    const { rows } = await this.database.query("readAppearanceIds", sql, args);
    return rows.map((row) => toIdString(row.appearance_id));
  }

  async readMoreAppearanceIds(
    filters: AppearanceSearchFilter | undefined,
    sorts: SortDescription[],
    count: number
  ) {
    const args: any[] = [count];
    const countSql = `\nlimit $${args.length}`;

    const whereSqls = ["deleted is null"];
    const continuationWhereSqls: string[] = [];
    const prevWhereSqls: string[] = [];
    const orderBySqls: string[] = [];
    sorts.forEach((sort) => {
      const value = sort.value;
      if (!value) {
        this.logger.error(
          `readMoreAppearances sort description missing value.`
        );
        throw new InvalidRequestError("Invalid continuation.");
      }
      const direction = toDbDirection(sort.direction);
      const columnName =
        sort.property === "id" ? "appearance_id" : snakeCase(sort.property);
      const operator = direction === "asc" ? ">" : "<";
      args.push(value);
      const currContinuationWhereSql = concat(prevWhereSqls, [
        `${columnName} ${operator} $${args.length}`,
      ]);
      continuationWhereSqls.push(currContinuationWhereSql.join(" and "));
      prevWhereSqls.push(`${columnName} = $${args.length}`);
      whereSqls.push(`${columnName} is not null`);
      orderBySqls.push(`${columnName} ${direction}`);
    });

    const filterSubselects = this.makeFilterSubselects(filters);
    const filterWhereSqls: string[] = [];
    filterSubselects.forEach(({ sql, args: subselectArgs }) => {
      const renumberedSql = renumberSqlArgs(sql, args.length);
      filterWhereSqls.push(`appearance_id in (${renumberedSql})`);
      args.push(...subselectArgs);
    });

    const whereSql = whereSqls.join("\nand ");
    const continuationWhereSql = continuationWhereSqls.join("\n or ");
    const filterWhereSql = filterWhereSqls.join("\nand ");
    const orderBySql =
      orderBySqls.length > 0 ? "order by " + orderBySqls.join(",") : "";

    const sql = `
      select
          appearance_id
      from appearances
        where
          ${whereSql}
        and (
          ${continuationWhereSql}
        )
        ${filterWhereSql ? `and (${filterWhereSql})` : ""}
      ${orderBySql}
      ${countSql}
      `;
    const { rows } = await this.database.query(
      "readMoreAppearances",
      sql,
      args
    );
    return rows.map((row) => toIdString(row.appearance_id));
  }

  private makeFilterSubselects(filters: AppearanceSearchFilter | undefined) {
    const filterSubselects: SqlClause[] = [];
    if (!filters) {
      return filterSubselects;
    }
    let filterName: keyof AppearanceSearchFilter;
    for (filterName in filters) {
      const value = filters[filterName];
      if (!value) {
        this.logger.error(
          `makeFilterSubselects: filter value was mising for ${filterName} (filters ${toJson(
            filters
          )})`
        );
        continue;
      }
      switch (filterName) {
        case "propositionId": {
          const sql = `
          select distinct a.appearance_id
          from
                 appearances a
            join propositions p using (proposition_id)
          where
              proposition_id = $1
          and a.deleted is null
          and p.deleted is null
        `;
          const args = [value];
          filterSubselects.push({ sql, args });
          break;
        }
        case "creatorUserId": {
          const sql = `
          select distinct appearance_id
          from appearances
          where creator_user_id = $1 and deleted is null
        `;
          const args = [value];
          filterSubselects.push({ sql, args });
          break;
        }
        case "mediaExcerptId": {
          const sql = `
            select distinct appearance_id
            from appearances
            where media_excerpt_id = $1 and deleted is null
          `;
          const args = [value];
          filterSubselects.push({ sql, args });
          break;
        }
      }
    }
    return filterSubselects;
  }

  async readOverlappingAppearanceIdsForUsers(
    userIds: EntityId[],
    urlIds: EntityId[],
    sourceIds: EntityId[]
  ) {
    const { rows } = await this.database.query(
      "readOverlappingAppearanceIdsForUsers",
      `
      select
        appearance_id
      from
        appearances a
        join media_excerpts me using (media_excerpt_id)
        join url_locators ul using (media_excerpt_id)
        join urls u using (url_id)
        join media_excerpt_citations mec using (media_excerpt_id)
        join sources s using (source_id)
        join appearance_confirmations ac using (appearance_id)
      where
        a.deleted is null
        and me.deleted is null
        and ul.deleted is null
        and u.deleted is null
        and mec.deleted is null
        and s.deleted is null
        and ac.deleted is null
        and url_id = any($2)
        and source_id = any($3)
        and ac.user_id = any($1)
        and ac.polarity = 'POSITIVE'
      `,
      [userIds, urlIds, sourceIds]
    );
    return rows.map((row) => toIdString(row.appearance_id));
  }

  async readEquivalentAppearanceId(
    userId: string,
    mediaExcerptId: string,
    { propositionId }: { propositionId: string }
  ) {
    const {
      rows: [row],
    } = await this.database.query(
      `readEquivalentAppearanceId`,
      `select appearance_id
       from appearances
       where media_excerpt_id = $1
         and proposition_id = $2
         and creator_user_id = $3
         and deleted is null`,
      [mediaExcerptId, propositionId, userId]
    );
    if (!row) {
      return undefined;
    }
    return toIdString(row.appearance_id);
  }
}
