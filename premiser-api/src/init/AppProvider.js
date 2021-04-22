const forEach = require('lodash/forEach')
const toUpper = require('lodash/toUpper')

const inits = [
  './loggerInit',
  './utilInit',
  './configInit',
  './databaseInit',
  './daosInit',
  './searchersInit',
  './validatorsInit',
  './awsInit',
  './servicesInit',
]

exports.AppProvider = class AppProvider {
  constructor(stage) {
    this.stage = stage
    this.isProduction = this.getConfigVal('NODE_ENV') === 'production'

    forEach(inits, init => require(init).init(this))
  }

  getConfigVal(configValName, defaultConfigVal) {
    let configVal = defaultConfigVal
    let foundConfigVal = false

    if (this.stage) {
      const stageConfigValName = `${configValName}__${toUpper(this.stage)}`
      if (Object.prototype.hasOwnProperty.call(process.env, stageConfigValName)) {
        configVal = process.env[stageConfigValName]
        foundConfigVal = true
      }
    }

    if (!foundConfigVal && Object.prototype.hasOwnProperty.call(process.env, configValName)) {
      configVal = process.env[configValName]
    }

    return configVal
  }
}
