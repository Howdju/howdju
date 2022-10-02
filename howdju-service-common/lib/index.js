// Tell any libraries that support any-promise to use Bluebird instead of the built-in.
require('any-promise/register')('bluebird', {Promise: require('bluebird')})

const moment = require('moment')
const momentDurationFormatSetup = require("moment-duration-format")
momentDurationFormatSetup(moment)

const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./apiGateway'),
  require('./daos'),
  require('./database'),
  require('./jobEnums'),
  require('./logging'),
  require('./permissions'),
  require('./searchers'),
  require('./services'),
  require('./util'),
  require('./validators'),
  require('./serviceErrors')
)
