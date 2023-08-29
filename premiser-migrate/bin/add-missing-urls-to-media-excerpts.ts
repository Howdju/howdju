import { EntityId, UrlOut } from "howdju-common";
import { ServicesProvider } from "howdju-service-common";

import { MigrateProvider } from "./init/MigrateProvider";

const provider = new MigrateProvider() as ServicesProvider;

addMissingAllUrls()
  .finally(() => provider.pool.end())
  .catch((err) => provider.logger.error({ err }));

async function addMissingAllUrls() {
  const { rows } = await provider.database.query(
    "readWritQuoteTranslations",
    `select * from writ_quote_translations;`
  );
  for (const { writ_quote_id, media_excerpt_id } of rows) {
    await addMissingUrls(writ_quote_id, media_excerpt_id);
  }
  provider.logger.info(`Done adding all missing URLs.`);
  process.exit(0);
}

async function addMissingUrls(writQuoteId: EntityId, mediaExcerptId: EntityId) {
  const [writQuote, mediaExcerpt] = await Promise.all([
    provider.writQuotesService.readWritQuoteForId(writQuoteId),
    provider.mediaExcerptsService.readMediaExcerptForId(mediaExcerptId),
  ]);
  const missingUrls = writQuote.urls.filter(
    (url: UrlOut) =>
      !mediaExcerpt.locators.urlLocators.some((l) => l.url === url)
  );
  const createUrlLocators = missingUrls.map((url: UrlOut) => ({
    url,
    // Anchors are not read by writQuotesService.readWritQuotes, but that's okay because relying
    // on autoconfirmation is better anyways.
  }));
  const creatorUserId = writQuote.creatorUserId;
  const created = writQuote.created;
  await provider.database.transaction(
    "convertWritQuoteToMediaExcerpt",
    "read uncommitted",
    "read write",
    async (client) => {
      const provider = new MigrateProvider() as ServicesProvider;

      // Overwrite service/dao database with txn client so that they participate in the transaction.

      // @ts-ignore commit crimes against code by creating a fake transaction method that just
      // reuses the current transaction.
      client.transaction = (_name, _isolationLevel, _mode, fn) => fn(client);

      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.mediaExcerptsDao.database = client;
      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.urlsDao.database = client;

      await provider.mediaExcerptsService.createUrlLocators(
        { userId: creatorUserId },
        mediaExcerptId,
        createUrlLocators,
        created
      );
    }
  );
}
