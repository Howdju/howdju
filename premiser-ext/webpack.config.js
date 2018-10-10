/*global require module __dirname*/

const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    background: path.join(__dirname, './src/background'),
    content: path.join(__dirname, './src/content'),
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].js',
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/manifest.json' },
      { from: 'images/**/*' },
      { from: 'src/*.css', flatten: true }
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
        presets: ['react', 'es2015', 'stage-0']
      },
      exclude: /node_modules/
    }]
  }
}
