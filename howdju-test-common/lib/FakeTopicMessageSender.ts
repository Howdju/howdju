import { TopicMessage, TopicMessageSender } from "howdju-common";

export class FakeTopicMessageSender implements TopicMessageSender {
  topicMessages: TopicMessage[] = [];

  sendMessage(topicMessage: TopicMessage) {
    console.log(`Received TopicMessage: ${JSON.stringify(topicMessage)}`);
    this.topicMessages.push(topicMessage);
    return Promise.resolve();
  }
}
