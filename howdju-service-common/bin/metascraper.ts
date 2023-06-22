import { metascraper } from "howdju-service-common";

import { ArgumentParser } from "argparse";

const parser = new ArgumentParser({
  description: "Test metascraper",
});
parser.add_argument("url", { help: "URL to scrape" });
const args = parser.parse_args();

fetch(args.url)
  .then((res) => res.text())
  .then((html) => {
    return metascraper({ html, url: args.url });
  })
  .then((metadata) => {
    return console.log({ metadata });
  })
  .catch((err) => {
    console.error(err);
  });
