const isArray = require('lodash/isArray')
const merge = require('lodash/merge')

const {
  arrayToObject
} = require('howdju-common')

exports.init = function init(provider) {

  const nodeEnv = process.env.NODE_ENV
  const envConfigs = {}
  try {
    envConfigs['development'] = require('../config/config.development.js')
  } catch (err) {
    provider.logger.info('development config was not found', {err})
  }
  try {
    envConfigs['production'] = require('../config/config.production.js')
  } catch (err) {
    provider.logger.info('production config was not found', {err})
  }
  provider.logger.info(`Loading app config file for: ${nodeEnv}`)
  const envConfig = envConfigs[nodeEnv]
  if (!envConfig) {
    throw new Error(`Configuration was not found for requested env ${nodeEnv}`)
  }

  const baseConfig = {
    auth: {
      bcrypt: {
        saltRounds: 10,
      },
    },
    authTokenDuration: {days: 30},
    /** Whether to prevent responses that indicate whether an email has been registered with the system */
    doConcealEmailExistence: true,
    // https://github.com/jsmreese/moment-duration-format#template-string
    durationFormatTemplate: "d [days] h [hours] m [minutes] s [seconds]",
    // https://github.com/jsmreese/moment-duration-format#trim
    durationFormatTrim: "both mid",
    /** The amount of time a user can still edit their own entities unless another user has interacted with them */
    modifyEntityGracePeriod: {hours: 24},
    passwordResetDuration: {hours: 4},
    registrationDuration: {hours: 24},
  }

  const appConfig = merge({}, baseConfig, envConfig)

  provider.appConfig = appConfig
  provider.allowedOrigins = isArray(appConfig.corsAllowOrigin) ?
    arrayToObject(appConfig.corsAllowOrigin) :
    arrayToObject([appConfig.corsAllowOrigin])
}
