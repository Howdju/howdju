import { ArgumentParser } from "argparse";

import { normalizeUrl, utcNow } from "howdju-common";
import { ServicesProvider } from "howdju-service-common";

import { MigrateProvider } from "./init/MigrateProvider";

const parser = new ArgumentParser({
  description: "Convert WritQuotes to MediaExcerpts",
});
parser.add_argument("--test-one-only", { action: "store_true" });
const args = parser.parse_args();

const provider = new MigrateProvider() as ServicesProvider;

convertAllWritQuotesToMediaExcerpts()
  .finally(() => provider.pool.end())
  .catch((err) => provider.logger.error({ err }));

async function convertAllWritQuotesToMediaExcerpts() {
  const { rows } = await provider.database.query(
    "readUrlNormalizationProgress",
    `select normalized_url_id from url_normalization_progress`
  );
  let urls = await provider.urlsService.readAllUrls(
    rows.map((row) => row.normalized_url_id)
  );

  if (args.test_one_only) {
    provider.logger.info(`Truncating URLs because test-one-only.`);
    urls = [urls[0]];
  }

  for (const url of urls) {
    const normalUrl = normalizeUrl(url.url);
    if (normalUrl === url.url) {
      provider.logger.info(`URL is already normal ${url.id} (${url.url}).`);
      await provider.database.query(
        "writeUrlNormalizationProgress",
        `insert into url_normalization_progress (normalized_url_id) values ($1)`,
        [url.id]
      );
      continue;
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
              [url.id, normalizeUrl(url.url)]
            ),
            client.query(
              "writeUrlNormalizationProgress",
              `insert into url_normalization_progress (normalized_url_id, new_normal_url) values ($1, $2)`,
              [url.id, normalUrl]
            ),
          ]);
          return;
        }
        /*
            replace current URL with the extant one and then delete it (without normalizing it.)

            - url_locators.url_id
            - writ_quote_urls.url_id
            - ignore writ_quote_url_targets.

            ```
            premiser=# select t.table_schema,
                  t.table_name
            from information_schema.tables t
            inner join information_schema.columns c on c.table_name = t.table_name
                                            and c.table_schema = t.table_schema
            where c.column_name = 'url_id'
                  and t.table_schema not in ('information_schema', 'pg_catalog')
                  and t.table_type = 'BASE TABLE'
            order by t.table_schema;
            table_schema |       table_name
            --------------+------------------------
            public       | urls
            public       | writ_quote_urls
            public       | writ_quote_url_targets
            public       | url_locators
            ```
          */
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
            "replaceWritQuoteUrlUrlId",
            `update writ_quote_urls set url_id = $2 where url_id = $1`,
            [url.id, extantUrl.id]
          ),
          client.query(
            "deleteUrl",
            `update urls set deleted = $2 where url_id = $1`,
            [url.id, utcNow()]
          ),
          client.query(
            "writeUrlNormalizationProgress",
            `insert into url_normalization_progress (normalized_url_id, replacement_url_id) values ($1, $2)`,
            [url.id, extantUrl.id]
          ),
        ]);
      }
    );
  }

  provider.logger.info(`Done normalizing Urls.`);
  process.exit(0);
}
