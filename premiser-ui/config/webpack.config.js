const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const projectConfig = require('./project.config')

const config = {
  entry: [
      'react-hot-loader/patch',
      `webpack-hot-middleware/client?path=${projectConfig.compilerPublicPath}__webpack_hmr`,
      'webpack/hot/only-dev-server',
      projectConfig.paths.src('main.js')
    ],
  output: {
    filename: 'premiser-ui.js',
    path: projectConfig.paths.dist(),
    publicPath: '/',
  },
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude : /node_modules/,
        use: { loader: 'babel-loader' },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              // minimize: false,
              importLoaders: 1,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              autoprefixer: {
                add: true,
                remove: true,
                browsers: ['last 2 versions']
              },
              discardComments: {
                removeAll: true
              },
              discardUnused: false,
              mergeIdents: false,
              reduceIdents: false,
              safe: true,
              sourceMap: 'inline',
            }
          }
        ],
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      // https://github.com/jaketrent/html-webpack-template/blob/86f285d5c790a6c15263f5cc50fd666d51f974fd/index.html
      appMountId: 'root',
      template: projectConfig.paths.src('index.html'),
      hash: false,
      // favicon: projectConfig.paths.public('favicon.ico'),
      mobile: true,
      filename: 'index.html',
      inject: 'body',
      minify: {
        collapseWhitespace : true
      }
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //   compressor: {
    //     screw_ie8: true,
    //     warnings: false
    //   }
    // })
  ],
};

module.exports = config;
