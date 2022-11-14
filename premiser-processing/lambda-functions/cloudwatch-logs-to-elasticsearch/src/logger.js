const { AwsLogger } = require("howdju-service-common");

const logLevel = process.env["LOG_LEVEL"] || "warn";
const isAws = !!process.env["IS_AWS"] || false;
const doLogTimestamp = true;
const doUseCarriageReturns = isAws;
const logFormat = isAws ? "json" : "text";

module.exports = new AwsLogger(console, {
  logLevel,
  doLogTimestamp,
  doUseCarriageReturns,
  logFormat,
});
