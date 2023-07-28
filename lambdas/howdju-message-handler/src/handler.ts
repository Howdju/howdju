import { Context, SNSEvent, Callback } from "aws-lambda";

import { fromJson, TopicMessage } from "howdju-common";

import { logger, emailService } from "./services";

export async function handler(
  event: SNSEvent,
  context: Context,
  callback: Callback
) {
  for (const record of event.Records) {
    let message = null;
    try {
      message = fromJson(record.Sns.Message);
    } catch (err) {
      logger.exception(err, "Error parsing SNS record message as JSON");
      continue;
    }
    const result = TopicMessage.safeParse(message);
    if (!result.success) {
      logger.error(`Error parsing TopicMessage: ${result.error.message}`);
      continue;
    }
    logger.error(result.data);
    try {
      await handleMessage(result.data);
    } catch (err) {
      logger.exception(err, `Error handling message ${{ event, context }}`);
    }
  }
  logger.debug(`Handled ${event.Records.length} records`);
  callback(null, "Success");
}

async function handleMessage(message: TopicMessage) {
  const { type, params } = message;
  switch (type) {
    case "SEND_EMAIL": {
      await emailService.sendEmail(params);
      break;
    }
    default:
      logger.error(`Unsupported TopicMessage type ${type}`);
      break;
  }
}
