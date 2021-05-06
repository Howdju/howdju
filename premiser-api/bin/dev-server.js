const debug = require('debug')('premiser-api:dev-server')
const {apiHostOrAddress, devApiServerPort} = require('../src/config/devUtil')

const server = require('../server')

const port = devApiServerPort()
server.listen(port)
debug(`Server is now running at http://${apiHostOrAddress()}:${port}.`)
