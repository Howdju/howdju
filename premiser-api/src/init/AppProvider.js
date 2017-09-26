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
  './servicesInit',
]

exports.AppProvider = class AppProvider {
  constructor(stage) {
    this.stage = stage

    forEach(inits, init => require(init).init(this))
  }

  getConfigVal(configValName, defaultConfigVal) {
    let configVal = null
    if (this.stage) {
      const stageConfigValName = `${configValName}__${toUpper(this.stage)}`
      configVal = process.env[stageConfigValName]
    }
    if (!configVal) {
      configVal = process.env[configValName]
    }
    return configVal
  }
}
