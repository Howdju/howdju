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
