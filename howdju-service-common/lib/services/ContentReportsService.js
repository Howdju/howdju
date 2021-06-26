const Promise = require('bluebird')
const outdent = require('outdent')

import {EntityValidationError} from "../serviceErrors"

const {
  schemaIds
} = require('howdju-common')
import {validate} from 'howdju-ajv-sourced'
import {topicMessages} from "./topicMessages"


module.exports.ContentReportsService = class ContentReportsService {
  constructor(appConfig, logger, authService, usersService, topicMessageSender, contentReportsDao) {
    this.appConfig = appConfig
    this.logger = logger
    this.authService = authService
    this.logger = logger
    this.usersService = usersService
    this.topicMessageSender = topicMessageSender
    this.contentReportsDao = contentReportsDao
  }

  async createContentReport(authToken, contentReport) {
    const now = new Date()
    const userId = await this.authService.readUserIdForAuthToken(authToken)

    const {isValid, errors: validationErrors} = validate(schemaIds.contentReport, contentReport)
    if (!isValid) {
      // TODO figure out AJV equivalent of validationErrors
      // const errors = translateJoiError(validationErrors)
      throw new EntityValidationError(validationErrors)
    }

    await this.contentReportsDao.createContentReport(contentReport, userId, now)

    const user = await this.usersService.readUserForId(userId)
    await Promise.all([
      sendContentReportNotificationEmail(this, contentReport, user),
      sendContentReportConfirmationEmail(this, contentReport, user),
    ])
  }
}

async function sendContentReportNotificationEmail(self, contentReport, user) {
  const {email, username} = user
  const {
    html: contentReportTableHtml,
    text: contentReportText
  } = makeContentReportEmailContent(contentReport)
  const emailParams = {
    to: self.appConfig.contentReportNotificationEmails,
    subject: 'Howdju Content Report Notification',
    tags: {purpose: 'content-report-notification'},
    bodyHtml: outdent`
        Hello,<br/>
        <br/>
        ${username} (${email}) has reported content:<br/>
        <br/>
        ${contentReportTableHtml}
      `,
    bodyText: outdent`
        Hello,
        
        ${username} (${email}) has reported content:
        
        ${contentReportText}
      `,
  }
  await self.topicMessageSender.sendMessage(topicMessages.email(emailParams))
}

async function sendContentReportConfirmationEmail(self, contentReport, user) {
  const {email} = user
  const {
    html: contentReportTableHtml,
    text: contentReportText
  } = makeContentReportEmailContent(contentReport)
  const emailParams = {
    to: email,
    subject: 'Howdju Content Report Confirmation',
    tags: {purpose: 'content-report-confirmation'},
    bodyHtml: outdent`
        Hello,<br/>
        <br/>
        Your content report was received:<br/>
        <br/>
        ${contentReportTableHtml}
      `,
    bodyText: outdent`
        Hello,
        
        Your content report was received:
        
        ${contentReportText}
      `,
  }
  await self.topicMessageSender.sendMessage(topicMessages.email(emailParams))
}

function makeContentReportEmailContent(contentReport) {
  const {
    entityType,
    entityId,
    url,
    types,
    description,
  } = contentReport
  return {
    html: outdent`
      <table style="border:1px solid black;">
        <tr>
          <th>Types</th><td>${types}</td>
        </tr><tr>
          <th>URL</th><td>${url}</td>
        </tr><tr>
           <th>Entity type</th><td>${entityType}</td>
        </tr><tr>
          <th>Entity ID</th><td>${entityId}</td>
        </tr><tr>
          <th>Description</th><td>${description}</td>
        </tr>
      </table>
    `,
    plainText: outdent`
      Types:\t${types}
      URL:\t${url}
      Entity type:\t${entityType}
      Entity ID:\t${entityId}
      Description:\t${description}
    `
  }
}
