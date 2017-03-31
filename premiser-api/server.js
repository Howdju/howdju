const debug = require('debug')('app:server')
const express = require('express')
const morgan = require('morgan')
const path = require('path')

const handler = require('./src/index').handler

const app = express()

app.use(morgan('dev'))

app.use('/api/*', function (req, res) {

  const event = {
    headers: {
      origin: 'http://localhost:3000',
    },
    pathParameters: {
      proxy: req.baseUrl.substring('/api/'.length)
    },
    httpMethod: req.method,
    queryStringParameters: req.query
  }

  const context = {}

  const callback = (error, response) => {
    if (error) throw error

    debugger
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
