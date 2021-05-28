const dnsSync = require('dns-sync')
const os = require('os')
const forEach = require('lodash/forEach')

const emptyMac = '00:00:00:00:00:00'
const loopbackAddress = '127.0.0.1'

exports.apiHostOrHostnameAddress = () => {
  let apiHost = process.env['API_HOST']
  if (apiHost) {
    return apiHost
  }
  const dnsName = dnsSync.resolve(os.hostname())
  if (dnsName !== loopbackAddress) {
    return dnsName
  }
  return localAddress()
}

function localAddress() {
  const addresses = []

  forEach(os.networkInterfaces(), (infos, name) => {
    forEach(infos, (info) => {
      if (info.internal || info.mac === emptyMac) {
        return
      }
      if (info.family === 'IPv4') {
        // Prefer IPv4 since they're easier to type
        addresses.unshift(info.address)
      } else{
        addresses.push(info.address)
      }
    })
  })
  return addresses.length ? addresses[0] : loopbackAddress
}
