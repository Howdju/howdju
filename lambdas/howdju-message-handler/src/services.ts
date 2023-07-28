import AWS from "aws-sdk";

import { Logger } from "howdju-common";
import { AwsLogger, EmailService } from "howdju-service-common";

const logLevel = process.env.LOG_LEVEL || "info";
const doLogTimestamp = true;
const doUseCarriageReturns = true;
const logFormat = "json";
export const logger: Logger = new AwsLogger(console, {
  logLevel,
  doLogTimestamp,
  doUseCarriageReturns,
  logFormat,
}) as unknown as Logger;

AWS.config.update({ region: process.env.DEFAULT_AWS_REGION });
const sesv2 = new AWS.SESV2({ apiVersion: "2019-09-27" });
export const emailService = new EmailService(logger, sesv2);
