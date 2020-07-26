const {ArgumentParser} = require('argparse')
const map = require('lodash/map')

const {
  JobScopes
} = require('howdju-service-common')

const {
  logger,
  justificationScoresService,
} = require('../lambda-functions/justification-scorer/src/initialization')
const {
  pool,
} = require('../lambda-functions/justification-scorer/src/initialization/databaseInitialization')

const argParser = new ArgumentParser({
  description: 'Update justification scores'
})
argParser.addArgument('--scope', {defaultValue: JobScopes.INCREMENTAL, choices: map(JobScopes)})
const args = argParser.parseArgs()

logger.info(`Scoring justifications with scope: ${args.scope}`)

const job = () => {
  switch (args.scope) {
    case JobScopes.INCREMENTAL:
      return justificationScoresService.updateJustificationScoresUsingUnscoredVotes()
    case JobScopes.FULL:
      return justificationScoresService.setJustificationScoresUsingAllVotes()
    default:
      throw new Error(`Unsupported JobScope: ${args.scope}`)
  }
}

/* eslint-disable no-console */
job().finally(() => pool.end()).catch(err => console.log(err))
