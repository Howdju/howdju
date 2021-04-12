const debug = require('debug')('howdju-ui:webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const {merge} = require('webpack-merge')

const {
  devWebServerPort,
} = require('./util')
const {
  gitShaShort,
  packageVersion,
} = require('../util')
const projectConfig = require('./project.config')
const {sassLoaderConfig} = require('./sass-loader-config')

const envWebpackPath = `./webpack.${process.env.NODE_ENV}.config.js`
debug(`Loading env webpack from ${envWebpackPath}`)
const {
  htmlWebpackPluginConfig: envHtmlWebpackPluginConfig,
  definePluginConfig: envDefinePluginConfig,
  webpackConfig: envWebpackConfig,
} = require(envWebpackPath)

const htmlWebpackPluginConfig = merge({
  appMountId: 'root',
  environment: process.env.NODE_ENV,
  filename: projectConfig.names.indexHtml,
  hash: false,
  inject: false, // The template injects scripts
  minify: {
    collapseWhitespace: true,
    conservativeCollapse: true,
  },
  mobile: true,
  title: 'Howdju',
  template: projectConfig.paths.src(projectConfig.names.indexHtml),
}, envHtmlWebpackPluginConfig)

const definePluginConfig = merge({
  'process.env.SENTRY_ENV': JSON.stringify(process.env.SENTRY_ENV),
  'process.env.PACKAGE_VERSION': JSON.stringify(packageVersion()),
  'process.env.GIT_COMMIT_HASH_SHORT': JSON.stringify(gitShaShort()),
}, envDefinePluginConfig)

const OUTPUT_PUBLIC_PATH = '/'

const baseWebpackConfig = {
  entry: [projectConfig.paths.src('main.js')],
  output: {
    filename: projectConfig.names.js,
    path: projectConfig.paths.dist(),
    clean: true,
    publicPath: OUTPUT_PUBLIC_PATH,
  },
  devServer: {
    compress: true,
    contentBase: projectConfig.paths.src(),
    hot: true,
    // Behave like an SPA, serving index.html for paths that don't match files
    historyApiFallback: true,
    open: 'Google Chrome',
    port: devWebServerPort(),
    publicPath: OUTPUT_PUBLIC_PATH,
    stats: {
      // chunks: false,
      // chunkModules: false,
      colors: true
    },
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
            presets: ["./babelPreset"],
          },
        },
        exclude: /node_modules\/(?!howdju-common)/,
      },
      {
        test: /\.(scss|sass|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'resolve-url-loader',
          'sass-loader',
          // This causes error when deploying to production if it isn't like the first option
          sassLoaderConfig,
        ],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'url-loader?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'file-loader',
      },
      {
        test: /\.md$/,
        use: [
          "html-loader",
          "markdown-loader"
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin(htmlWebpackPluginConfig),
    new webpack.DefinePlugin(definePluginConfig),
    new MiniCssExtractPlugin(),
  ],
}

module.exports = merge(baseWebpackConfig, envWebpackConfig)
