import { ArgumentParser } from "argparse";

import {
  CreateMediaExcerpt,
  EntityId,
  JustificationOut,
  utcNow,
  WritQuoteOut,
} from "howdju-common";
import { ServicesProvider, TxnClient } from "howdju-service-common";

import { MigrateProvider } from "./init/MigrateProvider";

const parser = new ArgumentParser({
  description: "Convert WritQuotes to MediaExcerpts",
});
parser.add_argument("--test-one-only", { action: "store_true" });
const args = parser.parse_args();

const provider = new MigrateProvider() as ServicesProvider;

const count = args.test_one_only ? 1 : 1000;

convertAllWritQuotesToMediaExcerpts()
  .finally(() => provider.pool.end())
  .catch((err) => provider.logger.error({ err }));

async function convertAllWritQuotesToMediaExcerpts() {
  // In a transaction, read each writ quote, and create a media excerpt, and delete the writ quote.
  let { writQuotes, continuationToken } =
    await provider.writQuotesService.readWritQuotes({
      sorts: [],
      continuationToken: undefined,
      count,
    });
  while (writQuotes.length > 0) {
    await convertWritQuotesToMediaExcerpts(writQuotes);
    if (args.test_one_only) {
      provider.logger.info(`Ending early because of testOneOnly flag.`);
      break;
    }
    const { writQuotes: nextWritQuotes, continuationToken: nextToken } =
      await provider.writQuotesService.readWritQuotes({
        sorts: [],
        continuationToken,
        count,
      });
    writQuotes = nextWritQuotes;
    continuationToken = nextToken;
  }
  provider.logger.info(`Done converting writ quotes to media excerpts.`);
  process.exit(0);
}

async function convertWritQuotesToMediaExcerpts(writQuotes: WritQuoteOut[]) {
  for (const writQuote of writQuotes) {
    /*
     (We have ~90 writ_quotes with empty quote_text. Rhese break media_excerpts check for
     non-empty quotation, so we can't translate them. We can look at them manually later to see if
     we want to find a quotation for them. If not, we will delete them.
    */
    if (writQuote.quoteText.length === 0) {
      provider.logger.info(
        `Skipping empty quote ${writQuote.id} from writ ${writQuote.writ.id}`
      );
      continue;
    }
    await provider.database.transaction(
      "convertWritQuoteToMediaExcerpt",
      "read uncommitted",
      "read write",
      async (client) => {
        const provider = new MigrateProvider() as ServicesProvider;

        // @ts-ignore commit crimes against code by creating a fake transaction method that just
        // reuses the current transaction.
        client.transaction = (_name, _isolationLevel, _mode, fn) => fn(client);

        // @ts-ignore commit crimes against code by overwriting the database with the txn client
        provider.mediaExcerptsDao.database = client;
        // @ts-ignore commit crimes against code by overwriting the database with the txn client
        provider.sourcesDao.db = client;
        // @ts-ignore commit crimes against code by overwriting the database with the txn client
        provider.persorgsDao.database = client;
        // @ts-ignore commit crimes against code by overwriting the database with the txn client
        provider.urlsDao.database = client;
        // @ts-ignore commit crimes against code by overwriting the database with the txn client
        provider.justificationsDao.database = client;
        // @ts-ignore commit crimes against code by overwriting the database with the txn client
        provider.writQuotesDao.database = client;

        const createMediaExcerpt = toCreateMediaExcerpt(writQuote);
        const userId = writQuote.creatorUserId;
        const { mediaExcerpt } =
          await provider.mediaExcerptsService.readOrCreateMediaExcerpt(
            { userId },
            createMediaExcerpt
          );
        const { justifications } =
          await provider.justificationsService.readJustifications({
            filters: { writQuoteId: writQuote.id },
            sorts: [],
            continuationToken: undefined,
            // Assume no WritQuote is used by more than 1000 justifications.
            count: 1000,
            includeUrls: false,
          });
        provider.logger.info(
          `Created media excerpt ${mediaExcerpt.id} for writ quote ${writQuote.id}`
        );
        await Promise.all([
          updateJustificationsBasis(client, justifications, mediaExcerpt.id),
          writeWritQuoteTranslation(client, writQuote.id, mediaExcerpt.id),
          deleteWritQuoteForId(client, writQuote.id),
        ]);
      }
    );
  }
}

async function deleteWritQuoteForId(client: TxnClient, id: EntityId) {
  await client.query(
    "deleteWritQuoteForId",
    `update writ_quotes set deleted = $2 where writ_quote_id = $1`,
    [id, utcNow()]
  );
}

async function writeWritQuoteTranslation(
  client: TxnClient,
  writQuoteId: EntityId,
  mediaExcerptId: EntityId
) {
  return client.query(
    "recordWritQuoteTranslation",
    `insert into writ_quote_translations (writ_quote_id, media_excerpt_id)
     values ($1, $2)`,
    [writQuoteId, mediaExcerptId]
  );
}

function updateJustificationsBasis(
  client: TxnClient,
  justifications: JustificationOut[],
  mediaExcerptId: EntityId
) {
  return client.query(
    "updateJustificationsBasis",
    `update justifications set basis_id = $2, basis_type = 'MEDIA_EXCERPT' where justification_id = any ($1)`,
    [justifications.map((j) => j.id), mediaExcerptId]
  );
}

function toCreateMediaExcerpt(writQuote: WritQuoteOut): CreateMediaExcerpt {
  return {
    localRep: {
      quotation: writQuote.quoteText,
    },
    locators: {
      urlLocators: writQuote.urls.map((url) => ({
        url,
        // Anchors are not read by writQuotesService.readWritQuotes, but that's okay because relying
        // on autoconfirmation is better anyways.
        anchors: url.target?.anchors,
      })),
    },
    citations: [
      {
        // Don't bother translating the writ's creator to the citation/source's creator. They are
        // usually the same and there are very few users besides me.
        source: {
          description: writQuote.writ.title,
        },
      },
    ],
    // Temporarily allow setting created. This will be transferred to all the related entities too.
    created: writQuote.created,
  };
}
