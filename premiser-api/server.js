const bodyParser = require('body-parser')
const debug = require('debug')('app:server')
const express = require('express')
const morgan = require('morgan')
const path = require('path')

const handler = require('./src/index').handler
const {logger} = require('./src/logger')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(morgan('dev'))

app.use('/api/*', function (req, res) {

  const event = {
    headers: req.headers,
    pathParameters: {
      proxy: req.baseUrl.substring('/api/'.length)
    },
    httpMethod: req.method,
    queryStringParameters: req.query,
    body: req.body,
  }

  const context = {}

  const callback = (error, response) => {
    if (error) {
      logger.error(error)
      res.status(500)
      res.send(error)
      return
    }

    const {statusCode, headers, body} = response
    if (headers) {
      for (let header of Object.getOwnPropertyNames(headers)) {
        res.setHeader(header, headers[header])
      }
    }
    res.status(statusCode)
    res.send(body)
  }

  handler(event, context, callback)
})

module.exports = app
