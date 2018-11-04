const {assign} = require('lodash')

module.exports = assign(
  {},
  require('./apiUtil'),
  {testUtil: require('./testUtil')}
)
