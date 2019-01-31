const assign = require('lodash/assign')

const AWS = require('aws-sdk')

exports.init = function init(provider) {
  AWS.config.update({region: provider.getConfigVal('AWS_SES_REGION')})
  const ses = new AWS.SES({apiVersion: '2010-12-01'})
  assign(provider, {
    ses
  })
}
