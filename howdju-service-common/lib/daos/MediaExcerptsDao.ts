import { merge } from "lodash";
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
  PartialPersist,
  PersorgOut,
  UrlLocatorOut,
  UrlLocatorRef,
} from "howdju-common";

import { Database } from "../database";
import { PersorgsDao } from "./PersorgsDao";
import { SourcesDao } from "./SourcesDao";
import { UrlsDao } from "./UrlsDao";

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
    // Read localRep, locators, and citations
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

  // TODO(20) improve equivalence calculation and support MediaExcerpt suggestions
  //
  // Technically an equivalent media excerpt has redundant localRep, locators, and
  // citations. And the same localRep could technically be used in multiple media excerpts if
  // the same literal quote was used in different contexts to mean different things.
  // So: 1) return an equivalent MediaExcerpt if the create model
  // is redundant with existing localRep, locators, and citations, and 2) if a user is creating
  // a MediaExcerpt with (a) redundant or (b) significantly overlapping localRep, suggest
  // MediaExcerpts with the redundant localRep (those that are non-equivalent according to both
  // locators and citations.) (Overlapping start/end offsets and x % of overlapping exact text?)
  async readEquivalentMediaExcerpt(
    mediaExcerpt: CreateMediaExcerptDataIn
  ): Promise<MediaExcerptOut | undefined> {
    const {
      rows: [row],
    } = await this.database.query(
      "readEquivalentMediaExcerpt",
      `select media_excerpt_id from media_excerpts where normal_quotation = $1 and deleted is null`,
      [normalizeText(mediaExcerpt.localRep.quotation)]
    );
    if (!row) {
      return undefined;
    }
    return await this.readMediaExcerptForId(row.media_excerpt_id);
  }

  async createMediaExcerpt<T extends CreateMediaExcerptDataIn>(
    mediaExcerpt: T,
    creatorUserId: EntityId,
    created: Moment
  ) {
    const normalQuotation = normalizeText(mediaExcerpt.localRep.quotation);
    const {
      rows: [row],
    } = await this.database.query(
      "createMediaExcerpt",
      `insert into media_excerpts (quotation, normal_quotation, creator_user_id, created)
       values ($1, $2, $3, $4)
       returning media_excerpt_id`,
      [mediaExcerpt.localRep.quotation, normalQuotation, creatorUserId, created]
    );
    return brandedParse(
      MediaExcerptRef,
      merge({}, mediaExcerpt, {
        id: row.media_excerpt_id,
        localRep: {
          normalQuotation,
        },
        creatorUserId,
        created,
      })
    );
  }

  async readEquivalentUrlLocator(
    mediaExcerpt: MediaExcerptRef,
    createUrlLocator: PartialPersist<CreateUrlLocator, "url">
  ): Promise<UrlLocatorOut | undefined> {
    if (!createUrlLocator.anchors) {
      return undefined;
    }

    const selects: string[] = [];
    const joins: string[] = [];
    const wheres: string[] = [];
    const args: any[] = [mediaExcerpt.id, createUrlLocator.url.id];
    let argIndex = 3;
    createUrlLocator.anchors.forEach((a, i) => {
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
    args.push(createUrlLocator.anchors.length);

    const {
      rows: [row],
    } = await this.database.query(
      "readEquivalentUrlLocator",
      `
      select * from (
        select
          url_locators.url_locator_id,
          url_locators.created,
          url_locators.creator_user_id,
          count(*) over (partition by url_locator_id) as anchor_count,
          ${selects.join(", ")}
        from url_locators
          join urls using (url_id)
          -- This join allows us to accurately count the anchors
          join dom_anchors using (url_locator_id)
          ${joins.join(" ")}
        where
              url_locators.media_excerpt_id = $1
          and url_locators.url_id = $2
          and url_locators.deleted is null
          and urls.deleted is null
          and (${wheres.join(" and ")})
      ) as url_locator_anchors
      where anchor_count = $${argIndex}
      `,
      args
    );
    if (!row) {
      return undefined;
    }

    const urlLocatorId = row.url_locator_id;
    const anchors: Partial<DomAnchor>[] = new Array(
      createUrlLocator.anchors.length
    )
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

  async createUrlLocator(
    creatorUserId: EntityId,
    mediaExcerpt: MediaExcerptRef,
    urlLocator: CreateUrlLocator,
    created: Moment
  ) {
    const {
      rows: [row],
    } = await this.database.query(
      "createUrlLocator",
      `
      insert into url_locators (media_excerpt_id, url_id, creator_user_id, created)
      values ($1, $2, $3, $4)
      returning url_locator_id
      `,
      [mediaExcerpt.id, urlLocator.url.id, creatorUserId, created]
    );
    const id = row.url_locator_id;
    const anchors = urlLocator.anchors
      ? await this.createDomAnchors(
          creatorUserId,
          id,
          urlLocator.anchors,
          created
        )
      : [];
    return { ...urlLocator, id, anchors, created, creatorUserId };
  }

  private async createDomAnchors(
    creatorUserId: EntityId,
    urlLocatorId: EntityId,
    createDomAnchors: CreateDomAnchor[],
    created: Moment
  ) {
    return await Promise.all(
      createDomAnchors.map((da) =>
        this.createDomAnchor(creatorUserId, urlLocatorId, da, created)
      )
    );
  }
  private async createDomAnchor(
    creatorUserId: EntityId,
    urlLocatorId: EntityId,
    createDomAnchor: CreateDomAnchor,
    created: Moment
  ) {
    await this.database.query(
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

  async readEquivalentMediaExcerptCitation(
    mediaExcerpt: MediaExcerptOut,
    createCitation: PartialPersist<CreateMediaExcerptCitation, "source">
  ) {
    const normalPincite =
      createCitation.pincite && normalizeText(createCitation.pincite);
    const args = normalPincite
      ? [mediaExcerpt.id, createCitation.source.id, normalPincite]
      : [mediaExcerpt.id, createCitation.source.id];
    const { rows } = await this.database.query(
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
      source: createCitation.source,
      pincite: row.pincite,
      normalPincite,
      created: row.created,
      creatorUserId: row.creator_user_id,
    };
  }

  async createMediaExcerptCitation(
    creatorUserId: EntityId,
    mediaExcerpt: MediaExcerpt,
    createCitation: PartialPersist<CreateMediaExcerptCitation, "source">,
    created: Moment
  ) {
    const normalPincite =
      createCitation.pincite && normalizeText(createCitation.pincite);
    await this.database.query(
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
      created,
      creatorUserId,
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
}
