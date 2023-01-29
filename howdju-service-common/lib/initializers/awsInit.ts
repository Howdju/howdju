import AWS from "aws-sdk";

import { FakeTopicMessageSender } from "howdju-test-common";
import { AwsTopicMessageSender } from "..";

import { LoggerProvider } from "./loggerInit";
import { ValidatorsProvider } from "./validatorsInit";

export type AwsProvider = ReturnType<typeof awsInit> & ValidatorsProvider;

export function awsInit(provider: LoggerProvider) {
  AWS.config.update({ region: provider.getConfigVal("DEFAULT_AWS_REGION") });
  AWS.config.setPromisesDependency(Promise);

  const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
  const topicMessageSender = makeTopicMessageSender(provider, sns);

  provider.logger.debug("awsInit complete");

  return {
    sns,
    topicMessageSender,
  };
}

function makeTopicMessageSender(provider: LoggerProvider, sns: AWS.SNS) {
  if (["development", "test"].indexOf(process.env.NODE_ENV || "") > -1) {
    return new FakeTopicMessageSender();
  }
  const topicArn = provider.getConfigVal("MESSAGES_TOPIC_ARN");
  if (!topicArn) {
    throw new Error("MESSAGES_TOPIC_ARN env var must be present in prod.");
  }
  return new AwsTopicMessageSender(provider.logger, sns, topicArn);
}
