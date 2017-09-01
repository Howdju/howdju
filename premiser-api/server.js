const express = require('express')
const morgan = require('morgan')
const isString = require('lodash/isString')

const {handler} = require('./src/index')
const {logger} = require('./src/initialization/loggerInitialization')


const app = express()

function rawBody(req, res, next) {
  req.setEncoding('utf8')
  req.rawBody = null
  req.on('data', function(chunk) {
    if (!isString(req.rawBody)) {
      req.rawBody = ''
    }
    req.rawBody += chunk
  })
  req.on('end', function(){
    next()
  })
}
app.use(rawBody)
app.use(morgan('dev'))

app.use('/api/*', function (req, res) {

  const event = {
    headers: req.headers,
    pathParameters: {
      proxy: req.baseUrl.substring('/api/'.length)
    },
    httpMethod: req.method,
    queryStringParameters: req.query,
    body: req.rawBody,
  }

  const context = {isLocal: true}

  const callback = (error, response) => {
    if (error) {
      logger.error(error)
      res.status(500)
      res.send(error)
      return
    }

    const {statusCode, headers, body} = response
    if (headers) {
      res.set(headers)
    }
    res.status(statusCode)
    res.send(body)
  }

  // Introduce artificial latency
  setTimeout(() => handler(event, context, callback), 500)
})

module.exports = app
