const os = require('os')

const {updateFunctionCode} = require('../lib/lambda')

if (os.platform() !== 'linux') {
  throw new Error("Must build on a Linux box because argon2 has native dependencies that are built during build")
}

updateFunctionCode('./dist/premiser-api.zip')
