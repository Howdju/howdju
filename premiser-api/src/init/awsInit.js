const assign = require("lodash/assign");
const Promise = require("bluebird");

const AWS = require("aws-sdk");

exports.init = function init(provider) {
  AWS.config.update({ region: provider.getConfigVal("DEFAULT_AWS_REGION") });
  AWS.config.setPromisesDependency(Promise);

  const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

  assign(provider, {
    sns,
  });

  provider.logger.debug("awsInit complete");
};
