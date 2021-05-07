const dnsSync = require('dns-sync')
const os = require('os')

exports.apiHostOrHostnameAddress = () => {
  let apiHost = process.env['API_HOST']
  if (apiHost) {
    return apiHost
  }
  return dnsSync.resolve(os.hostname())
}
