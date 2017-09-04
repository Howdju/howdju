const {
  JustificationScoresService,
  JustificationScoresDao,
  JobHistoryDao,
  VotesDao,
} = require('howdju-service-common')

const {logger} = require('./loggerInitialization')
const {database} = require('./databaseInitialization')

logger.debug('Initializing services')
const justificationScoresDao = new JustificationScoresDao(logger, database)
const jobHistoryDao = new JobHistoryDao(logger, database)
const votesDao = new VotesDao(database)
exports.justificationScoresService = new JustificationScoresService(logger, justificationScoresDao, jobHistoryDao, votesDao)
logger.debug('Initialized services')