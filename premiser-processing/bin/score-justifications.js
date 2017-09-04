const {ArgumentParser} = require('argparse')
const map = require('lodash/map')

const {loadEnvironmentEnvVars} = require('howdju-ops')
loadEnvironmentEnvVars()

const {
  JobScopes
} = require('howdju-service-common')

const {
  logger,
  justificationScoresService,
} = require('../lambda-functions/justification-scorer/src/initialization')

const argParser = new ArgumentParser({
  description: 'Update justification scores'
})
argParser.addArgument('--scope', {defaultValue: JobScopes.INCREMENTAL, choices: map(JobScopes)})
const args = argParser.parseArgs()

logger.info(`Scoring justifications with scope: ${args.scope}`)

switch (args.scope) {
  case JobScopes.INCREMENTAL:
    justificationScoresService.updateJustificationScoresHavingNewVotes()
    break
  case JobScopes.FULL:
    justificationScoresService.scoreJustificationsUsingAllVotes()
    break
  default:
    throw new Error(`Unsupported JobScope: ${args.scope}`)
}
