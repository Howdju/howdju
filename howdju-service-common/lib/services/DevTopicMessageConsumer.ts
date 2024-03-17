import { toJson, TopicMessage } from "howdju-common";

import { UrlLocatorAutoConfirmationService } from "./UrlLocatorAutoConfirmationService";
import { UrlsService } from "./UrlsService";

export class DevTopicMessageConsumer {
  constructor(
    private readonly devTopicMessageQueue: TopicMessage[],
    private readonly urlLocatorAutoConfirmationService: UrlLocatorAutoConfirmationService,
    private readonly urlsService: UrlsService
  ) {
    setInterval(() => {
      for (const topicMessage of this.devTopicMessageQueue) {
        void this.consumeMessage(topicMessage);
      }
      this.devTopicMessageQueue.length = 0;
    }, 1000);
  }

  async consumeMessage(topicMessage: TopicMessage) {
    const { type, params } = topicMessage;
    switch (type) {
      case "SEND_EMAIL":
        console.log(`Received TopicMessage: ${toJson(topicMessage)}`);
        break;
      case "AUTO_CONFIRM_URL_LOCATOR": {
        const { urlLocatorId } = params;
        await this.urlLocatorAutoConfirmationService.confirmUrlLocator(
          urlLocatorId
        );
        break;
      }
      case "CONFIRM_CANONICAL_URL": {
        const { urlId } = params;
        await this.urlsService.confirmCanonicalUrl(urlId);
        break;
      }
    }
  }
}
