const debug = require('debug')('premiser-api:dev-server')
const {devApiServerPort} = require('../src/config/util')
const {apiHostOrHostnameAddress} = require('../src/config/nativeUtil')

const server = require('../server')

const port = devApiServerPort()
server.listen(port)
debug(`Server is now running at http://${apiHostOrHostnameAddress()}:${port}.`)
