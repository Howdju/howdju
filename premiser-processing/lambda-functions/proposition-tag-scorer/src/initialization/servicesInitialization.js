const {
  PropositionTagScoresService,
  PropositionTagScoresDao,
  PropositionTagVotesDao,
  JobHistoryDao,
} = require("howdju-service-common");

const { logger } = require("./loggerInitialization");
const { database } = require("./databaseInitialization");

logger.debug("Initializing services");
const propositionTagScoresDao = new PropositionTagScoresDao(logger, database);
const jobHistoryDao = new JobHistoryDao(logger, database);
const propositionTagVotesDao = new PropositionTagVotesDao(logger, database);
exports.propositionTagScoresService = new PropositionTagScoresService(
  logger,
  propositionTagScoresDao,
  jobHistoryDao,
  propositionTagVotesDao
);
logger.debug("Initialized services");
