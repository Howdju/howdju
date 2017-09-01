const dns = require('dns')
const deasync = require('deasync')
const os = require('os')

exports.apiHost = () => {
  let apiHost = process.env['API_HOST']
  if (apiHost) {
    return apiHost
  }
  return exports.hostAddress()
}

exports.hostAddress = () => {
  let address = null
  let done = false
  dns.lookup(os.hostname(), function (err, add, fam) {
    address = add
    done = true
  })
  deasync.loopWhile(() => !done)
  return address
}

exports.devWebServerPort = () => {
  return process.env['DEV_WEB_SERVER_PORT'] || 3000
}

exports.devApiServerPort = () => {
  return process.env['DEV_API_SERVER_PORT'] || 8081
}
