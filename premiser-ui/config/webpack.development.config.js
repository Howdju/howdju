const webpack = require('webpack')
const {
  hostAddress,
  devApiServerPort,
  devWebServerPort,
} = require('./util')

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

const apiRoot = process.env.API_ROOT || `http://${hostAddress()}:${devApiServerPort()}/api/`
module.exports.definePluginConfig = {
  'process.env.API_ROOT': JSON.stringify(apiRoot),
  'process.env.DO_ASSERT': JSON.stringify('true'),
}

module.exports.sassLoaderData =
  `$dev-font-url-material-icons: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Material-Icons.woff2);` +
  `$dev-font-url-lato-light-latin-ext: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Lato-Light_LatinExt.woff2);` +
  `$dev-font-url-lato-light-latin: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Lato-Light_Latin.woff2);` +
  `$dev-font-url-lato-regular-latin-ext: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Lato-Regular_LatinExt.woff2);` +
  `$dev-font-url-lato-regular-latin: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Lato-Regular_Latin.woff2);` +
  `$dev-font-url-orbitron-regular-latin: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Orbitron-Regular_Latin.woff2);`

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
