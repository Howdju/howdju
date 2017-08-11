const debug = require('debug')('premiser-api:dev-server')
const {apiHost, devApiServerPort} = require('../src/util')

const server = require('../server')

const port = devApiServerPort()
server.listen(port)
debug(`Server is now running at http://${apiHost()}:${port}.`)
