const merge = require('lodash/merge')

const envConfig = require(`./config.${process.env.NODE_ENV}.js`)

const baseConfig = {
  // https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
  authTokenDuration: [30, 'days'],
  /** The amount of time a user can still edit their own entities unless another user has interacted with them */
  modifyEntityGracePeriod: [24, 'hours']
}

module.exports = merge({}, baseConfig, envConfig)