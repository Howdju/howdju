const webpack = require('webpack')
const sass = require('node-sass')
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

module.exports.definePluginConfig = {
  'process.env.API_ROOT': JSON.stringify(`http://${hostAddress()}:${devApiServerPort()}/api/`),
  'process.env.DO_ASSERT': JSON.stringify('true'),
}

// module.exports.sassLoaderData = `$dev-material-design-font-url: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Material-Design.woff2);`
module.exports.sassLoaderFunctions = {
  'local-font-url-string($font-name)': function(fontName) {
    return new sass.types.String(`http://${hostAddress()}:${devWebServerPort()}/fonts/${fontName}.woff2`)
  }
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
