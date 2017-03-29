process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

const {routeEvent} = require('./route')

exports.handler = (event, context, callback) => {
  try {
    routeEvent({
      path: event.pathParameters.proxy,
      method: event.httpMethod,
      queryStringParameters: event.queryStringParameters
    }, callback);
  } catch(error) {
    console.error('Received event:', JSON.stringify(event, null, 2))
    console.error('Received context:', JSON.stringify(context, null, 2))
    callback(error)
  }
}
