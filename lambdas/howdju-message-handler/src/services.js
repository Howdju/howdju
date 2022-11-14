import Promise from "bluebird";
import AWS from "aws-sdk";

import { AwsLogger, EmailService } from "howdju-service-common";

const logLevel = process.env.LOG_LEVEL || "info";
const doLogTimestamp = true;
const doUseCarriageReturns = true;
const logFormat = "json";
export const logger = new AwsLogger(console, {
  logLevel,
  doLogTimestamp,
  doUseCarriageReturns,
  logFormat,
});

AWS.config.update({ region: process.env.DEFAULT_AWS_REGION });
AWS.config.setPromisesDependency(Promise);
const sesv2 = new AWS.SESV2({ apiVersion: "2019-09-27" });
export const emailService = new EmailService(logger, sesv2);
