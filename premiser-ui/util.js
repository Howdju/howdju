const childProcess = require('child_process')

exports.gitSha = () => childProcess
  .execSync('git rev-parse HEAD')
  .toString().trim()

exports.gitShaShort = () => childProcess
  .execSync('git rev-parse --short HEAD')
  .toString().trim()

exports.gitVersionTag = () => childProcess
  .execSync('git describe --match "v[0-9.]*" --abbrev=4 HEAD')
  .toString().trim()

exports.packageVersion = () => require('./package.json').version
