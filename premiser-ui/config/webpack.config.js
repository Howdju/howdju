const debug = require('debug')('howdju-ui:webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const {merge} = require('webpack-merge')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const { DuplicatesPlugin } = require("inspectpack/plugin")
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')

const {
  devWebServerPort,
  gitShaShort,
} = require('howdju-ops')
const packageInfo = require('../package.json')
const projectConfig = require('./project.config')
const {sassLoaderAdditionalData} = require('./sass-loader-additional-data')

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
  'process.env.PACKAGE_VERSION': JSON.stringify(packageInfo.version),
  'process.env.GIT_COMMIT_HASH_SHORT': JSON.stringify(gitShaShort()),
}, envDefinePluginConfig)

const OUTPUT_PUBLIC_PATH = '/'

const plugins = [
  new HtmlWebpackPlugin(htmlWebpackPluginConfig),
  new webpack.DefinePlugin(definePluginConfig),
  new MiniCssExtractPlugin(),
  new DuplicatesPlugin({emitErrors: false}),
  new MomentLocalesPlugin({localesToKeep: ['en']})
]
// Adding webpack-bundle-analyzer seems to take over the whole build, only showing
// the analysis. So only add it when requested.
if (process.env.BUNDLE_ANALYZER) {
  plugins.push(new BundleAnalyzerPlugin())
}

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
    // hot: true,
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
        test: /\.m?jsx?$/,
        resolve: {
          fullySpecified: false,  // Allow cookie-consent's modules to import files without their extension
          // Support ES module and JSX extensions when resolving the file corresponding to an extensionless package
          // cookie-consent uses .mjs; we don't use .jsx, but we could, and we should probably include it since our
          // test pattern includes it.
          extensions: ['.mjs', '.jsx', '...'],
        },
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            rootMode: "upward",
          },
        },
      },
      {
        test: /\.(scss|sass|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'resolve-url-loader',
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              additionalData: sassLoaderAdditionalData,
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
  plugins
}

module.exports = merge(baseWebpackConfig, envWebpackConfig)
