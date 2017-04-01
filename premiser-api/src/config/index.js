const _ = require('lodash')

const envConfig = require(`./config.${process.env.NODE_ENV}.js`)

const baseConfig = {
  // https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
  authenticationTokenDuration: [1, 'day'],
}

module.exports = _.merge({}, baseConfig, envConfig)