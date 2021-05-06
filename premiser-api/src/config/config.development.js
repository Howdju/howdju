const {
  apiHostOrAddress,
  devWebServerPort
} = require('./devUtil')

module.exports = {
  corsAllowOrigin: [
    `http://localhost:${devWebServerPort()}`,
    `http://127.0.0.1:${devWebServerPort()}`,
    `http://${apiHostOrAddress()}:${devWebServerPort()}`,
  ],
}
