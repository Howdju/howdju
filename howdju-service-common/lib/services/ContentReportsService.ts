import outdent from "outdent";

import {
  AuthToken,
  CreateContentReport,
  formatZodError,
  Logger,
  TopicMessageSender,
  User,
} from "howdju-common";

import { EntityValidationError } from "../serviceErrors";
import { ApiConfig, AuthService, ContentReportsDao, UsersService } from "..";

export class ContentReportsService {
  appConfig: ApiConfig;
  logger: Logger;
  authService: AuthService;
  usersService: UsersService;
  topicMessageSender: TopicMessageSender;
  contentReportsDao: ContentReportsDao;

  constructor(
    appConfig: ApiConfig,
    logger: Logger,
    authService: AuthService,
    usersService: UsersService,
    topicMessageSender: TopicMessageSender,
    contentReportsDao: ContentReportsDao
  ) {
    this.appConfig = appConfig;
    this.logger = logger;
    this.authService = authService;
    this.logger = logger;
    this.usersService = usersService;
    this.topicMessageSender = topicMessageSender;
    this.contentReportsDao = contentReportsDao;
  }

  async createContentReport(
    authToken: AuthToken,
    contentReport: CreateContentReport
  ) {
    const now = new Date();
    const userId = await this.authService.readUserIdForAuthToken(authToken);

    const result = CreateContentReport.safeParse(contentReport);
    if (!result.success) {
      throw new EntityValidationError(formatZodError(result.error));
    }

    await this.contentReportsDao.createContentReport(
      contentReport,
      userId,
      now
    );

    const user = await this.usersService.readUserForId(userId);
    await Promise.all([
      this.sendContentReportNotificationEmail(contentReport, user),
      this.sendContentReportConfirmationEmail(contentReport, user),
    ]);
  }

  private async sendContentReportNotificationEmail(
    contentReport: CreateContentReport,
    user: User
  ) {
    const { email, username } = user;
    const { html: contentReportTableHtml, plainText: contentReportText } =
      this.makeContentReportEmailContent(contentReport);
    const params = {
      to: this.appConfig.contentReportNotificationEmails,
      subject: "Howdju Content Report Notification",
      tags: { purpose: "content-report-notification" },
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
    };
    await this.topicMessageSender.sendMessage({ type: "SEND_EMAIL", params });
  }

  private async sendContentReportConfirmationEmail(
    contentReport: CreateContentReport,
    user: User
  ) {
    const { email } = user;
    const { html: contentReportTableHtml, plainText: contentReportText } =
      this.makeContentReportEmailContent(contentReport);
    const params = {
      to: email,
      subject: "Howdju Content Report Confirmation",
      tags: { purpose: "content-report-confirmation" },
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
    };
    await this.topicMessageSender.sendMessage({ type: "SEND_EMAIL", params });
  }

  private makeContentReportEmailContent(contentReport: CreateContentReport) {
    const { entityType, entityId, url, types, description } = contentReport;
    return {
      html: outdent`
        <table style="border:1px solid black;">
          <tr>
            <th>Types</th>
            <td>
              <ul>
                ${types.map((t) => `<li>${t}</li>`).join("")}
              </ul>
            </td>
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
      `,
    };
  }
}
