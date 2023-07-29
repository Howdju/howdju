import { Context, SNSEvent, Callback } from "aws-lambda";

import { fromJson, TopicMessage } from "howdju-common";

import { provider } from "./provider";

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
      provider.logger.exception(
        err,
        "Error parsing SNS record message as JSON"
      );
      continue;
    }
    const result = TopicMessage.safeParse(message);
    if (!result.success) {
      provider.logger.error(
        `Error parsing TopicMessage: ${result.error.message}`
      );
      continue;
    }
    provider.logger.error(result.data);
    try {
      await handleMessage(result.data);
    } catch (err) {
      provider.logger.exception(
        err,
        `Error handling message ${{ event, context }}`
      );
    }
  }
  provider.logger.debug(`Handled ${event.Records.length} records`);
  callback(null, "Success");
}

async function handleMessage(message: TopicMessage) {
  const { type, params } = message;
  switch (type) {
    case "SEND_EMAIL": {
      await provider.emailService.sendEmail(params);
      break;
    }
    case "AUTO_CONFIRM_URL_LOCATOR": {
      const { urlLocatorId } = params;
      await provider.urlLocatorAutoConfirmationService.confirmUrlLocator(
        urlLocatorId
      );
      break;
    }
  }
}
