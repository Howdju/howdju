const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const merge = require('webpack-merge')
const assign = require('lodash/assign')

const {
  gitShortSha,
  nodePackageVersion,
} = require('./util')
const projectConfig = require('./project.config')

const {
  htmlWebpackPluginConfig: envHtmlWebpackPluginConfig,
  definePluginConfig: envDefinePluginConfig,
  webpackConfig: envWebpackConfig,
  sassLoaderData: envSassLoaderData,
  sassLoaderFunctions: envSassLoaderFunctions,
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

const sassLoaderFunctions = assign({}, envSassLoaderFunctions)

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
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // These are necessary for compiling npm-linked libraries
            presets: [
              ["es2015", { "modules": false }],
              "stage-0",
              "react",
            ]
          },
        },
        // TAG: NEW_LIB
        exclude: /node_modules\/(?!howdju-common)/,
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader?sourceMap",
          "resolve-url-loader",
          // This causes error when deploying to production if it isn't like the first option
          process.env.NODE_ENV !== 'development' ?
            "sass-loader?sourceMap" :
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
                data: envSassLoaderData,
                functions: sassLoaderFunctions,
              }
            },
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
