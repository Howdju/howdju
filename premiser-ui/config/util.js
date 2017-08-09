const childProcess = require('child_process')

exports.gitShortSha = () => childProcess
    .execSync('git rev-parse --short HEAD')
    .toString().trim()

exports.gitVersionTag = () => childProcess
    .execSync('git describe --match "v[0-9.]*" --abbrev=4 HEAD')
    .toString().trim()

exports.nodePackageVersion = () => require('../package.json').version

