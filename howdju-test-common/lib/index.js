const sinon = require('sinon')

module.exports.mockLogger = {
  log: sinon.fake(console.log),
  exception: sinon.fake(console.error),
  error: sinon.fake(console.error),
  warning: sinon.fake(console.warn),
  info: sinon.fake(console.info),
  debug: sinon.fake(console.debug),
}
