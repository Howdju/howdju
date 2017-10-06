const debug = require('debug')('premiser-ui:server')
const express = require('express')
const morgan = require('morgan')
const webpack = require('webpack')

const projectConfig = require('./config/project.config')
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
if (process.env.NODE_ENV === 'production') {
  // I think the dev middleware intercepts requests for premiser-ui.js
  // When testing out the prod build, we need express to serve that file
  app.use(express.static('dist'))
}

// Handle the bookmarklet (See bookmarklet/README.md)
app.use(express.static('dist/bookmarklet'))

app.use(express.static('public', {
  // http://expressjs.com/en/api.html#setHeaders
  setHeaders: function setHeaders(res, path, stat) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
  }
}))

app.use('*', function (req, res) {
  res.sendFile(projectConfig.paths.dist(projectConfig.names.indexHtml))
})

module.exports = app
