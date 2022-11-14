const debug = require('debug')('premiser-api:config')
const { exec } = require("child_process")

const {
  devWebServerPort,
} = require('howdju-ops')

const corsAllowOrigin = [
  `http://localhost:${devWebServerPort()}`,
  `http://127.0.0.1:${devWebServerPort()}`,
]

let localHostAddress = null

try {
  // nativeUtil is not available when running bundled locally
  const {apiHostOrHostnameAddress} = require('./nativeUtil')
  localHostAddress = apiHostOrHostnameAddress()
} catch (err) {
  debug(`Unable to retrieve local hostname using nativeUtil`, {err})
}

if (!localHostAddress) {
  try {
    exec("ipconfig getifaddr en0", (error, stdout, stderr) => {
      if (error) {
        debug(`Unable to retrieve local hostname using ipconfig`, {error})
      } else  if (stderr) {
        debug(`Unable to retrieve local hostname using ipconfig`, {stderr})
      } else {
        localHostAddress = stdout
      }
    })
  } catch (err) {
    debug(`Unable to retrieve local hostname using ipconfig`, {err})
  }
}

if (localHostAddress) {
  const localOrigin = `http://${localHostAddress}:${devWebServerPort()}`
  debug(`Allowing local origin for CORS: ${localOrigin}`)
  corsAllowOrigin.push(localOrigin)
} else {
  debug(`Unable to add local hostname to CORS config`)
}

module.exports = {
  contentReportNotificationEmails: [
    "dev-content-report-recipient@test.com",
  ],
  corsAllowOrigin,
}
