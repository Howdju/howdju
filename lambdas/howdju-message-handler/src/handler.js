import {EMAIL_TOPIC_MESSAGE} from "howdju-service-common/lib/services/topicMessages"

const {logger, emailService} = require('./services')

export function handler(event, context, callback) {
  for (const record of event.Records) {
    try {
      handleMessage(record.Sns.Message)
    } catch (err) {
      logger.exception(err, `Error handling message ${{event, context}}`)
    }
  }
  logger.debug(`Handled ${event.Records.length} records`)
  callback(null, "Success")
}

function handleMessage(message) {
  const {type} = message
  switch (type) {
    case EMAIL_TOPIC_MESSAGE: {
      const {params} = message
      emailService.sendEmail(params)
      break
    }
    default:
      logger.error(`Unsupported message type ${message}`)
      break
  }
}
