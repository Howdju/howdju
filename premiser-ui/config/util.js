const os = require('os')
const dnsSync = require('dns-sync')

exports.hostAddress = () => {
  let address = process.env.HOST_ADDRESS
  if (address) {
    return address
  }
  address = dnsSync.resolve(os.hostname())
  // Standardize on localhost, since that is what I am more likely to type, and if the system thinks it
  // should be 127.0.0.1, then there will be a CORS error.
  if (address === "127.0.0.1") {
    address = "localhost"
  }
  return address
}
