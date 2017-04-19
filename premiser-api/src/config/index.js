const merge = require('lodash/merge')

const envConfig = require(`./config.${process.env.NODE_ENV}.js`)

const baseConfig = {
  // https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
  authTokenDuration: [30, 'days'],
}

module.exports = merge({}, baseConfig, envConfig)