const assign = require('lodash/assign')
const path = require('path')
const fs = require('fs')

const {logger} = require('./logger')

const envVarRegEx = /^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)?\s*$/

exports.loadEnvironmentEnvVars = (envFilename) => {
  if (!envFilename) {
    envFilename = process.env.NODE_ENV === 'production' ?
      '../../config/production.env' :
      '../../config/local.env'
  }

  logger.info(`Loading env vars from ${envFilename}`)
  const envVars = exports.parseEnvVars(fs.readFileSync(path.join(__dirname, envFilename)))
  assign(process.env, envVars)
}

exports.parseEnvVars = (shellSource) => {
  const envVars = {}

  shellSource.toString().split('\n').forEach(function (line) {
    const matches = line.match(envVarRegEx)
    if (!matches) return

    const envVarName = matches[1]
    const envVarValue = matches[2] || ''

    envVars[envVarName] = envVarValue
  })

  return envVars
}
