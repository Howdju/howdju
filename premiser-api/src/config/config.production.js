module.exports = {
  contentReportNotificationEmails: [
    "carl@howdju.com",
    "carl.gieringer@gmail.com",
  ],
  corsAllowOrigin: [
    "http://www.howdju.com",
    "https://www.howdju.com",

    "http://pre-prod-www.howdju.com",
    "https://pre-prod-www.howdju.com",

    "http://www.howdju.com.s3-website-us-east-1.amazonaws.com",
    "http://pre-prod-www.howdju.com.s3-website-us-east-1.amazonaws.com",

    // www.howdju.com distribution
    "http://d1fcdpsoaaf9i6.cloudfront.net",
    "https://d1fcdpsoaaf9i6.cloudfront.net",
  ],
  authRefreshCookie: { isSecure: true },
};
