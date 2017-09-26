const isArray = require('lodash/isArray')
const merge = require('lodash/merge')

const {
  arrayToObject
} = require('howdju-common')

exports.init = function init(provider) {

  const envConfigFilename = `../config/config.${process.env.NODE_ENV}.js`
  provider.logger.info(`Loading app config file: ${envConfigFilename}`)
  const envConfig = require(envConfigFilename)

  const baseConfig = {
    // https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
    authTokenDuration: [30, 'days'],
    /** The amount of time a user can still edit their own entities unless another user has interacted with them */
    modifyEntityGracePeriod: [24, 'hours'],
    auth: {
      bcrypt: {
        saltRounds: 10,
      },
    },
  }

  const appConfig = merge({}, baseConfig, envConfig)

  provider.appConfig = appConfig
  provider.allowedOrigins = isArray(appConfig.corsAllowOrigin) ?
    arrayToObject(appConfig.corsAllowOrigin) :
    arrayToObject([appConfig.corsAllowOrigin])
}
