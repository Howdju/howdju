const debug = require('debug')('premiser-ui:server')
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const projectConfig = require('./config/project.config')
const webpack = require('webpack')
const webpackConfig = require('./config/webpack.config')

const app = express()

app.use(morgan('dev'))

if (process.env.NODE_ENV === 'development') {
  const compiler = webpack(webpackConfig)
  debug('Enabling webpack dev and HMR middleware')

  // https://github.com/webpack/webpack-dev-middleware#usage
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
}

app.use(express.static('public'))

app.use('*', function (req, res) {
  res.sendFile(projectConfig.paths.dist(projectConfig.names.indexHtml))
})

module.exports = app
