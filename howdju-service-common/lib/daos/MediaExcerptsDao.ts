import { concat, forEach, groupBy, keyBy, merge, snakeCase } from "lodash";
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
  MediaExcerptSearchFilter,
  UrlOut,
  SourceOut,
  removeQueryParamsAndFragment,
  MediaExcerptCitationOut,
  DeleteMediaExcerptCitation,
  toJson,
  UserBlurb,
  mergeCopy,
  MediaExcerptSpeakerOut,
} from "howdju-common";

import { Database, TxnClient } from "../database";
import { PersorgsDao } from "./PersorgsDao";
import { SourcesDao } from "./SourcesDao";
import { UrlsDao } from "./UrlsDao";
import { toDbDirection } from "./daoModels";
import { EntityNotFoundError, InvalidRequestError, UsersDao } from "..";
import { SqlClause } from "./daoTypes";
import { renumberSqlArgs, toIdString } from "./daosUtil";
import { UrlLocatorAutoConfirmationDao } from "./UrlLocatorAutoConfirmationDao";

export type CreateMediaExcerptDataIn = Pick<
  PartialPersist<CreateMediaExcerpt, "localRep">,
  "localRep"
>;

export class MediaExcerptsDao {
  constructor(
    private readonly logger: Logger,
    private readonly database: Database,
    private readonly urlsDao: UrlsDao,
    private readonly sourcesDao: SourcesDao,
    private readonly persorgsDao: PersorgsDao,
    private readonly usersDao: UsersDao,
    private readonly urlLocatorAutoConfirmationDao: UrlLocatorAutoConfirmationDao
  ) {}

  async readMediaExcerptsForIds(
    mediaExcerptIds: EntityId[]
  ): Promise<MediaExcerptOut[]> {
    const justMediaExcerpts = await this.readJustMediaExcerptsForIds(
      mediaExcerptIds
    );

    const creatorUserIds = justMediaExcerpts.reduce((acc, a) => {
      acc.add(a.creatorUserId);
      return acc;
    }, new Set<EntityId>());

    const [urlLocators, citations, speakers, creators] = await Promise.all([
      this.readUrlLocators({ mediaExcerptIds }),
      this.readCitationsForMediaExcerptIds(mediaExcerptIds),
      this.readSpeakersForMediaExcerptIds(mediaExcerptIds),
      this.usersDao.readUserBlurbsForIds(Array.from(creatorUserIds)),
    ]);
    const urlLocatorsByMediaExcerptId = groupBy(urlLocators, "mediaExcerptId");
    const citationsByMediaExcerptId = groupBy(citations, "mediaExcerptId");
    const speakersByMediaExcerptId = groupBy(speakers, "mediaExcerptId");
    const creatorsById = keyBy(creators, "id");

    return justMediaExcerpts.map((me) =>
      brandedParse(MediaExcerptRef, {
        ...me,
        locators: {
          urlLocators: urlLocatorsByMediaExcerptId[me.id] || [],
        },
        citations: citationsByMediaExcerptId[me.id] || [],
        speakers: speakersByMediaExcerptId[me.id] || [],
        creator: creatorsById[me.creatorUserId],
      })
    );
  }

  async readMediaExcerptForId(
    mediaExcerptId: EntityId
  ): Promise<MediaExcerptOut> {
    const [mediaExcerpt] = await this.readMediaExcerptsForIds([mediaExcerptId]);
    return mediaExcerpt;
  }

  async readJustMediaExcerptForId(mediaExcerptId: EntityId) {
    const [mediaExcerpt] = await this.readJustMediaExcerptsForIds([
      mediaExcerptId,
    ]);
    return mediaExcerpt;
  }

  async readJustMediaExcerptsForIds(
    mediaExcerptIds: EntityId[]
  ): Promise<
    Pick<MediaExcerptOut, "id" | "localRep" | "created" | "creatorUserId">[]
  > {
    const { rows } = await this.database.query(
      "readJustMediaExcerptsForIds",
      `
      select *
      from media_excerpts
      where
          media_excerpt_id = any($1)
        and deleted is null
      order by array_position($1, media_excerpt_id)
      `,
      [mediaExcerptIds]
    );
    return rows.map((row) => ({
      id: row.media_excerpt_id,
      localRep: {
        quotation: row.quotation,
        normalQuotation: row.normal_quotation,
      },
      created: row.created,
      creatorUserId: row.creator_user_id,
    }));
  }

  private async readSpeakersForMediaExcerptIds(
    mediaExcerptIds: EntityId[]
  ): Promise<MediaExcerptSpeakerOut[]> {
    const { rows } = await this.database.query(
      "readSpeakersForMediaExcerptIds",
      `
      select mes.*
      from
        media_excerpt_speakers mes
        join persorgs p on mes.speaker_persorg_id = p.persorg_id
      where
        media_excerpt_id = any($1)
        and mes.deleted is null
        and p.deleted is null
        `,
      [mediaExcerptIds]
    );
    const relatedIds = rows.reduce(
      (acc, row) => {
        acc.speakerPersorgIds.add(row.speaker_persorg_id);
        acc.creatorUserIds.add(row.creator_user_id);
        return acc;
      },
      {
        speakerPersorgIds: new Set<EntityId>(),
        creatorUserIds: new Set<EntityId>(),
      }
    );

    const [speakerPersorgs, creatorUsers] = await Promise.all([
      this.persorgsDao.readPersorgsForIds(
        Array.from(relatedIds.speakerPersorgIds)
      ),
      this.usersDao.readUserBlurbsForIds(Array.from(relatedIds.creatorUserIds)),
    ]);
    const speakerPersorgsById = keyBy(speakerPersorgs, "id");
    const creatorUsersById = keyBy(creatorUsers, "id");
    return rows.map((row) => ({
      mediaExcerptId: row.media_excerpt_id,
      persorg: speakerPersorgsById[row.speaker_persorg_id],
      created: row.created,
      creatorUserId: row.creator_user_id,
      creator: creatorUsersById[row.creator_user_id],
    }));
  }

  private async readCitationsForMediaExcerptIds(mediaExcerptIds: EntityId[]) {
    const { rows } = await this.database.query(
      "readCitationsForMediaExcerptIds",
      `
      select mec.*
      from
             media_excerpt_citations mec
        join sources s using (source_id)
      where
            mec.media_excerpt_id = any($1)
        and mec.deleted is null
        and s.deleted is null
      order by
          media_excerpt_id asc
        , source_id asc
        , normal_pincite asc`,
      [mediaExcerptIds]
    );
    return await Promise.all(
      rows.map(async (row) => {
        const source = await this.sourcesDao.readSourceForId(row.source_id);
        if (!source) {
          throw new EntityNotFoundError("SOURCE", row.source_id);
        }
        return {
          mediaExcerptId: row.media_excerpt_id,
          pincite: row.pincite,
          normalPincite: row.normal_pincite,
          source,
          created: row.created,
          creatorUserId: row.creator_user_id,
        };
      })
    );
  }

  private async readUrlLocators(
    filter: { mediaExcerptIds: EntityId[] } | { urlLocatorIds: EntityId[] }
  ): Promise<UrlLocatorOut[]> {
    const whereColumn =
      "mediaExcerptIds" in filter ? "media_excerpt_id" : "url_locator_id";
    const args =
      "mediaExcerptIds" in filter
        ? [filter.mediaExcerptIds]
        : [filter.urlLocatorIds];
    const { rows } = await this.database.query(
      "readUrlLocators",
      `
      select
        ul.*
      from url_locators ul
        join urls u using (url_id)
      where ${whereColumn} = any($1)
        and ul.deleted is null
        and u.deleted is null
        `,
      args
    );
    return await Promise.all(
      rows.map(async (row) => {
        const [url, anchors, creator, autoConfirmationStatus] =
          await Promise.all([
            this.urlsDao.readUrlForId(row.url_id),
            this.readDomAnchorsForUrlLocatorId(row.url_locator_id),
            this.usersDao.readUserBlurbForId(row.creator_user_id),
            this.urlLocatorAutoConfirmationDao.readConfirmationStatusForUrlLocatorId(
              row.url_locator_id
            ),
          ]);
        if (!url) {
          throw new EntityNotFoundError("URL", row.url_id);
        }
        return brandedParse(UrlLocatorRef, {
          id: toIdString(row.url_locator_id),
          mediaExcerptId: toIdString(row.media_excerpt_id),
          url,
          textFragmentUrl: row.text_fragment_url,
          anchors,
          autoConfirmationStatus,
          created: row.created,
          creatorUserId: toIdString(row.creator_user_id),
          creator,
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
        left join media_excerpt_speakers mes using (media_excerpt_id)
      where me.normal_quotation = $1
        and me.deleted is null
        and (
            (cardinality($2::bigint[]) != 0 and ul.url_id = any ($2))
          or (cardinality($3::varchar[]) != 0 and u.canonical_url = any ($3))
          or (cardinality($4::bigint[]) != 0 and mec.source_id = any ($4))
        )
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
    mediaExcerpt: Omit<MediaExcerptOut, "speakers">;
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
        const creator = await this.usersDao.readUserBlurbForId(creatorUserId);
        const [urlLocators, citations] = await Promise.all([
          await Promise.all(
            createUrlLocators.map((createUrlLocator) =>
              this.createUrlLocator({
                client,
                creator,
                mediaExcerptId: mediaExcerpt.id,
                createUrlLocator,
                created,
              })
            )
          ),
          await Promise.all(
            createCitations.map((createCitation) =>
              this.createMediaExcerptCitation({
                client,
                creator,
                mediaExcerptId: mediaExcerpt.id,
                createCitation,
                created,
              })
            )
          ),
        ]);

        return {
          mediaExcerpt: merge({}, mediaExcerpt, {
            locators: {
              urlLocators,
            },
            citations,
            creator,
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
    mediaExcerptId: EntityId,
    createUrlLocator: CreateUrlLocator & { url: UrlOut },
    creator: UserBlurb,
    created: Moment
  ): Promise<{ urlLocator: UrlLocatorOut; isExtant: boolean }> {
    return await this.database.transaction(
      "readOrCreateUrlLocator",
      "serializable",
      "read write",
      async (client) => {
        const equivalentUrlLocator = await this.readEquivalentUrlLocator({
          client,
          mediaExcerptId,
          createUrlLocator,
        });
        if (equivalentUrlLocator) {
          return { urlLocator: equivalentUrlLocator, isExtant: true };
        }

        const urlLocator = await this.createUrlLocator({
          client,
          creator,
          mediaExcerptId,
          createUrlLocator,
          created,
        });
        return { urlLocator, isExtant: false };
      }
    );
  }

  async readEquivalentUrlLocator({
    client = this.database,
    mediaExcerptId,
    createUrlLocator,
  }: {
    client?: TxnClient;
    mediaExcerptId: EntityId;
    createUrlLocator: CreateUrlLocator & { url: UrlOut };
  }): Promise<UrlLocatorOut | undefined> {
    const anchorLength = createUrlLocator.anchors?.length ?? 0;
    const selects: string[] = [];
    const joins: string[] = [];
    const wheres: string[] = [];
    const args: any[] = [mediaExcerptId, createUrlLocator.url.id];
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
          , u.url_id
          , u.canonical_url
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

    const urlLocatorId = toIdString(row.url_locator_id);
    const partialAnchors: Partial<
      Pick<DomAnchor, "urlLocatorId" | "created" | "creatorUserId">
    >[] = new Array(anchorLength).fill(undefined).map(() => ({ urlLocatorId }));
    Object.entries(row).map(([k, v]) => {
      const createdMatch = k.match(/^da(\d+)_created$/);
      if (createdMatch) {
        const i = createdMatch[1];
        if (!i) {
          throw newImpossibleError("Regex can't match and also have no group.");
        }
        partialAnchors[parseInt(i)].created = v;
      }

      const creatorMatch = k.match(/^da(\d+)_creator_user_id$/);
      if (creatorMatch) {
        const i = creatorMatch[1];
        if (!i) {
          throw newImpossibleError("Regex can't match and also have no group.");
        }
        partialAnchors[parseInt(i)].creatorUserId = v;
      }
    });
    const anchors = createUrlLocator.anchors
      ? mergeCopy(
          createUrlLocator.anchors,
          partialAnchors as unknown as Pick<
            DomAnchor,
            "urlLocatorId" | "created" | "creatorUserId"
          >[]
        )
      : [];
    const [creator, autoConfirmationStatus] = await Promise.all([
      this.usersDao.readUserBlurbForId(row.creator_user_id),
      this.urlLocatorAutoConfirmationDao.readConfirmationStatusForUrlLocatorId(
        urlLocatorId
      ),
    ]);
    const merged = mergeCopy(createUrlLocator, {
      id: urlLocatorId,
      mediaExcerptId,
      url: {
        id: toIdString(row.url_id),
        canonicalUrl: row.canonical_url,
      },
      anchors,
      autoConfirmationStatus,
      created: row.created,
      creatorUserId: toIdString(row.creator_user_id),
      creator,
    });
    return brandedParse(UrlLocatorRef, merged);
  }

  async createUrlLocator({
    client = this.database,
    creator,
    mediaExcerptId,
    createUrlLocator,
    created,
  }: {
    client?: TxnClient;
    creator: UserBlurb;
    mediaExcerptId: EntityId;
    createUrlLocator: CreateUrlLocator & { url: UrlOut };
    created: Moment;
  }): Promise<UrlLocatorOut> {
    const {
      rows: [row],
    } = await client.query(
      "createUrlLocator",
      `
      insert into url_locators (media_excerpt_id, url_id, creator_user_id, created)
      values ($1, $2, $3, $4)
      returning url_locator_id
      `,
      [mediaExcerptId, createUrlLocator.url.id, creator.id, created]
    );
    const id = row.url_locator_id;
    const anchors = createUrlLocator.anchors
      ? await this.createDomAnchors({
          client,
          creator,
          urlLocatorId: id,
          createDomAnchors: createUrlLocator.anchors,
          created,
        })
      : [];
    return brandedParse(UrlLocatorRef, {
      ...createUrlLocator,
      id,
      mediaExcerptId,
      anchors,
      autoConfirmationStatus: {
        status: "NEVER_TRIED",
      },
      created,
      creatorUserId: creator.id,
      creator,
    });
  }

  private async createDomAnchors({
    client,
    creator,
    urlLocatorId,
    createDomAnchors,
    created,
  }: {
    client?: TxnClient;
    creator: UserBlurb;
    urlLocatorId: EntityId;
    createDomAnchors: CreateDomAnchor[];
    created: Moment;
  }) {
    return await Promise.all(
      createDomAnchors.map((createDomAnchor) =>
        this.createDomAnchor({
          client,
          creator,
          urlLocatorId,
          createDomAnchor,
          created,
        })
      )
    );
  }

  private async createDomAnchor({
    client = this.database,
    creator,
    urlLocatorId,
    createDomAnchor,
    created,
  }: {
    client?: TxnClient;
    creator: UserBlurb;
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
        creator.id,
        created,
      ]
    );

    return merge({}, createDomAnchor, {
      urlLocatorId,
      created,
      creatorUserId: creator.id,
    });
  }

  async readOrCreateMediaExcerptCitation(
    mediaExcerptId: EntityId,
    createCitation: CreateMediaExcerptCitation & { source: SourceOut },
    creator: UserBlurb,
    created: Moment
  ): Promise<{ citation: MediaExcerptCitationOut; isExtant: boolean }> {
    return this.database.transaction(
      "readOrCreateMediaExcerptCitation",
      "serializable",
      "read write",
      async (client) => {
        const extantCitation = await this.readEquivalentMediaExcerptCitation({
          client,
          mediaExcerptId,
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
          creator,
          mediaExcerptId,
          createCitation,
          created,
        });
        return { citation, isExtant: false };
      }
    );
  }

  private async readEquivalentMediaExcerptCitation({
    client = this.database,
    mediaExcerptId,
    createCitation,
  }: {
    client: TxnClient;
    mediaExcerptId: EntityId;
    createCitation: CreateMediaExcerptCitation & { source: SourceOut };
  }): Promise<MediaExcerptCitationOut | undefined> {
    const normalPincite =
      createCitation.pincite && normalizeText(createCitation.pincite);
    const args = normalPincite
      ? [mediaExcerptId, createCitation.source.id, normalPincite]
      : [mediaExcerptId, createCitation.source.id];
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
        mediaExcerptId,
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
      mediaExcerptId,
      source: createCitation.source,
      pincite: row.pincite,
      normalPincite,
      created: row.created,
      creatorUserId: row.creator_user_id,
    };
  }

  private async createMediaExcerptCitation({
    client = this.database,
    creator,
    mediaExcerptId,
    createCitation,
    created,
  }: {
    client?: TxnClient;
    creator: UserBlurb;
    mediaExcerptId: EntityId;
    createCitation: CreateMediaExcerptCitation & { source: SourceOut };
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
        mediaExcerptId,
        createCitation.source.id,
        createCitation.pincite,
        normalPincite,
        creator.id,
        created,
      ]
    );
    return merge({}, createCitation, {
      mediaExcerptId,
      source: createCitation.source,
      created,
      creatorUserId: creator.id,
      pincite,
      normalPincite,
    });
  }

  async readEquivalentMediaExcerptSpeaker(
    mediaExcerptId: EntityId,
    persorg: PersorgOut
  ): Promise<MediaExcerptSpeakerOut | undefined> {
    const {
      rows: [row],
    } = await this.database.query(
      "readEquivalentMediaExcerptSpeaker",
      `select * from media_excerpt_speakers
      where media_excerpt_id = $1 and speaker_persorg_id = $2 and deleted is null`,
      [mediaExcerptId, persorg.id]
    );
    if (!row) {
      return undefined;
    }
    const creator = await this.usersDao.readUserBlurbForId(row.creator_user_id);
    return {
      mediaExcerptId,
      persorg,
      created: row.created,
      creatorUserId: row.creator_user_id,
      creator,
    };
  }

  async createMediaExcerptSpeaker(
    creatorUserId: string,
    mediaExcerptId: EntityId,
    persorg: PersorgOut,
    created: Moment
  ): Promise<MediaExcerptSpeakerOut> {
    await this.database.query(
      "createMediaExcerptSpeaker",
      `insert into media_excerpt_speakers (
        media_excerpt_id,
        speaker_persorg_id,
        creator_user_id,
        created
      ) values ($1, $2, $3, $4)`,
      [mediaExcerptId, persorg.id, creatorUserId, created]
    );
    const creator = await this.usersDao.readUserBlurbForId(creatorUserId);
    return {
      mediaExcerptId,
      persorg,
      created,
      creatorUserId,
      creator,
    };
  }

  async deleteMediaExcerptSpeakersForPersorgId(
    persorgId: EntityId,
    deletedAt: Moment
  ) {
    return await this.database.query(
      "deleteMediaExcerptSpeakersForSourceId",
      `update media_excerpt_speakers
      set deleted = $2
      where speaker_persorg_id = $1 and deleted is null
      `,
      [persorgId, deletedAt]
    );
  }

  async readMediaExcerptIds(
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

    const filterSubselects = this.makeFilterSubselects(filters);
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
    return rows.map((row) => toIdString(row.media_excerpt_id));
  }

  async readMoreMediaExcerptIds(
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

    const filterSubselects = this.makeFilterSubselects(filters);
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
        )
        ${filterWhereSql ? `and (${filterWhereSql})` : ""}
      ${orderBySql}
      ${countSql}
      `;
    const { rows } = await this.database.query(
      "readMoreMediaExcerpts",
      sql,
      args
    );
    return rows.map((row) => toIdString(row.media_excerpt_id));
  }

  async deleteMediaExcerpt(mediaExcerptId: string, deletedAt: Moment) {
    await this.database.query(
      "deleteMediaExcerpt",
      `update media_excerpts
        set deleted = $1
        where media_excerpt_id = $2 and deleted is null`,
      [deletedAt, mediaExcerptId]
    );
  }

  deleteMediaExcerptCitation(
    { mediaExcerptId, source, normalPincite }: DeleteMediaExcerptCitation,
    deletedAt: Moment
  ) {
    const args = [deletedAt, mediaExcerptId, source.id];
    if (normalPincite) {
      args.push(normalPincite);
    }
    return this.database.query(
      "deleteMediaExcerptCitation",
      `
      update media_excerpt_citations
      set deleted = $1
      where
            media_excerpt_id = $2
        and source_id = $3
        and ${normalPincite ? `normal_pincite = $4` : `normal_pincite is null`}
        and deleted is null`,
      args
    );
  }

  async readMediaExcerptIdForUrlLocatorId(urlLocatorId: string) {
    const {
      rows: [row],
    } = await this.database.query(
      "readMediaExcerptIdForUrlLocatorId",
      `select
        media_excerpt_id
        from url_locators
        where url_locator_id = $1 and deleted is null`,
      [urlLocatorId]
    );
    if (!row) {
      return undefined;
    }
    return toIdString(row.media_excerpt_id);
  }

  deleteUrlLocatorForId(urlLocatorId: string, deletedAt: Moment) {
    return this.database.query(
      "deleteUrlLocatorForId",
      `update url_locators
      set deleted = $1
      where url_locator_id = $2 and deleted is null`,
      [deletedAt, urlLocatorId]
    );
  }

  async deleteMediaExcerptCitationsForSourceId(
    sourceId: EntityId,
    deletedAt: Moment
  ) {
    await this.database.query(
      "deleteMediaExcerptCitationsForSourceId",
      `update media_excerpt_citations
      set deleted = $1
      where source_id = $2`,
      [deletedAt, sourceId]
    );
  }

  private makeFilterSubselects(filters: MediaExcerptSearchFilter | undefined) {
    const filterSubselects: SqlClause[] = [];
    if (!filters) {
      return filterSubselects;
    }
    let filterName: keyof MediaExcerptSearchFilter;
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
        case "creatorUserId": {
          const sql = `
          select distinct me.media_excerpt_id
          from
               media_excerpts me
          join users u on me.creator_user_id = u.user_id
          where
              me.creator_user_id = $1
          and me.deleted is null
          and u.deleted is null
        `;
          const args = [value];
          filterSubselects.push({ sql, args });
          break;
        }
        case "speakerPersorgId": {
          const sql = `
          select distinct media_excerpt_id
          from media_excerpts
            join media_excerpt_speakers mes using (media_excerpt_id)
            join persorgs p on mes.speaker_persorg_id = p.persorg_id
          where speaker_persorg_id = $1 and mes.deleted is null and p.deleted is null
        `;
          const args = [value];
          filterSubselects.push({ sql, args });
          break;
        }
        case "sourceId": {
          const sql = `
          select distinct media_excerpt_id
          from media_excerpts
            join media_excerpt_citations mec using (media_excerpt_id)
            join sources s using (source_id)
          where
              mec.source_id = $1
          and mec.deleted is null
          and s.deleted is null
        `;
          const args = [value];
          filterSubselects.push({ sql, args });
          break;
        }
        case "domain": {
          const sql = `
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
      `;
          const args = [value];
          filterSubselects.push({ sql, args });
          break;
        }
        case "url": {
          let url = removeQueryParamsAndFragment(value);
          url = url.endsWith("/") ? url.slice(0, -1) : url;
          const sql = `
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
        `;
          const args = [url];
          filterSubselects.push({ sql, args });
          break;
        }
      }
    }
    return filterSubselects;
  }

  async readUrlLocatorForId(
    urlLocatorId: EntityId
  ): Promise<UrlLocatorOut | undefined> {
    const [urlLocator] = await this.readUrlLocators({
      urlLocatorIds: [urlLocatorId],
    });
    return urlLocator;
  }

  /**
   * Returns Source descriptions co-appearing with url in MediaExcerpts.
   *
   * The descriptions are ordered by the number of times they appear in citations.
   */
  async readPopularSourceDescriptions(url: string, limit?: number) {
    const { rows } = await this.database.query(
      "readPopularSourceDescriptions",
      `
      select
          s.source_id
        , s.description
        , count(*) as citation_count
      from urls u
        join url_locators ul using (url_id)
        join media_excerpts me using (media_excerpt_id)
        join media_excerpt_citations mec using (media_excerpt_id)
        join sources s using (source_id)
      where
            u.url = $1
        and u.deleted is null
        and ul.deleted is null
        and me.deleted is null
        and mec.deleted is null
        and s.deleted is null
      group by s.source_id, s.description
      order by citation_count desc
      ${limit ? `limit ${limit}` : ""}
    `,
      [url]
    );
    return rows.map(({ description }) => description);
  }

  updateTextFragmentUrlForUrlLocatorId(
    urlLocatorId: EntityId,
    textFragmentUrl: string
  ) {
    return this.database.query(
      "updateTextFragmentUrlForUrlLocatorId",
      `update url_locators
      set text_fragment_url = $2
      where url_locator_id = $1 and deleted is null`,
      [urlLocatorId, textFragmentUrl]
    );
  }
}
