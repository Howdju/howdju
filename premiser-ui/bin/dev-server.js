const debug = require('debug')('premiser-ui:dev-server')
const server = require('../server')
const {
  devWebServerPort
} = require('../config/util')
const projectConfig = require('../config/project.config')


const port = devWebServerPort()
server.listen(port)
debug(`Server is now running at http://${projectConfig.hostAddress}:${port}.`)
