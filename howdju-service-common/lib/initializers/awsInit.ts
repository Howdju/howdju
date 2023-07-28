import AWS from "aws-sdk";

import { LoggerProvider } from "./loggerInit";
import { ValidatorsProvider } from "./validatorsInit";

export type AwsProvider = ReturnType<typeof awsInit> & ValidatorsProvider;

export function awsInit(provider: LoggerProvider) {
  AWS.config.update({ region: provider.getConfigVal("DEFAULT_AWS_REGION") });

  const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

  provider.logger.debug("awsInit complete");

  return {
    sns,
  };
}
