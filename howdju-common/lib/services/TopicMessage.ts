export const EMAIL_TOPIC_MESSAGE = "EMAIL_TOPIC_MESSAGE";

const email = (params: Record<string, any>) =>
  new TopicMessage(EMAIL_TOPIC_MESSAGE, params);

export const topicMessages = {
  email,
};

export class TopicMessage {
  type: string;
  params: Record<string, any>;
  constructor(type: string, params: Record<string, any>) {
    this.type = type;
    this.params = params;
  }
}
