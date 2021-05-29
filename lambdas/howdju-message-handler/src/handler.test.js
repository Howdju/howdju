import {handler} from './handler'
const {emailService} = require('./services')
import {topicMessages} from "howdju-service-common/lib/services/topicMessages"

jest.spyOn(emailService, 'sendEmail').mockImplementation()

describe('handler', () => {
  it('handles an email topic message', () => {
    const params = {}
    const event = {
      Records: [
        {
          Sns: {
            Message: topicMessages.email(params)
          }
        }
      ]
    }
    const context = {}
    const callback = jest.fn()

    handler(event, context, callback)

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    expect(emailService.sendEmail).toHaveBeenCalledWith(params)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
