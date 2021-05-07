const assign = require('lodash/assign')
const Promise = require('bluebird')

const AWS = require('aws-sdk')

exports.init = function init(provider) {
  AWS.config.update({region: provider.getConfigVal('DEFAULT_AWS_REGION')})
  AWS.config.setPromisesDependency(Promise)

  const endpoint = provider.getConfigVal('AWS_SES_ENDPOINT')

  const sesOptions = {
    apiVersion: '2010-12-01',
  }
  if (endpoint) {
    sesOptions['endpoint'] = endpoint
  }
  const ses = new AWS.SES(sesOptions)

  const sesv2Options = {
    apiVersion: '2019-09-27',
  }
  if (endpoint) {
    sesv2Options['endpoint'] = endpoint
  }
  const sesv2 = new AWS.SESV2(sesv2Options)

  assign(provider, {
    ses,
    sesv2,
  })

  provider.logger.debug('awsInit complete')
}
