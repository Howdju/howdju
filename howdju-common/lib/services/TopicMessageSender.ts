export interface TopicMessageSender {
  sendMessage(topicMessage: any): Promise<void>;
}
