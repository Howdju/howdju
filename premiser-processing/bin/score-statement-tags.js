const {ArgumentParser} = require('argparse')
const map = require('lodash/map')

const {
  JobScopes
} = require('howdju-service-common')

const {
  logger,
  statementTagScoresService,
} = require('../lambda-functions/statement-tag-scorer/src/initialization')
const {
  pool,
} = require('../lambda-functions/statement-tag-scorer/src/initialization/databaseInitialization')

const argParser = new ArgumentParser({
  description: 'Update statement tag scores'
})
argParser.addArgument('--scope', {defaultValue: JobScopes.INCREMENTAL, choices: map(JobScopes)})
const args = argParser.parseArgs()

logger.info(`Scoring with scope: ${args.scope}`)

const job = () => {
  switch (args.scope) {
    case JobScopes.INCREMENTAL:
      return statementTagScoresService.updateStatementTagScoresUsingUnscoredVotes()
    case JobScopes.FULL:
      return statementTagScoresService.setStatementTagScoresUsingAllVotes()
    default:
      throw new Error(`Unsupported JobScope: ${args.scope}`)
  }
}

job().finally(() => pool.end())
