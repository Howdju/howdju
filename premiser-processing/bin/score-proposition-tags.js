const {ArgumentParser} = require('argparse')
const map = require('lodash/map')

const {
  JobScopes,
} = require('howdju-service-common')

const {
  logger,
  propositionTagScoresService,
} = require('../lambda-functions/proposition-tag-scorer/src/initialization')
const {
  pool,
} = require('../lambda-functions/proposition-tag-scorer/src/initialization/databaseInitialization')

const argParser = new ArgumentParser({
  description: 'Update proposition tag scores',
})
argParser.add_argument('--scope', {defaultValue: JobScopes.INCREMENTAL, choices: map(JobScopes)})
const args = argParser.parse_args()

logger.info(`Scoring with scope: ${args.scope}`)

const job = () => {
  switch (args.scope) {
    case JobScopes.INCREMENTAL:
      return propositionTagScoresService.updatePropositionTagScoresUsingUnscoredVotes()
    case JobScopes.FULL:
      return propositionTagScoresService.setPropositionTagScoresUsingAllVotes()
    default:
      throw new Error(`Unsupported JobScope: ${args.scope}`)
  }
}

/* eslint-disable no-console */
job().finally(() => pool.end()).catch(err => console.log(err))
