const isArray = require('lodash/isArray')
const map = require('lodash/map')

const {
  requireArgs,
} = require('howdju-common')


exports.EmailService = class EmailService {
  constructor(logger, ses) {
    this.logger = logger
    this.ses = ses
  }
  
  async sendEmail(emailParams) {    
    let {
      to,
      cc,
      from,
      replyTo,
      subject,
      bodyHtml,
      bodyText,
      tags,
    } = emailParams
    requireArgs({to, from, subject, bodyHtml, bodyText})
    
    if (!isArray(to)) {
      to = [to]
    }
    
    if (!from) {
      from = 'notifications@howdju.com'
    }
    
    const params = {
      Destination: {
        ToAddresses: to,
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: bodyHtml
          },
          Text: {
            Charset: "UTF-8",
            Data: bodyText
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: from,
    }
    
    if (cc) {
      if (!isArray(cc)) {
        cc = [cc]
      }
      params['Destination']['CcAddresses'] = cc
    }
    
    if (replyTo) {
      if (!isArray(replyTo)) {
        replyTo = [replyTo]
      }
      params['ReplyToAddresses'] = replyTo
    }
    
    if (tags) {
      params['Tags'] = map(tags, (Value, Name) => ({Name, Value}))
    }

    try {
      const result = await this.ses.sendEmail(params).promise()
      this.logger.debug('Successfully sent email', {result})
      return result
    } catch(err) {
      this.logger.exception('failed to send email', {err})
      throw err
    }
  }
}
