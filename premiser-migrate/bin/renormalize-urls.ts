import { ArgumentParser } from "argparse";

import { normalizeUrl, utcNow } from "howdju-common";
import { ServicesProvider } from "howdju-service-common";

import { MigrateProvider } from "./init/MigrateProvider";

const parser = new ArgumentParser({
  description: "Re-normalize URLs, fixing a bug in a previous run",
});
parser.add_argument("--test-one-only", { action: "store_true" });
const args = parser.parse_args();

const provider = new MigrateProvider() as ServicesProvider;

normalizeAllUrls()
  .finally(() => provider.pool.end())
  .catch((err) => provider.logger.error({ err }));

const badEndings = [
  ".amp/",
  ".ars/",
  ".asp/",
  ".aspx/",
  ".cfm/",
  ".cms/",
  ".ece/",
  ".htm/",
  ".html/",
  ".jpg/",
  ".jsp/",
  ".pdf/",
  ".php/",
  ".png/",
  ".shtml/",
  ".stm/",
  ".story/",
  ".txt/",
];

async function normalizeAllUrls() {
  const { rows } = await provider.database.query(
    "readUrlNormalizationProgress",
    `select normalized_url_id from url_renormalization_progress_2`
  );
  let urls = await provider.urlsDao.readAllUrls(
    rows.map((row) => row.normalized_url_id)
  );

  if (args.test_one_only) {
    provider.logger.info(`Truncating URLs because test-one-only.`);
    urls = [urls[0]];
  }

  for (const url of urls) {
    let normalUrl = normalizeUrl(url.url);
    if (normalUrl === url.url) {
      provider.logger.info(`URL is already normal ${url.id} (${url.url}).`);

      if (
        url.url.endsWith("/") &&
        url.url.substring(0, url.url.length - 1) === url.canonicalUrl
      ) {
        provider.logger.info(
          `URL appears to have slash-bug. ${url.id} (${url.url}).`
        );
        normalUrl = url.canonicalUrl;
        // Proceed to update the URL.
      } else if (badEndings.some((ending) => url.url.endsWith(ending))) {
        provider.logger.info(
          `URL appears to have bad ending. ${url.id} (${url.url}).`
        );
        normalUrl = url.url.substring(0, url.url.length - 1);
        // Proceed to update the URL.
      } else {
        await provider.database.query(
          "writeUrlNormalizationProgress",
          `insert into url_renormalization_progress_2 (normalized_url_id) values ($1)`,
          [url.id]
        );
        continue;
      }
    }

    const extantUrl = await provider.urlsDao.readUrlForUrl(normalUrl);

    await provider.database.transaction(
      "normalizeUrlTxn",
      "read uncommitted",
      "read write",
      async (client) => {
        if (!extantUrl || extantUrl.id === url.id) {
          provider.logger.info(
            `Normalizing ${url.id}'s URL ${url.url} to ${normalUrl}`
          );
          await Promise.all([
            client.query(
              "normalizeUrl",
              `update urls set url = $2 where url_id = $1`,
              [url.id, normalUrl]
            ),
            client.query(
              "writeUrlNormalizationProgress",
              `insert into url_renormalization_progress_2 (normalized_url_id, old_url, new_url) values ($1, $2, $3)`,
              [url.id, url.url, normalUrl]
            ),
          ]);
          return;
        }

        provider.logger.info(
          `Found extant URL. Replace ${url.id} with ${extantUrl.id} (${url.url} becomes ${extantUrl.url}).`
        );
        await Promise.all([
          client.query(
            "replaceUrlLocatorUrlId",
            `update url_locators set url_id = $2 where url_id = $1`,
            [url.id, extantUrl.id]
          ),
          client.query(
            "deleteUrl",
            `update urls set deleted = $2 where url_id = $1`,
            [url.id, utcNow()]
          ),
          client.query(
            "writeUrlNormalizationProgress",
            `insert into url_renormalization_progress_2 (normalized_url_id, old_url, new_url, replacement_url_id) values ($1, $2, $3, $4)`,
            [url.id, url.url, extantUrl.url, extantUrl.id]
          ),
        ]);
      }
    );
  }

  provider.logger.info(`Done re-normalizing Urls.`);
  process.exit(0);
}
