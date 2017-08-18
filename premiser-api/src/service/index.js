const merge = require('lodash/merge')

module.exports = merge({}, require('./service'), require('./auth'))