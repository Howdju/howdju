const debug = require("debug")("premiser-api:dev-server");
const { esbuilder } = require("./esbuilder");

const { devApiServerPort, apiHostOrLocalAddress } = require("howdju-ops");

const apiHost = apiHostOrLocalAddress(false);

// The handler depends on API_HOST, but can't depend on the native utils to look it up via DNS
// (or else it isn't bundleable), so set it here if necessary. For local development, this
// can be set to localhost using /config/localhost.env, but for mobile development we might
// try to access the server on the local network using the IP address, which requires looking
// the API_HOST up dynamically.
if (!process.env.API_HOST) {
  process.env.API_HOST = apiHost;
}

let server = null;

esbuilder({
  // entryPoints and outfile are relative to the CWD of the script
  entryPoints: ["local-server.js"],
  outfile: "dist/local-server.js",
  watch: {
    onRebuild(error, result) {
      if (server) stopServer();
      if (error) {
        console.error("watch build failed:", error);
      } else {
        server = startServer();
      }
    },
  },
})
  .then((result) => {
    server = startServer();
    return result;
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

function startServer() {
  // Require is relative to the current file
  const localServerDistPath = "../local-server.js";
  delete require.cache[require.resolve(localServerDistPath)];
  const { app } = require(localServerDistPath);
  const port = devApiServerPort();
  return app.listen(port, () => {
    debug(`Server is now running at http://${apiHost}:${port}.`);
  });
}

function stopServer() {
  server.close();
}
