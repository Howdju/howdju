import {
  PropositionTagScoresService,
  PropositionTagScoresDao,
  PropositionTagVotesDao,
  JobHistoryDao,
} from "howdju-service-common";

import { logger } from "./loggerInitialization";
import { database } from "./databaseInitialization";

logger.debug("Initializing services");
const propositionTagScoresDao = new PropositionTagScoresDao(logger, database);
const jobHistoryDao = new JobHistoryDao(logger, database);
const propositionTagVotesDao = new PropositionTagVotesDao(database);
export const propositionTagScoresService = new PropositionTagScoresService(
  logger,
  propositionTagScoresDao,
  jobHistoryDao,
  propositionTagVotesDao
);
logger.debug("Initialized services");
