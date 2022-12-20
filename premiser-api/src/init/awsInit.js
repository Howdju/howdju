const assign = require("lodash/assign");
const Promise = require("bluebird");

const AWS = require("aws-sdk");
const { AwsTopicMessageSender } = require("howdju-service-common");
const { FakeTopicMessageSender } = require("howdju-test-common");

exports.init = function init(provider) {
  AWS.config.update({ region: provider.getConfigVal("DEFAULT_AWS_REGION") });
  AWS.config.setPromisesDependency(Promise);

  const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

  const topicMessageSender =
    ["development", "test"].indexOf(process.env.NODE_ENV) > -1
      ? new FakeTopicMessageSender()
      : new AwsTopicMessageSender(
          provider.logger,
          sns,
          provider.getConfigVal("MESSAGES_TOPIC_ARN")
        );
  assign(provider, {
    sns,
    topicMessageSender,
  });

  provider.logger.debug("awsInit complete");
};
