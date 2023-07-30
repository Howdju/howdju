import { Context, SNSEvent, Callback } from "aws-lambda";

import { fromJson, toJson, TopicMessage } from "howdju-common";
import { AppProvider } from "./LambdaProvider";

import { provider } from "./provider";

export class Handler {
  constructor(private readonly provider: AppProvider) {}

  async handle(event: SNSEvent, context: Context, callback: Callback) {
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
        await this.handleMessage(result.data);
      } catch (err) {
        provider.logger.exception(
          err,
          `Error handling message ${toJson({ event, context, err })}`
        );
      }
    }
    provider.logger.debug(`Handled ${event.Records.length} records`);
    callback(null, "Success");
  }

  private async handleMessage(message: TopicMessage) {
    const { type, params } = message;
    switch (type) {
      case "SEND_EMAIL": {
        await this.provider.emailService.sendEmail(params);
        break;
      }
      case "AUTO_CONFIRM_URL_LOCATOR": {
        const { urlLocatorId } = params;
        await this.provider.urlLocatorAutoConfirmationService.confirmUrlLocator(
          urlLocatorId
        );
        break;
      }
    }
  }
}

const handlerImpl = new Handler(provider);

export function handler(event: SNSEvent, context: Context, callback: Callback) {
  return handlerImpl.handle(event, context, callback);
}
