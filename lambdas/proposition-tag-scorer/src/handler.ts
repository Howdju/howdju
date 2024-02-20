import { Context, ScheduledEvent } from "aws-lambda";

import { configureHandlerContext } from "howdju-service-common";

import { propositionTagScoresService, logger } from "./initialization";

export async function handler(event: ScheduledEvent, context: Context) {
  configureHandlerContext(context);

  logger.silly({ gatewayContext: context, event });

  logger.info("Scoring propositions…");
  await propositionTagScoresService.updatePropositionTagScoresUsingUnscoredVotes();
  logger.info("Scoring proposition tags succeeded.");
}
