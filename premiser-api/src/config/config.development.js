const {
  apiHost,
  devWebServerPort
} = require('../util')

module.exports = {
  corsAllowOrigin: [
    `http://localhost:${devWebServerPort()}`,
    `http://127.0.0.1:${devWebServerPort()}`,
    `http://${apiHost()}:${devWebServerPort()}`,
  ],
}
