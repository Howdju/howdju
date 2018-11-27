const {assign} = require('lodash')

module.exports = assign(
  {},
  require('./apiUtil')
)

// It might be better to include test utils in a completely separate module, but that seems like overkill at the moment
// with so little that would go into that module
if (process.env !== 'production') {
  module.exports.testUtil = require('./testUtil')
}
