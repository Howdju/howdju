const {
  JustificationScoresService,
  JustificationScoresDao,
  JustificationVotesDao,
  JobHistoryDao,
} = require('howdju-service-common')

const {logger} = require('./loggerInitialization')
const {database} = require('./databaseInitialization')

logger.debug('Initializing services')
const justificationScoresDao = new JustificationScoresDao(logger, database)
const jobHistoryDao = new JobHistoryDao(logger, database)
const justificationVotesDao = new JustificationVotesDao(database)
exports.justificationScoresService = new JustificationScoresService(logger, justificationScoresDao, jobHistoryDao,
  justificationVotesDao)
logger.debug('Initialized services')