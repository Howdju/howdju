import { TopicMessage, TopicMessageSender } from "howdju-common";

export class FakeTopicMessageSender implements TopicMessageSender {
  topicMessages: TopicMessage[] = [];

  async sendMessage(topicMessage: TopicMessage) {
    console.log(`Received TopicMessage: ${JSON.stringify(topicMessage)}`);
    this.topicMessages.push(topicMessage);
  }
}
