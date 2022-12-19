import type { SNS } from "aws-sdk";
import {
  Logger,
  toJson,
  TopicMessageSender,
  TopicMessage,
} from "howdju-common";

export class AwsTopicMessageSender implements TopicMessageSender {
  private logger: Logger;
  private sns: SNS;
  private topicArn: string;

  constructor(logger: Logger, sns: SNS, topicArn: string) {
    this.logger = logger;
    this.sns = sns;
    this.topicArn = topicArn;
  }

  async sendMessage(topicMessage: TopicMessage) {
    const params = {
      TopicArn: this.topicArn,
      // TODO compress the message?
      Message: toJson(topicMessage),
    };

    const response = await this.sns.publish(params).promise();
    const { MessageId } = response;
    const { type } = topicMessage;
    this.logger.info(
      `Message sent to topic ${params.TopicArn} (${{ MessageId, type }})`
    );
  }
}
