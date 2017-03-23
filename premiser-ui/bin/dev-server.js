const debug = require('debug')('premiser-ui:dev-server')
const server = require('../server')
const projectConfig = require('../config/project.config')


server.listen(projectConfig.port)
debug(`Server is now running at http://localhost:${projectConfig.port}.`)
