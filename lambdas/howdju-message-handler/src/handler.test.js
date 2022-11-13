import {topicMessages} from "howdju-service-common/lib/services/topicMessages"
import {TopicMessageSender} from "howdju-service-common/lib/services/TopicMessageSender"
import {mockLogger} from 'howdju-test-common'

import {handler} from './handler'
import {emailService} from './services'

jest.spyOn(emailService, 'sendEmail').mockImplementation()
const TOPIC_ARN = "the-test-topic-arn"

describe('handler', () => {
  it('handles a TopicMessageSender message', async () => {
    // Integration test of TopicMessageSender and handler
    const callback = jest.fn()
    const mockSns = new MockSns(callback)
    const topicMessageSender = new TopicMessageSender(mockLogger, mockSns, TOPIC_ARN)
    const params = {to: 'someone', from: 'a-robot'}

    await topicMessageSender.sendMessage(topicMessages.email(params))

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    expect(emailService.sendEmail).toHaveBeenCalledWith(params)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

class MockSns {
  constructor(callback) {
    this.callback = callback
  }

  publish(params) {
    const {TopicArn, Message} = params
    const event = {
      Records: [
        {
          Sns: {
            TopicArn,
            Message,
          },
        },
      ],
    }
    const context = {}

    const promise = async () => {
      // Call the actual handler
      await handler(event, context, this.callback)
      return {MessageId: "the-message-id"}
    }
    return {promise}
  }
}
