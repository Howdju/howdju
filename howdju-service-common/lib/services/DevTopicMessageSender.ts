import { TopicMessage, TopicMessageSender } from "howdju-common";

export class DevTopicMessageSender implements TopicMessageSender {
  constructor(private readonly devTopicMessageQueue: TopicMessage[]) {}

  sendMessage(topicMessage: TopicMessage) {
    this.devTopicMessageQueue.push(topicMessage);
    return Promise.resolve();
  }
}
