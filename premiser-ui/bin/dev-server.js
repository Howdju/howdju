const debug = require('debug')('premiser-ui:dev-server')
const server = require('../server')
const projectConfig = require('../config/project.config')


const port = projectConfig.devWebServerPort
server.listen(port)
debug(`Server is now running at http://${projectConfig.hostAddress}:${port}.`)
