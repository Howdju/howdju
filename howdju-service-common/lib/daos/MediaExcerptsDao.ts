import { concat, forEach, merge, snakeCase } from "lodash";
import { Moment } from "moment";

import {
  brandedParse,
  CreateDomAnchor,
  CreateMediaExcerpt,
  CreateMediaExcerptCitation,
  CreateUrlLocator,
  DomAnchor,
  EntityId,
  Logger,
  MediaExcerpt,
  MediaExcerptOut,
  MediaExcerptRef,
  newImpossibleError,
  normalizeText,
  normalizeQuotation,
  PartialPersist,
  PersorgOut,
  UrlLocatorOut,
  UrlLocatorRef,
  SortDescription,
  isDefined,
  MediaExcerptSearchFilter,
  UrlOut,
  SourceOut,
  removeQueryParamsAndFragment,
  MediaExcerptCitationOut,
  SourceRef,
} from "howdju-common";

import { Database, TxnClient } from "../database";
import { PersorgsDao } from "./PersorgsDao";
import { SourcesDao } from "./SourcesDao";
import { UrlsDao } from "./UrlsDao";
import { toDbDirection } from "./daoModels";
import { EntityNotFoundError, InvalidRequestError } from "..";
import { SqlClause } from "./daoTypes";
import { renumberSqlArgs } from "./daosUtil";

export type CreateMediaExcerptDataIn = Pick<
  PartialPersist<CreateMediaExcerpt, "localRep">,
  "localRep"
>;

export class MediaExcerptsDao {
  private logger: Logger;
  private database: Database;
  private urlsDao: UrlsDao;
  private sourcesDao: SourcesDao;
  private persorgsDao: PersorgsDao;

  constructor(
    logger: Logger,
    database: Database,
    urlsDao: UrlsDao,
    sourcesDao: SourcesDao,
    persorgsDao: PersorgsDao
  ) {
    this.logger = logger;
    this.database = database;
    this.urlsDao = urlsDao;
    this.sourcesDao = sourcesDao;
    this.persorgsDao = persorgsDao;
  }

  async readMediaExcerptsForIds(ids: EntityId[]) {
    return await Promise.all(ids.map((id) => this.readMediaExcerptForId(id)));
  }

  async readMediaExcerptForId(
    mediaExcerptId: EntityId
  ): Promise<MediaExcerptOut | undefined> {
    const {
      rows: [row],
    } = await this.database.query(
      "readMediaExceptForId",
      `select * from media_excerpts where media_excerpt_id = $1`,
      [mediaExcerptId]
    );
    if (!row) {
      return undefined;
    }
    const [urlLocators, citations, speakers] = await Promise.all([
      this.readUrlLocatorsForMediaExcerptId(mediaExcerptId),
      this.readCitationsForMediaExcerptId(mediaExcerptId),
      this.readSpeakersForMediaExcerptId(mediaExcerptId),
    ]);
    return brandedParse(MediaExcerptRef, {
      id: row.media_excerpt_id,
      localRep: {
        quotation: row.quotation,
        normalQuotation: row.normal_quotation,
      },
      locators: {
        urlLocators,
      },
      citations,
      speakers,
      created: row.created,
      creatorUserId: row.creator_user_id,
    });
  }

  private async readSpeakersForMediaExcerptId(mediaExcerptId: EntityId) {
    const { rows } = await this.database.query(
      "readSpeakersForMediaExcerptId",
      `select * from media_excerpt_speakers where media_excerpt_id = $1 and deleted is null`,
      [mediaExcerptId]
    );
    return await Promise.all(
      rows.map((row) =>
        this.persorgsDao.readPersorgForId(row.speaker_persorg_id)
      )
    );
  }

  private async readCitationsForMediaExcerptId(mediaExcerptId: EntityId) {
    const { rows } = await this.database.query(
      "readCitationsForMediaExcerptId",
      `
      select *
      from media_excerpt_citations
        where media_excerpt_id = $1 and deleted is null
      order by media_excerpt_id asc, source_id asc, normal_pincite asc`,
      [mediaExcerptId]
    );
    return await Promise.all(
      rows.map(async (row) => {
        const source = await this.sourcesDao.readSourceForId(row.source_id);
        if (!source) {
          throw new EntityNotFoundError("SOURCE", row.source_id);
        }
        return {
          mediaExcerptId,
          pincite: row.pincite,
          normalPincite: row.normal_pincite,
          source,
          created: row.created,
          creatorUserId: row.creator_user_id,
        };
      })
    );
  }

  private async readUrlLocatorsForMediaExcerptId(
    mediaExcerptId: EntityId
  ): Promise<UrlLocatorOut[]> {
    const { rows } = await this.database.query(
      "readUrlLocatorsForMediaExcerptId",
      `select * from url_locators where media_excerpt_id = $1 and deleted is null`,
      [mediaExcerptId]
    );
    return await Promise.all(
      rows.map(async (row) => {
        const url = await this.urlsDao.readUrlForId(row.url_id);
        if (!url) {
          throw new EntityNotFoundError("URL", row.url_id);
        }
        const anchors = await this.readDomAnchorsForUrlLocatorId(
          row.url_locator_id
        );
        return brandedParse(UrlLocatorRef, {
          id: row.url_locator_id,
          url,
          anchors,
          created: row.created,
          creatorUserId: row.creator_user_id,
        });
      })
    );
  }

  private async readDomAnchorsForUrlLocatorId(
    urlLocatorId: EntityId
  ): Promise<DomAnchor[]> {
    const { rows } = await this.database.query(
      "readDomAnchorsForUrlLocatorId",
      `select * from dom_anchors where url_locator_id = $1 and deleted is null`,
      [urlLocatorId]
    );
    return rows.map((row) => ({
      exactText: row.exact_text,
      prefixText: row.prefix_text,
      suffixText: row.suffix_text,
      startOffset: row.start_offset,
      endOffset: row.end_offset,
      urlLocatorId,
      created: row.created,
      creatorUserId: row.creator_user_id,
    }));
  }

  /**
   * Returns an equivalent MediaExcerpt.
   *
   * An equivalent MediaExcerpt has a equivalent localRep and overlapping locators, and
   * citations. An equivalent _localRep_ could be used in multiple distinct MediaExcerpts if
   * the same literal quote was used in different contexts to mean different things.
   *
   * The current logic checks for overlapping URLs and sources. A limitation of this approach is
   * that it does not allow for the case
   * where the same localRep appears in different places with different speech intent in the same
   * URL or source. Since the same localRep in the same URL/Source is likely to have the same speech
   * intent, this should be okay; users can add multiple citations (with different pincites) and
   * multiple URLs (with different locators) to the MediaExcerpt.
   *
   * If we add additional fields to MediaExcerpt.localRep, we should add them to the equivalence
   * check here. localRep fields may follow a similar 'overlapping' apporoach as URLs/MediaExceprts,
   * where if any of the localRep fields are equivalent, then the entire localRep is equivalent. It
   * depends on whether the overlap is a good representation of the equivalence.
   *
   * TODO(454) this logic leaves the possibility that a user may be creating a MediaExcerpt that
   * conceptually is identical to another, but will not be detected as such according to our
   * equivalence logic. For example, a user is adding a MediaExcerpt with the same (or nearly the same)
   * quotation but based on a URL that republishes an article that was already excerpted by another user.
   *
   * To help avoid that, if a user is creating a MediaExcerpt with substantially
   * overlapping localRep to an existing MediaExcerpt, we should suggest those existing
   * MediaExcerpts with the redundant localRep. If the user selects one of those, we should
   * probably add a new field to the CreateMediaExcerpt `equivalentMediaExcerptId` that will allow
   * us to select it here. We can indicate it with a sort of pill or other UI element. (Another
   * option would be to add the citations and URLs to the new MediaExcerpt, but then the user might
   * delete them, frustrating our logic here.)
   *
   * @visibleForTesting
   */
  async readEquivalentMediaExcerptIds(
    client: TxnClient,
    mediaExcerpt: CreateMediaExcerptDataIn,
    urls: UrlOut[],
    sources: SourceOut[]
  ): Promise<EntityId[]> {
    if (urls.length === 0 && sources.length === 0) {
      return [];
    }
    const { rows } = await client.query(
      "readEquivalentMediaExcerptIds",
      `
      select distinct media_excerpt_id
      from media_excerpts me
        left join url_locators ul using (media_excerpt_id)
        left join urls u using (url_id)
        left join media_excerpt_citations mec using (media_excerpt_id)
      where me.normal_quotation = $1
        and me.deleted is null
        and (
           (cardinality($2::bigint[]) != 0 and ul.url_id = any ($2))
        or (cardinality($3::varchar[]) != 0 and u.canonical_url = any ($3))
        or (cardinality($4::bigint[]) != 0 and mec.source_id = any ($4)))
      order by media_excerpt_id asc
      `,
      [
        normalizeQuotation(mediaExcerpt.localRep.quotation),
        urls.map((u) => u.id),
        urls.map((u) => u.canonicalUrl),
        sources.map((s) => s.id),
      ]
    );
    return rows.map((r) => r.media_excerpt_id);
  }

  /**
   * Returns an equivalent MediaExcerpt or creates a new one.
   *
   * See readEquivalentMediaExcerpts for the definition of equivalence.
   *
   * A new MediaExcerpt will be associated with the given UrlLocators and Citations. If an
   * equivalent MediaExcerpt is returned, it may not have all of the UrlLocators or Citations.
   */
  async readOrCreateMediaExcerpt<T extends CreateMediaExcerptDataIn>(
    createMediaExcerpt: T,
    creatorUserId: EntityId,
    created: Moment,
    createUrlLocators: (CreateUrlLocator & { url: UrlOut })[],
    createCitations: (CreateMediaExcerptCitation & { source: SourceOut })[]
  ): Promise<{
    mediaExcerpt: MediaExcerptOut;
    isExtant: boolean;
  }> {
    return await this.database.transaction(
      "readOrCreateMediaExcerpt",
      "serializable",
      "read write",
      async (client) => {
        const equivalentMediaExcerptIds =
          await this.readEquivalentMediaExcerptIds(
            client,
            createMediaExcerpt,
            createUrlLocators.map((l) => l.url),
            createCitations.map((c) => c.source)
          );
        if (equivalentMediaExcerptIds.length) {
          if (equivalentMediaExcerptIds.length > 1) {
            this.logger.warn(
              `readOrCreateMediaExcerpt: multiple equivalent MediaExcerpts: ${equivalentMediaExcerptIds.join(
                ","
              )})`
            );
          }
          const mediaExcerpt = await this.readMediaExcerptForId(
            equivalentMediaExcerptIds[0]
          );
          if (!mediaExcerpt) {
            throw new Error(
              `readOrCreateMediaExcerpt: equivalent MediaExcerpt not found (id: ${equivalentMediaExcerptIds[0]})`
            );
          }
          return { mediaExcerpt, isExtant: true };
        }

        const mediaExcerpt = await this.createMediaExcerpt(
          client,
          createMediaExcerpt,
          creatorUserId,
          created
        );

        // Creating the UrlLocators and Citations in the serializable transaction will conflict
        // with having read them in the readEquivalentMediaExcerpts query above.

        const urlLocators = await Promise.all(
          createUrlLocators.map((createUrlLocator) =>
            this.createUrlLocator({
              client,
              creatorUserId,
              mediaExcerpt,
              createUrlLocator,
              created,
            })
          )
        );

        const citations = await Promise.all(
          createCitations.map((createCitation) =>
            this.createMediaExcerptCitation({
              client,
              creatorUserId,
              mediaExcerpt,
              createCitation,
              created,
            })
          )
        );

        return {
          mediaExcerpt: merge({}, mediaExcerpt, {
            locators: {
              urlLocators,
            },
            citations,
          }),
          isExtant: false,
        };
      }
    );
  }

  private async createMediaExcerpt(
    client: TxnClient,
    createMediaExcerpt: CreateMediaExcerptDataIn,
    creatorUserId: EntityId,
    created: Moment
  ) {
    const normalQuotation = normalizeQuotation(
      createMediaExcerpt.localRep.quotation
    );
    const {
      rows: [row],
    } = await client.query(
      "createMediaExcerpt",
      `
      insert into media_excerpts (quotation, normal_quotation, creator_user_id, created)
      values ($1, $2, $3, $4)
      returning media_excerpt_id`,
      [
        createMediaExcerpt.localRep.quotation,
        normalQuotation,
        creatorUserId,
        created,
      ]
    );

    return brandedParse(
      MediaExcerptRef,
      merge({}, createMediaExcerpt, {
        id: row.media_excerpt_id,
        localRep: {
          normalQuotation,
        },
        creatorUserId,
        created,
      })
    );
  }

  async readOrCreateUrlLocator(
    mediaExcerpt: MediaExcerptRef,
    createUrlLocator: PartialPersist<CreateUrlLocator, "url">,
    creatorUserId: EntityId,
    created: Moment
  ): Promise<{ urlLocator: UrlLocatorOut; isExtant: boolean }> {
    return await this.database.transaction(
      "readOrCreateUrlLocator",
      "serializable",
      "read write",
      async (client) => {
        const equivalentUrlLocator = await this.readEquivalentUrlLocator({
          client,
          mediaExcerpt,
          createUrlLocator,
        });
        if (equivalentUrlLocator) {
          return { urlLocator: equivalentUrlLocator, isExtant: true };
        }

        const urlLocator = await this.createUrlLocator({
          client,
          creatorUserId,
          mediaExcerpt,
          createUrlLocator,
          created,
        });
        return { urlLocator, isExtant: false };
      }
    );
  }

  async readEquivalentUrlLocator({
    client = this.database,
    mediaExcerpt,
    createUrlLocator,
  }: {
    client?: TxnClient;
    mediaExcerpt: MediaExcerptRef;
    createUrlLocator: PartialPersist<CreateUrlLocator, "url">;
  }): Promise<UrlLocatorOut | undefined> {
    const anchorLength = createUrlLocator.anchors?.length ?? 0;
    const selects: string[] = [];
    const joins: string[] = [];
    const wheres: string[] = [];
    const args: any[] = [mediaExcerpt.id, createUrlLocator.url.id];
    let argIndex = 3;
    createUrlLocator.anchors?.forEach((a, i) => {
      selects.push(`
        da${i}.created as da${i}_created,
        da${i}.creator_user_id as da${i}_creator_user_id`);
      joins.push(`join dom_anchors da${i} using (url_locator_id)`);
      wheres.push(`
            da${i}.exact_text = $${argIndex++}
        and da${i}.prefix_text = $${argIndex++}
        and da${i}.suffix_text = $${argIndex++}
        and da${i}.start_offset = $${argIndex++}
        and da${i}.end_offset = $${argIndex++}
        and da${i}.deleted is null`);
      args.splice(
        args.length,
        0,
        a.exactText,
        a.prefixText,
        a.suffixText,
        a.startOffset,
        a.endOffset
      );
    });
    args.push(anchorLength);

    const {
      rows: [row],
    } = await client.query(
      "readEquivalentUrlLocator",
      `
      select * from (
        select
            ul.url_locator_id
          , ul.created
          , ul.creator_user_id
          , (
            select count(*)
            from dom_anchors
            where
                  url_locator_id = ul.url_locator_id
              and deleted is null
          ) as anchor_count
          ${selects.map((s) => `, ${s}`).join(" ")}
        from url_locators ul
          join urls u using (url_id)
          ${joins.join(" ")}
        where
              ul.media_excerpt_id = $1
          and ul.url_id = $2
          and ul.deleted is null
          and u.deleted is null
          ${wheres.length ? `and (${wheres.join(" and ")})` : ""}
      ) as url_locator_anchors
      where anchor_count = $${argIndex}
      `,
      args
    );
    if (!row) {
      return undefined;
    }

    const urlLocatorId = row.url_locator_id;
    const anchors: Partial<DomAnchor>[] = new Array(anchorLength)
      .fill(undefined)
      .map(() => ({ urlLocatorId }));
    Object.entries(row).map(([k, v]) => {
      const createdMatch = k.match(/^da(\d+)_created$/);
      if (createdMatch) {
        const i = createdMatch[1];
        if (!i) {
          throw newImpossibleError("Regex can't match and also have no group.");
        }
        anchors[parseInt(i)].created = v;
      }

      const creatorMatch = k.match(/^da(\d+)_creator_user_id$/);
      if (creatorMatch) {
        const i = creatorMatch[1];
        if (!i) {
          throw newImpossibleError("Regex can't match and also have no group.");
        }
        anchors[parseInt(i)].creatorUserId = v;
      }
    });
    return brandedParse(
      UrlLocatorRef,
      merge({}, createUrlLocator, {
        id: row.url_locator_id,
        created: row.created,
        creatorUserId: row.creator_user_id,
        anchors,
      })
    );
  }

  async createUrlLocator({
    client = this.database,
    creatorUserId,
    mediaExcerpt,
    createUrlLocator,
    created,
  }: {
    client?: TxnClient;
    creatorUserId: EntityId;
    mediaExcerpt: MediaExcerptRef;
    createUrlLocator: CreateUrlLocator;
    created: Moment;
  }) {
    const {
      rows: [row],
    } = await client.query(
      "createUrlLocator",
      `
      insert into url_locators (media_excerpt_id, url_id, creator_user_id, created)
      values ($1, $2, $3, $4)
      returning url_locator_id
      `,
      [mediaExcerpt.id, createUrlLocator.url.id, creatorUserId, created]
    );
    const id = row.url_locator_id;
    const anchors = createUrlLocator.anchors
      ? await this.createDomAnchors({
          client,
          creatorUserId,
          urlLocatorId: id,
          createDomAnchors: createUrlLocator.anchors,
          created,
        })
      : [];
    return brandedParse(UrlLocatorRef, {
      ...createUrlLocator,
      id,
      anchors,
      created,
      creatorUserId,
    });
  }

  private async createDomAnchors({
    client,
    creatorUserId,
    urlLocatorId,
    createDomAnchors,
    created,
  }: {
    client?: TxnClient;
    creatorUserId: EntityId;
    urlLocatorId: EntityId;
    createDomAnchors: CreateDomAnchor[];
    created: Moment;
  }) {
    return await Promise.all(
      createDomAnchors.map((createDomAnchor) =>
        this.createDomAnchor({
          client,
          creatorUserId,
          urlLocatorId,
          createDomAnchor,
          created,
        })
      )
    );
  }

  private async createDomAnchor({
    client = this.database,
    creatorUserId,
    urlLocatorId,
    createDomAnchor,
    created,
  }: {
    client?: TxnClient;
    creatorUserId: EntityId;
    urlLocatorId: EntityId;
    createDomAnchor: CreateDomAnchor;
    created: Moment;
  }) {
    await client.query(
      "createDomAnchor",
      `insert into dom_anchors (
        url_locator_id,
        exact_text,
        prefix_text,
        suffix_text,
        start_offset,
        end_offset,
        creator_user_id,
        created
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        urlLocatorId,
        createDomAnchor.exactText,
        createDomAnchor.prefixText,
        createDomAnchor.suffixText,
        createDomAnchor.startOffset,
        createDomAnchor.endOffset,
        creatorUserId,
        created,
      ]
    );

    return merge({}, createDomAnchor, { urlLocatorId, created, creatorUserId });
  }

  async readOrCreateMediaExcerptCitation(
    mediaExcerpt: MediaExcerptRef,
    createCitation: PartialPersist<CreateMediaExcerptCitation, "source">,
    creatorUserId: EntityId,
    created: Moment
  ): Promise<{ citation: MediaExcerptCitationOut; isExtant: boolean }> {
    return this.database.transaction(
      "readOrCreateMediaExcerptCitation",
      "serializable",
      "read write",
      async (client) => {
        const extantCitation = await this.readEquivalentMediaExcerptCitation({
          client,
          mediaExcerpt,
          createCitation,
        });
        if (extantCitation) {
          return {
            citation: extantCitation,
            isExtant: true,
          };
        }
        const citation = await this.createMediaExcerptCitation({
          client,
          creatorUserId,
          mediaExcerpt,
          createCitation,
          created,
        });
        return { citation, isExtant: false };
      }
    );
  }

  private async readEquivalentMediaExcerptCitation({
    client = this.database,
    mediaExcerpt,
    createCitation,
  }: {
    client: TxnClient;
    mediaExcerpt: MediaExcerptRef;
    createCitation: PartialPersist<CreateMediaExcerptCitation, "source">;
  }): Promise<MediaExcerptCitationOut | undefined> {
    const normalPincite =
      createCitation.pincite && normalizeText(createCitation.pincite);
    const args = normalPincite
      ? [mediaExcerpt.id, createCitation.source.id, normalPincite]
      : [mediaExcerpt.id, createCitation.source.id];
    const { rows } = await client.query(
      "readEquivalentMediaExcerptCitation",
      `select * from media_excerpt_citations
      where media_excerpt_id = $1 and source_id = $2 and normal_pincite ${
        normalPincite ? "= $3" : "IS NULL"
      } and deleted is null`,
      args
    );

    if (rows.length > 1) {
      this.logger.error("readEquivalentMediaExcerptCitation: multiple rows", {
        mediaExcerptId: mediaExcerpt.id,
        sourceId: createCitation.source.id,
        normalPincite,
        rows,
      });
    }
    if (rows.length < 1) {
      return undefined;
    }

    const row = rows[0];
    return {
      mediaExcerptId: mediaExcerpt.id,
      // TODO(452) I think this should come branded.
      source: brandedParse(SourceRef, createCitation.source),
      pincite: row.pincite,
      normalPincite,
      created: row.created,
      creatorUserId: row.creator_user_id,
    };
  }

  private async createMediaExcerptCitation({
    client = this.database,
    creatorUserId,
    mediaExcerpt,
    createCitation,
    created,
  }: {
    client?: TxnClient;
    creatorUserId: EntityId;
    mediaExcerpt: MediaExcerptRef;
    createCitation: PartialPersist<CreateMediaExcerptCitation, "source">;
    created: Moment;
  }): Promise<MediaExcerptCitationOut> {
    const pincite = createCitation.pincite;
    const normalPincite = pincite && normalizeText(pincite);
    await client.query(
      "createMediaExcerptCitation",
      `insert into media_excerpt_citations (
        media_excerpt_id,
        source_id,
        pincite,
        normal_pincite,
        creator_user_id,
        created
      ) values ($1, $2, $3, $4, $5, $6)`,
      [
        mediaExcerpt.id,
        createCitation.source.id,
        createCitation.pincite,
        normalPincite,
        creatorUserId,
        created,
      ]
    );
    return merge({}, createCitation, {
      mediaExcerptId: mediaExcerpt.id,
      // TODO(452) I think this should come branded.
      source: brandedParse(SourceRef, createCitation.source),
      created,
      creatorUserId,
      pincite,
      normalPincite,
    });
  }

  async hasEquivalentMediaExcerptSpeaker(
    mediaExcerpt: MediaExcerpt,
    persorg: PersorgOut
  ) {
    const {
      rows: [row],
    } = await this.database.query(
      "hasEquivalentMediaExcerptSpeaker",
      `select * from media_excerpt_speakers
      where media_excerpt_id = $1 and speaker_persorg_id = $2 and deleted is null`,
      [mediaExcerpt.id, persorg.id]
    );
    return !!row;
  }

  async createMediaExcerptSpeaker(
    userId: string,
    mediaExcerpt: MediaExcerpt,
    speaker: PersorgOut,
    created: Moment
  ) {
    return await this.database.query(
      "createMediaExcerptSpeaker",
      `insert into media_excerpt_speakers (
        media_excerpt_id,
        speaker_persorg_id,
        creator_user_id,
        created
      ) values ($1, $2, $3, $4)`,
      [mediaExcerpt.id, speaker.id, userId, created]
    );
  }

  async readMediaExcerpts(
    filters: MediaExcerptSearchFilter | undefined,
    sorts: SortDescription[],
    count: number
  ) {
    const args: any[] = [count];
    const limitSql = `limit $${args.length}`;

    const whereSqls = ["deleted is null"];
    const orderBySqls: string[] = [];
    forEach(sorts, (sort) => {
      const columnName =
        sort.property === "id" ? "media_excerpt_id" : snakeCase(sort.property);
      const direction = toDbDirection(sort.direction);
      whereSqls.push(`${columnName} is not null`);
      orderBySqls.push(`${columnName} ${direction}`);
    });

    const filterSubselects = makeFilterSubselects(filters);
    filterSubselects.forEach(({ sql, args: subselectArgs }) => {
      const renumberedSql = renumberSqlArgs(sql, args.length);
      whereSqls.push(`media_excerpt_id in (${renumberedSql})`);
      args.push(...subselectArgs);
    });

    const whereSql = whereSqls.join("\nand ");
    const orderBySql =
      orderBySqls.length > 0 ? "order by " + orderBySqls.join(",") : "";

    const sql = `
      select media_excerpt_id
      from media_excerpts
        where
          ${whereSql}
      ${orderBySql}
      ${limitSql}
      `;
    const { rows } = await this.database.query("readMediaExcerpts", sql, args);
    const mediaExcerpts = await Promise.all(
      rows.map((row) => this.readMediaExcerptForId(row.media_excerpt_id))
    );
    return mediaExcerpts.filter(isDefined);
  }

  async readMoreMediaExcerpts(
    filters: MediaExcerptSearchFilter | undefined,
    sorts: SortDescription[],
    count: number
  ) {
    const args: any[] = [count];
    const countSql = `\nlimit $${args.length}`;

    const whereSqls = ["deleted is null"];
    const continuationWhereSqls: string[] = [];
    const prevWhereSqls: string[] = [];
    const orderBySqls: string[] = [];
    forEach(sorts, (sort) => {
      const value = sort.value;
      if (!value) {
        this.logger.error(
          `readMoreMediaExcerpts sort description missing value.`
        );
        throw new InvalidRequestError("Invalid continuation.");
      }
      const direction = toDbDirection(sort.direction);
      const columnName =
        sort.property === "id" ? "media_excerpt_id" : snakeCase(sort.property);
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

    const filterSubselects = makeFilterSubselects(filters);
    const filterWhereSqls: string[] = [];
    filterSubselects.forEach(({ sql, args: subselectArgs }) => {
      const renumberedSql = renumberSqlArgs(sql, args.length);
      filterWhereSqls.push(`media_excerpt_id in (${renumberedSql})`);
      args.push(...subselectArgs);
    });

    const whereSql = whereSqls.join("\nand ");
    const continuationWhereSql = continuationWhereSqls.join("\n or ");
    const filterWhereSql = filterWhereSqls.join("\nand ");
    const orderBySql =
      orderBySqls.length > 0 ? "order by " + orderBySqls.join(",") : "";

    const sql = `
      select
          media_excerpt_id
      from media_excerpts
        where
          ${whereSql}
        and (
          ${continuationWhereSql}
        ) and (
          ${filterWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `;
    const { rows } = await this.database.query(
      "readMoreMediaExcerpts",
      sql,
      args
    );
    const mediaExcerpts = await Promise.all(
      rows.map((row) => this.readMediaExcerptForId(row.media_excerpt_id))
    );
    return mediaExcerpts.filter(isDefined);
  }

  /**
   * Returns MediaExcerpts having URLs matching url.
   *
   * Matching means that the two are equal after removing the query parameters and fragment and
   * ignoring the trailing slash. Both the `url` and `canonical_url` are considered.
   */
  async readMediaExcerptsMatchingUrl(url: string) {
    url = removeQueryParamsAndFragment(url);
    url = url.endsWith("/") ? url.slice(0, -1) : url;
    const { rows } = await this.database.query(
      "readMediaExcerptsMatchingUrl",
      `
        select
          distinct media_excerpt_id
        from
          media_excerpts me
          join url_locators ul using (media_excerpt_id)
          join urls u using (url_id),
          trim(trailing '/' from substring(u.url from '([^?#]*)')) origin_and_path,
          trim(trailing '/' from substring(u.url from '([^?#]*)')) canonical_origin_and_path
        where
              me.deleted is null
          and ul.deleted is null
          and u.deleted is null
          and (origin_and_path = $1 or canonical_origin_and_path = $1)
      `,
      [url]
    );
    const mediaExcerpts = await Promise.all(
      rows.map((row) => this.readMediaExcerptForId(row.media_excerpt_id))
    );
    return mediaExcerpts.filter(isDefined);
  }

  async readMediaExcerptsMatchingDomain(domain: string) {
    const { rows } = await this.database.query(
      "readMediaExcerptsHavingDomain",
      `
      select
        distinct media_excerpt_id
      from
        media_excerpts me
        join url_locators ul using (media_excerpt_id)
        join urls u using (url_id),
        substring(u.url from '(?:.*://)?([^/?]*)') domain
      where
            me.deleted is null
        and ul.deleted is null
        and u.deleted is null
        and (domain = $1 or domain ilike '%.' || $1)
    `,
      [domain]
    );
    const mediaExcerpts = await Promise.all(
      rows.map((row) => this.readMediaExcerptForId(row.media_excerpt_id))
    );
    return mediaExcerpts.filter(isDefined);
  }
}

function makeFilterSubselects(filters: MediaExcerptSearchFilter | undefined) {
  const filterSubselects: SqlClause[] = [];
  if (!filters) {
    return filterSubselects;
  }
  let filterName: keyof MediaExcerptSearchFilter;
  for (filterName in filters) {
    const value = filters[filterName];
    switch (filterName) {
      case "creatorUserId": {
        const sql = `
          select media_excerpt_id
          from media_excerpts
          where creator_user_id = $1
        `;
        const args = [value];
        filterSubselects.push({ sql, args });
        break;
      }
      case "speakerPersorgId": {
        const sql = `
          select media_excerpt_id
          from media_excerpts join media_excerpt_speakers using (media_excerpt_id)
          where speaker_persorg_id = $1
        `;
        const args = [value];
        filterSubselects.push({ sql, args });
        break;
      }
      case "sourceId": {
        const sql = `
          select media_excerpt_id
          from media_excerpts join media_excerpt_citations using (media_excerpt_id)
          where source_id = $1
        `;
        const args = [value];
        filterSubselects.push({ sql, args });
        break;
      }
    }
  }
  return filterSubselects;
}
