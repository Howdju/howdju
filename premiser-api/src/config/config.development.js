const {
  devWebServerPort
} = require('howdju-ops')

const corsAllowOrigin = [
  `http://localhost:${devWebServerPort()}`,
  `http://127.0.0.1:${devWebServerPort()}`,
]

try {
  // nativeUtil is not available when running bundled locally
  const {apiHostOrHostnameAddress} = require('./nativeUtil')
  corsAllowOrigin.push(`http://${apiHostOrHostnameAddress()}:${devWebServerPort()}`)
} catch (err) {
  console.warn(`Unable to add hostname address to CORS config`, {err})
}

module.exports = {
  contentReportNotificationEmails: [
    "dev-content-report-recipient@test.com",
  ],
  corsAllowOrigin
}
