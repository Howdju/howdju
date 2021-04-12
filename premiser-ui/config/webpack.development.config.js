const CopyPlugin = require("copy-webpack-plugin")
const {
  hostAddress,
  devApiServerPort,
} = require('./util')

module.exports.htmlWebpackPluginConfig = {
  minify: {
    preserveLineBreaks: true,
  },
  smallChat: true,
  sentry: false,
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

module.exports.webpackConfig = {
  mode: 'development',
  // For an explanation of possible values, see: https://webpack.js.org/configuration/devtool/#development
  // 'cheap-module-source-map' is recommended for React development.  See: https://reactjs.org/docs/cross-origin-errors.html#source-maps
  devtool: 'cheap-module-source-map',
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' }
      ],
    }),
  ],
}
