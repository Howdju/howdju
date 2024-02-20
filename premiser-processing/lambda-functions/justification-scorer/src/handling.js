const { configureHandlerContext } = require("howdju-service-common");

const { justificationScoresService, logger } = require("./initialization");

exports.handler = (gatewayEvent, gatewayContext, gatewayCallback) => {
  configureHandlerContext(gatewayContext);

  logger.silly({ gatewayEvent });
  logger.silly({ gatewayContext });

  justificationScoresService
    .updateJustificationScoresUsingUnscoredVotes()
    .then(() => gatewayCallback(null, "Scoring justifications succeeded"))
    .catch((err) => {
      logger.error("Scoring justifications failed", { err });
      return gatewayCallback(err);
    });
};
