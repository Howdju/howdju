import { TopicMessage } from "./TopicMessage";

export interface TopicMessageSender {
  sendMessage(topicMessage: TopicMessage): Promise<void>;
}
