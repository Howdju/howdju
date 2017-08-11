const {
  gitShortSha,
  nodePackageVersion,
  hostAddress,
  devWebServerPort,
} = require('./util')

// const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const merge = require('webpack-merge')

const projectConfig = require('./project.config')

const {
  htmlWebpackPluginConfig: envHtmlWebpackPluginConfig,
  definePluginConfig: envDefinePluginConfig,
  webpackConfig: envWebpackConfig,
} = require(`./webpack.${process.env.NODE_ENV}.config.js`)

const htmlWebpackPluginConfig = merge({
  appMountId: 'root',
  environment: process.env.NODE_ENV,
  filename: projectConfig.names.indexHtml,
  gitCommit: gitShortSha(),
  hash: false,
  inject: false, // The template injects scripts
  minify: {
    collapseWhitespace: true,
    conservativeCollapse: true,
  },
  mobile: true,
  title: 'Howdju',
  template: projectConfig.paths.src(projectConfig.names.indexHtml),
  version: nodePackageVersion(),
}, envHtmlWebpackPluginConfig)

const definePluginConfig = merge({
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
}, envDefinePluginConfig)

const baseWebpackConfig = {
  output: {
    filename: projectConfig.names.js,
    path: projectConfig.paths.dist(),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude : /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          }
        },
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader?sourceMap",
          "resolve-url-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              // http://$DEV-ASSETS-SERVER-HOST:$DEV-ASSETS-SERVER-PORT/fonts/Material-Design.woff2
              data: `$dev-material-design-font-url: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Material-Design.woff2);`,
            }
          },
          // 'sass-loader?sourceMap',
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              // minimize: false,
              sourceMap: true,
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
              sourceComments: true,
            }
          },
        ],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'url-loader?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'file-loader',
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin(htmlWebpackPluginConfig),
    new webpack.DefinePlugin(definePluginConfig),
    // TODO how to CDN this in production?
    // this isn't necessary for development as webpack dev middleware can serve this directly from source
    // new CopyWebpackPlugin([
    //   { from: projectConfig.paths.public('*.ico') },
    //   { from: projectConfig.paths.public('*.png') },
    //   { from: projectConfig.paths.public('browserconfig.xml'), to: projectConfig.paths.dist('public') },
    //   { from: projectConfig.paths.public('manifest.json'), to: projectConfig.paths.dist('public') },
    //   { from: projectConfig.paths.public('safari-pinned-tab.svg'), to: projectConfig.paths.dist('public') },
    // ]),
  ],
  // https://webpack.github.io/docs/configuration.html#resolve-alias
  // resolve: {
  //   alias: {
  //     'react': path.resolve('./node_modules/react'),
  //   }
  // }
}

module.exports = merge.smart(baseWebpackConfig, envWebpackConfig)
