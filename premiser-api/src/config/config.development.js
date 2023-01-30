const { devWebServerPort } = require("howdju-ops");

const corsAllowOrigin = [
  `http://localhost:${devWebServerPort()}`,
  `http://127.0.0.1:${devWebServerPort()}`,
];

module.exports = {
  contentReportNotificationEmails: ["dev-content-report-recipient@test.com"],
  corsAllowOrigin,
};
