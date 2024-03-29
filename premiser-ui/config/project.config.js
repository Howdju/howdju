/**
 * * modes:
 *   - local (localhost, doesn't need network)
 *   - internal (uses internal IP.  Allows mobile testing)
 *   - development (CD environment.  Initial testing.  Can break)
 *   - candidate (pre-release testing.  Load testing)
 *   - production
 * stages
 *   - local/internal
 *   - dev
 *   - candi
 *   - prod
 */

import path, { resolve } from "path";
import { existsSync } from "fs";

let basePath = __dirname;
while (basePath !== "/" && !existsSync(resolve(basePath, "package.json"))) {
  basePath = path.dirname(basePath);
}

export default {
  names: {
    js: "premiser-ui.js",
    indexHtml: "index.html",
  },
  paths: {
    base: resolve.bind(path, basePath),
    public: resolve.bind(path, basePath, "public"),
    src: resolve.bind(path, basePath, "src"),
    dist: resolve.bind(path, basePath, "dist"),
  },
  aws: {
    profile: "premiser",
    region: "us-east-1",
    cacheDuration: "P10M",
  },
};
