import { TopicMessage } from "howdju-common";
import { UrlLocatorAutoConfirmationService } from "./UrlLocatorAutoConfirmationService";

export class DevTopicMessageConsumer {
  constructor(
    private readonly devTopicMessageQueue: TopicMessage[],
    private readonly urlLocatorAutoConfirmationService: UrlLocatorAutoConfirmationService
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
        console.log(`Received TopicMessage: ${JSON.stringify(topicMessage)}`);
        break;
      case "AUTO_CONFIRM_URL_LOCATOR":
        await this.urlLocatorAutoConfirmationService.confirmUrlLocator(
          params.urlLocatorId
        );
    }
  }
}
