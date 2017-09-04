const os = require('os')

const {lambda} = require('howdju-ops')

if (os.platform() !== 'linux') {
  throw new Error("Must build on a Linux box because argon2 has native dependencies that are built during build")
}

lambda.updateFunctionCode('./dist/premiser-api.zip')
