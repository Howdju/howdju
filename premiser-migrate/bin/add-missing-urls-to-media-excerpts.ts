import { Moment } from "moment";

import { EntityId, normalizeUrl, UrlOut, UserBlurb } from "howdju-common";
import { ServicesProvider } from "howdju-service-common";

import { MigrateProvider } from "./init/MigrateProvider";

const provider = new MigrateProvider() as ServicesProvider;

addMissingAllUrls()
  .finally(() => provider.pool.end())
  .catch((err) => {
    provider.logger.error({ err });
    process.exit(1);
  });

async function addMissingAllUrls() {
  const { rows } = await provider.database.query(
    "readMissingUrlsForMediaExcerpts",
    `
    select
        media_excerpt_id
      , wq.created as writ_quote_created
      , wq.creator_user_id as writ_quote_creator_user_id
      -- , wqu.url_id
      --   me.quotation
      , u.url
      , u.url_id
    from
      media_excerpts me
        join writ_quote_translations using (media_excerpt_id)
        join writ_quotes wq using (writ_quote_id)
        join writ_quote_urls wqu using (writ_quote_id)
        join urls u using (url_id)
      where
        wqu.url_id not in (
          select url_id from url_locators where media_excerpt_id = me.media_excerpt_id
        )
    `
  );
  for (const {
    media_excerpt_id,
    writ_quote_created,
    writ_quote_creator_user_id,
    url,
    url_id,
  } of rows) {
    await addMissingUrl(
      media_excerpt_id,
      url,
      url_id,
      writ_quote_creator_user_id,
      writ_quote_created
    );
  }
  provider.logger.info(`Done adding all missing URLs.`);
  process.exit(0);
}

async function addMissingUrl(
  mediaExcerptId: EntityId,
  url: string,
  urlId: EntityId,
  creatorUserId: EntityId,
  created: Moment
) {
  await provider.database.transaction(
    "addMissingUrlsToMediaExcerpt",
    "serializable",
    "read write",
    async (client) => {
      const provider = new MigrateProvider(client) as ServicesProvider;

      // Overwrite service/dao database with txn client so that they participate in the transaction.

      // @ts-ignore commit crimes against code by creating a fake transaction method that just
      // reuses the current transaction.
      client.transaction = (_name, _isolationLevel, _mode, fn) => fn(client);

      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.mediaExcerptsDao.database = client;

      const normalUrl = normalizeUrl(url);
      if (url !== normalUrl) {
        const extantUrl = await provider.urlsDao.readUrlForUrl(normalUrl);
        if (extantUrl) {
          urlId = extantUrl.id;
        } else {
          const newUrl = await provider.urlsDao.createUrl(
            { url: normalUrl },
            creatorUserId,
            created
          );
          urlId = newUrl.id;
        }
      }

      const {
        rows: [row],
      } = await client.query(
        "readExistingUrlLocator",
        `select url_locator_id from url_locators where media_excerpt_id = $1 and url_id = $2`,
        [mediaExcerptId, urlId]
      );
      if (row) {
        provider.logger.info(
          `Skipping adding URL ${url} to media excerpt ${mediaExcerptId} because it already exists.`
        );
        return;
      }

      await provider.mediaExcerptsDao.createUrlLocator({
        client,
        creator: { id: creatorUserId } as UserBlurb,
        mediaExcerptId,
        createUrlLocator: { url: { id: urlId } as UrlOut, anchors: [] },
        created,
      });
    }
  );
}
