const webpack = require('webpack')

const projectConfig = require('./project.config')

module.exports.htmlWebpackPluginConfig = {
  minify: {
    preserveLineBreaks: true,
  },
  smallChat: true,
  sentry: true,
  googleAnalytics: {
    trackingId: 'UA-104314283-2',
  },
  heapAnalytics: {
    trackingId: '4008854211',
  },
  mixpanel: {
    trackingId: 'abd1abe616789b11f1ef46bd254ec937',
  }
}

module.exports.definePluginConfig = {
  'process.env.API_ROOT': JSON.stringify('http://localhost:8081/api/'),
  'process.env.DO_ASSERT': JSON.stringify('true'),
}

module.exports.webpackConfig = {
  entry: [
    'react-hot-loader/patch',
    `webpack-hot-middleware/client?path=${projectConfig.compilerPublicPath}__webpack_hmr`,
    'webpack/hot/only-dev-server',
    projectConfig.paths.src('main.js')
  ],
  devtool: 'eval-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
}