import { toJson, TopicMessage, TopicMessageSender } from "howdju-common";

export class TestTopicMessageSender implements TopicMessageSender {
  topicMessages: TopicMessage[] = [];

  sendMessage(topicMessage: TopicMessage) {
    console.log(`Received TopicMessage: ${toJson(topicMessage)}`);
    this.topicMessages.push(topicMessage);
    return Promise.resolve();
  }
}
