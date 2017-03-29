const debug = require('debug')('premiser-api:dev-server')

Object.assign(process.env, {
  DB_USER: 'tech',
  DB_NAME: 'premiser',
  DB_PASSWORD: null,
  DB_HOST: 'localhost',
  CORS_ALLOW_ORIGIN: 'http://localhost:3000'
})

const server = require('../server')

const port = 8081
server.listen(port)
debug(`Server is now running at http://localhost:${port}.`)
