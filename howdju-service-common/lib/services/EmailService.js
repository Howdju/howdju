const isArray = require('lodash/isArray')
const map = require('lodash/map')

const {
  requireArgs,
} = require('howdju-common')


exports.EmailService = class EmailService {
  constructor(logger, ses, sesv2) {
    this.logger = logger
    this.ses = ses
    this.sesv2 = sesv2
  }

  async sendEmail(emailParams) {
    let {
      from,
      to,
      cc,
      replyTo,
      subject,
      bodyHtml,
      bodyText,
      tags,
    } = emailParams
    requireArgs({to, subject, bodyHtml, bodyText})

    if (!from) {
      from = 'notifications@howdju.com'
    }
    if (!isArray(to)) {
      to = [to]
    }
    if (cc && !isArray(cc)) {
      cc = [cc]
    }
    if (replyTo && !isArray(replyTo)) {
      replyTo = [replyTo]
    }
    if (tags) {
      tags = map(tags, (Value, Name) => ({Name, Value}))
    }

    const params = this.sesv2
      ? makeSesv2Params({from, to, cc, replyTo, subject, bodyHtml, bodyText, tags})
      : makeSesParams({from, to, cc, replyTo, subject, bodyHtml, bodyText, tags})
    try {
      this.logger.silly('Sending email', {params, isSesv2: !!this.sesv2})
      const result = await (this.sesv2
        ? this.sesv2.sendEmail(params)
        : this.ses.sendEmail(params)
      ).promise()
      this.logger.debug('Successfully sent email', {result})
      return result
    } catch(err) {
      this.logger.error('failed to send email', {params, err})
      throw err
    }
  }
}

function makeSesParams({from, to, cc, replyTo, subject, bodyHtml, bodyText, tags}) {
  const params = {
    Source: from,
    Destination: {
      ToAddresses: to,
    },
    Message: {
      Body: {
        Html: {
          Data: bodyHtml
        },
        Text: {
          Data: bodyText
        }
      },
      Subject: {
        Data: subject
      },
    },
  }

  if (cc) {
    params['Destination']['CcAddresses'] = cc
  }
  if (replyTo) {
    params['ReplyToAddresses'] = replyTo
  }
  if (tags) {
    params['Tags'] = tags
  }

  return params
}

function makeSesv2Params({from, to, cc, replyTo, subject, bodyHtml, bodyText, tags}) {
  const params = {
    FromEmailAddress: from,
    Destination: {
      ToAddresses: to,
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Data: bodyHtml,
          },
          Text: {
            Data: bodyText,
          }
        },
      },
    },
  }

  if (cc) {
    params['Destination']['CcAddresses'] = cc
  }
  if (replyTo) {
    params['ReplyToAddresses'] = [replyTo]
  }
  if (tags) {
    params['EmailTags'] = tags
  }

  return params
}
