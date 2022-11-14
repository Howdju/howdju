export const EMAIL_TOPIC_MESSAGE = "EMAIL_TOPIC_MESSAGE";

const email = (params) => new TopicMessage(EMAIL_TOPIC_MESSAGE, params);

export const topicMessages = {
  email,
};

export class TopicMessage {
  constructor(type, params) {
    this.type = type;
    this.params = params;
  }
}
