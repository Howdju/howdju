const debug = require('debug')('premiser-api:dev-server')
const {devApiServerPort} = require('howdju-ops')
const {apiHostOrHostnameAddress} = require('../src/config/nativeUtil')

const apiHost = apiHostOrHostnameAddress()

// The handler depends on API_HOST, but can't depend on the native utils to look it up via DNS
// (or else it isn't bundleable), so set it here if necessary. For local development, this
// can be set to localhost using /config/localhost.env, but for mobile development we might
// try to access the server on the local network using the IP address, which requires looking
// the API_HOST up dynamically.
if (!process.env.API_HOST) {
  process.env.API_HOST = apiHost
}

const server = require('../server')

const port = devApiServerPort()
server.listen(port)
debug(`Server is now running at http://${apiHost}:${port}.`)
