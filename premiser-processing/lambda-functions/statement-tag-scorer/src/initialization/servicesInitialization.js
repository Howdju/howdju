const {
  StatementTagScoresService,
  StatementTagScoresDao,
  StatementTagVotesDao,
  JobHistoryDao,
} = require('howdju-service-common')

const {logger} = require('./loggerInitialization')
const {database} = require('./databaseInitialization')

logger.debug('Initializing services')
const statementTagScoresDao = new StatementTagScoresDao(logger, database)
const jobHistoryDao = new JobHistoryDao(logger, database)
const statementTagVotesDao = new StatementTagVotesDao(logger, database)
exports.statementTagScoresService = new StatementTagScoresService(logger, statementTagScoresDao, jobHistoryDao,
  statementTagVotesDao)
logger.debug('Initialized services')