const childProcess = require('child_process')
const dns = require('dns')
const os = require('os')
const deasync = require('deasync')

exports.gitShortSha = () => childProcess
  .execSync('git rev-parse --short HEAD')
  .toString().trim()

exports.gitVersionTag = () => childProcess
  .execSync('git describe --match "v[0-9.]*" --abbrev=4 HEAD')
  .toString().trim()

exports.nodePackageVersion = () => require('../package.json').version

exports.hostAddress = () => {
  let address = process.env.HOST_ADDRESS
  if (!address) {
    let done = false
    dns.lookup(os.hostname(), function (err, add, fam) {
      address = add
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
