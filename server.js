const debug = require('debug')('app:server')
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const projectConfig = require('./config/project.config')
const webpack = require('webpack')
const webpackConfig = require('./config/webpack.config')


const app = express()

app.use(morgan('dev'))

const compiler = webpack(webpackConfig)
debug('Enabling webpack dev and HMR middleware')
app.use(require('webpack-dev-middleware')(compiler, {
  publicPath  : webpackConfig.output.publicPath,
  contentBase : projectConfig.paths.src(),
  hot         : true,
  // quiet       : project.compilerQuiet,
  // noInfo      : project.compilerQuiet,
  lazy        : false,
  stats       : projectConfig.compilerStats
}))
app.use(require('webpack-hot-middleware')(compiler, {
  path: '/__webpack_hmr'
}))

app.use(express.static(projectConfig.paths.public()))
app.use(express.static(projectConfig.paths.dist()))
app.use('*', function (req, res) {
  res.sendfile('./src/index.html')
})

module.exports = app
