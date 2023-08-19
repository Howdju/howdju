import {
  EntityId,
  Logger,
  cleanWhitespace,
  CreatePersorg,
  Persorg,
  UpdatePersorg,
  brandedParse,
  PersorgRef,
  PersorgOut,
} from "howdju-common";

import { normalizeText, toIdString } from "./daosUtil";
import { toPersorg } from "./orm";
import { BaseDao } from "./BaseDao";
import { Database } from "../database";
import { Moment } from "moment";
import { UsersDao } from "./UsersDao";
import { keyBy } from "lodash";

export class PersorgsDao extends BaseDao {
  constructor(
    logger: Logger,
    private readonly db: Database,
    private readonly usersDao: UsersDao
  ) {
    super(logger, db, toPersorg);
  }

  async createPersorg(
    persorg: CreatePersorg,
    creatorUserId: EntityId,
    now: Moment
  ) {
    const {
      rows: [{ persorg_id }],
    } = await this.db.query(
      "createPersorg",
      `
      insert into persorgs
        (is_organization, name, normal_name, known_for, normal_known_for,
          website_url, twitter_url, wikipedia_url, creator_user_id, created)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning persorg_id
    `,
      [
        persorg.isOrganization,
        cleanWhitespace(persorg.name),
        normalizeText(persorg.name),
        persorg.knownFor ?? "",
        persorg.knownFor ? normalizeText(persorg.knownFor) : "",
        persorg.websiteUrl,
        persorg.twitterUrl,
        persorg.wikipediaUrl,
        creatorUserId,
        now,
      ]
    );
    return this.readPersorgForId(toIdString(persorg_id));
  }

  async readEquivalentPersorg(persorg: CreatePersorg) {
    const {
      rows: [row],
    } = await this.db.query(
      "readEquivalentPersorg",
      `
        select persorg_id
        from persorgs
          where
                is_organization = $1
            and normal_name = $2
            -- organizations must have unique names and so known_for does not distinguish them.
            -- persons must have distinct known_for.
            and (is_organization or normal_known_for = $3)
            and deleted is null
      `,
      [
        persorg.isOrganization,
        normalizeText(persorg.name),
        persorg.knownFor ? normalizeText(persorg.knownFor) : "",
      ]
    );
    if (!row) {
      return undefined;
    }
    return this.readPersorgForId(toIdString(row.persorg_id));
  }

  async readPersorgForId(persorgId: EntityId) {
    const [persorg] = await this.readPersorgsForIds([persorgId]);
    return persorg;
  }

  async readPersorgsForIds(persorgIds: EntityId[]): Promise<PersorgOut[]> {
    const { rows } = await this.db.query(
      "readPersorgsForIds",
      `select * from persorgs where persorg_id = any($1) and deleted is null`,
      [persorgIds]
    );
    const creatorUserIds = rows.map((row) => toIdString(row.creator_user_id));
    const creators = await this.usersDao.readUserBlurbsForIds(creatorUserIds);
    const creatorsById = keyBy(creators, "id");
    return rows.map((row) => {
      const creatorUserId = toIdString(row.creator_user_id);
      return brandedParse(PersorgRef, {
        id: toIdString(row.persorg_id),
        isOrganization: row.is_organization,
        name: row.name,
        knownFor: row.known_for,
        websiteUrl: row.website_url,
        twitterUrl: row.twitter_url,
        wikipediaUrl: row.wikipedia_url,
        normalName: row.normal_name,
        created: row.created,
        modified: row.modified,
        creatorUserId,
        creator: creatorsById[creatorUserId],
      });
    });
  }

  async readPersorgsForName(persorgName: string) {
    return await this.queryMany(
      "readPersorgsForName",
      `select * from persorgs where normal_name = $1 and deleted is null`,
      [normalizeText(persorgName)]
    );
  }

  async readPersorgs() {
    return await this.queryMany(
      "readPersorgs",
      `
        select *
        from persorgs
        where deleted is null
        order by created
      `
    );
  }

  async readPersorgsLikeName(persorgName: string) {
    return await this.queryMany(
      "readPersorgsLikeName",
      `
        select *
        from persorgs
          where normal_name ilike '%' || $1 || '%'
            and deleted is null
        order by length(name), name
      `,
      [normalizeText(persorgName)]
    );
  }

  async hasEquivalentPersorgs(persorg: Persorg) {
    const equivalentPersorgs = await this.queryMany(
      "hasEquivalentPersorgs",
      `
        select * from persorgs
        where
              normal_name = $1
          and normal_known_for = $2
          and persorg_id <> $3
          and deleted is null`,
      [
        normalizeText(persorg.name),
        persorg.knownFor ? normalizeText(persorg.knownFor) : undefined,
        persorg.id,
      ]
    );
    return equivalentPersorgs.length > 0;
  }

  async updatePersorg(persorg: UpdatePersorg, now: Moment) {
    return this.queryOne(
      "updatePersorg",
      `
        update persorgs set
          is_organization = $2,
          name = $3,
          normal_name = $4,
          known_for = $5,
          normal_known_for = $6,
          website_url = $7,
          twitter_url = $8,
          wikipedia_url = $9,
          modified = $10
          where persorg_id = $1 and deleted is null
        returning *
      `,
      [
        persorg.id,
        persorg.isOrganization,
        persorg.name,
        normalizeText(persorg.name),
        persorg.knownFor ?? "",
        persorg.knownFor ? normalizeText(persorg.knownFor) : "",
        persorg.websiteUrl,
        persorg.twitterUrl,
        persorg.wikipediaUrl,
        now,
      ]
    );
  }

  async deletePersorgForId(persorgId: EntityId, deletedAt: Moment) {
    return await this.queryOne(
      "deletePersorgForId",
      `
        update persorgs set
          deleted = $2
          where persorg_id = $1 and deleted is null
      `,
      [persorgId, deletedAt]
    );
  }
}
