import webpack, { WebpackPluginInstance } from 'webpack'
import { merge } from 'webpack-merge'
import Debug from 'debug'
import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { DuplicatesPlugin } from "inspectpack/plugin"
import MomentLocalesPlugin from 'moment-locales-webpack-plugin'
import type {Response} from 'webpack-dev-server'

import { devWebServerPort, gitShaShort } from 'howdju-ops'
import packageInfo from '../package.json'
import projectConfig from './project.config'
import { sassLoaderAdditionalData } from './sass-loader-additional-data'

const debug = Debug('howdju-ui:webpack')

const envWebpackPath = `./webpack.${process.env.NODE_ENV}.config.ts`
debug(`Loading env webpack from ${envWebpackPath}`)
import {
  envHtmlWebpackPluginConfig,
  envDefinePluginConfig,
  envWebpackConfig,
} from './webpack.env.config'

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
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  'process.env.SENTRY_ENV': JSON.stringify(process.env.SENTRY_ENV),
  'process.env.PACKAGE_VERSION': JSON.stringify(packageInfo.version),
  'process.env.GIT_COMMIT_HASH_SHORT': JSON.stringify(gitShaShort()),
}, envDefinePluginConfig as Record<string, string>)

const OUTPUT_PUBLIC_PATH = '/'

const plugins: WebpackPluginInstance[] = [
  new HtmlWebpackPlugin(htmlWebpackPluginConfig),
  new webpack.DefinePlugin(definePluginConfig),
  new MiniCssExtractPlugin(),
  new MomentLocalesPlugin({localesToKeep: ['en']}),
]
// Adding webpack-bundle-analyzer seems to take over the whole build, only showing
// the analysis. So only add it when requested.
if (process.env.BUNDLE_ANALYZER) {
  plugins.push(new BundleAnalyzerPlugin() as unknown as WebpackPluginInstance)
}
// This plugin adds a full-page overlay over the web app that reappears
// on every hot refresh, and so is very annoying. Only enable it on purpose.
if (process.env.CHECK_DUPLICATES) {
  plugins.push(new DuplicatesPlugin({emitErrors: false}))
}

const baseWebpackConfig = {
  entry: [projectConfig.paths.src('main.js')],
  output: {
    filename: projectConfig.names.js,
    path: projectConfig.paths.dist(),
    clean: true,
    publicPath: OUTPUT_PUBLIC_PATH,
  },
  resolve: {
    alias: {
      // Support project-relative imports
      '@': path.resolve(__dirname, '../src/'),
    },
  },
  devServer: {
    bonjour: true,
    compress: true,
    // hot: true,
    // Behave like an SPA, serving index.html for paths that don't match files
    historyApiFallback: true,
    open: {
      app: {
        name: 'Google Chrome',
      },
    },
    port: devWebServerPort(),
    static: [
      {
        directory: 'public',
        staticOptions: {
          setHeaders: (res: Response, path: string, _stat: unknown) => {
            console.log(`public path: ${path}`)
            // In development, the static resources should be accessible from localhost, 127.0.0.1, or any other
            // local address, even though we bind to 0.0.0.0.
            res.set('Access-Control-Allow-Origin', '*')
          },
        },
      }, {
        directory: 'dist/bookmarklet',
        staticOptions: {
          setHeaders: (res: Response, path: string, _stat: unknown) => {
            console.log(`bookmarklet path: ${path}`)
            if (path.endsWith('.js')) {
              res.set('Content-Type', 'application/javascript')
            }
          },
        },
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.m?(j|t)sx?$/,
        exclude: /node_modules/,
        resolve: {
          extensions: ['.jsx', '.tsx', '.ts', '...'],
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
        test: /node_modules\/@grrr\/(cookie-consent|utils)/,
        resolve: {
          fullySpecified: false,  // Allow cookie-consent's modules to import files without their extension
          // Support ES module extensions when resolving the file corresponding to an extensionless package
          // because cookie-consent uses .mjs
          extensions: ['.mjs', '...'],
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
            },
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
          "markdown-loader",
        ],
      },
    ],
  },
  plugins,
}

type BaseWebPackConfigOverrides = Partial<typeof baseWebpackConfig>
export default merge(baseWebpackConfig, envWebpackConfig as BaseWebPackConfigOverrides)
