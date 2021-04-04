const dns = require('dns')
const os = require('os')
const deasync = require('deasync')

exports.hostAddress = () => {
  let address = process.env.HOST_ADDRESS
  if (!address) {
    let done = false
    dns.lookup(os.hostname(), function (err, lookupAddress, fam) {
      address = lookupAddress
      done = true
    })
    deasync.loopWhile(() => !done)
  }
  return address
}

exports.devWebServerPort = () => {
  return 3000
}

exports.devApiServerPort = () => {
  return 8081
}
