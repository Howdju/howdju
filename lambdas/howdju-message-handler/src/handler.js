import {fromJson} from 'howdju-common'

import {EMAIL_TOPIC_MESSAGE} from "howdju-service-common/lib/services/topicMessages"

const {logger, emailService} = require('./services')

export async function handler(event, context, callback) {
  for (const record of event.Records) {
    let message = null
    try {
      message = fromJson(record.Sns.Message)
    } catch (err) {
      logger.exception(err, "Error parsing SNS record message as JSON")
    }
    if (message){
      try {
        await handleMessage(message)
      } catch (err) {
        logger.exception(err, `Error handling message ${{event, context}}`)
      }
    }
  }
  logger.debug(`Handled ${event.Records.length} records`)
  callback(null, "Success")
}

async function handleMessage(message) {
  const {type} = message
  switch (type) {
    case EMAIL_TOPIC_MESSAGE: {
      const {params} = message
      await emailService.sendEmail(params)
      break
    }
    default:
      logger.error(`Unsupported message type ${message}`)
      break
  }
}
