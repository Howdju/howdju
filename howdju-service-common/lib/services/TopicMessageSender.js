import {toJson} from "howdju-common"

export class TopicMessageSender {
  constructor(logger, sns, topicArn) {
    this.logger = logger
    this.sns = sns
    this.topicArn = topicArn
  }

  async sendMessage(topicMessage) {
    const params = {
      TopicArn: this.topicArn,
      Message: toJson(topicMessage),
    }

    try {
      const response = await this.sns.publish(params).promise()
      const {MessageId} = response
      const {type} = topicMessage
      this.logger.info(`Message sent to topic ${params.TopicArn} (${{MessageId, type}})`)
    } catch (err){
      this.logger.exception(err, `Error sending message to topic: ${{params}}`)
    }
  }
}
