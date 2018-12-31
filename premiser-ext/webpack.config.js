/*global require module __dirname*/

const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    background: path.join(__dirname, './src/background'),
    content: path.join(__dirname, './src/content'),
    'options-ui': path.join(__dirname, './src/options-ui'),
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].js',
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/manifest.json' },
      { from: 'icons/**/*' },
      { from: 'src/*.css', flatten: true },
      { from: 'src/*.html', flatten: true }
    ]),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],
  resolve: {
    extensions: ['.js']
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      query: {
        presets: [
          ["env", { "modules": false }],
          "stage-0",
          "react",
        ]
      },
      exclude: /node_modules/
    }]
  }
}
