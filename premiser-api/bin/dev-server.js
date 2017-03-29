const debug = require('debug')('premiser-api:dev-server')

const server = require('../server')

const port = 8081
server.listen(port)
debug(`Server is now running at http://localhost:${port}.`)
