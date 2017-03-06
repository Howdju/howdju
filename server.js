const express = require('express')
const morgan = require('morgan')
const path = require('path')
const project = require('./config/project.config')


const app = express()

app.use(morgan('dev'))
app.use(express.static(project.paths.public()))
app.use(express.static(project.paths.dist()))
app.use('*', function (req, res) {
  res.sendfile('./src/index.html')
})

module.exports = app
