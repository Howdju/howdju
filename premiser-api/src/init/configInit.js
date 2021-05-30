const isArray = require('lodash/isArray')
const merge = require('lodash/merge')

const {
  arrayToObject
} = require('howdju-common')

exports.init = function init(provider) {

  let envConfig
  switch (process.env.NODE_ENV) {
    case 'development':
      provider.logger.debug('loading development config')
      envConfig = require('../config/config.development.js')
      provider.logger.debug('loaded development config')
      break
    case 'production':
      provider.logger.debug('loading production config')
      envConfig = require('../config/config.production.js')
      provider.logger.debug('loaded production config')
      break
    default:
      throw new Error(`Configuration was not found for requested env ${process.env.NODE_ENV}`)
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
    uiAuthority: provider.getConfigVal('UI_AUTHORITY', "http://localhost"),
  }

  const appConfig = merge({}, baseConfig, envConfig)

  provider.appConfig = appConfig
  provider.allowedOrigins = isArray(appConfig.corsAllowOrigin) ?
    arrayToObject(appConfig.corsAllowOrigin) :
    arrayToObject([appConfig.corsAllowOrigin])

  provider.logger.debug('configInit complete')
}
