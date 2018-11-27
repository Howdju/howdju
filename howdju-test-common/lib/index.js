const sinon = require('sinon')

module.exports.mockLogger = {
  log: sinon.fake(),
  error: sinon.fake(),
  warning: sinon.fake(),
  info: sinon.fake(),
  debug: sinon.fake(),
}
