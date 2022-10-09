
import {
  htmlWebpackPluginConfig as devHtmlWebpackPluginConfig,
  definePluginConfig as devDefinePluginConfig,
  webpackConfig as devWebpackConfig,
} from './webpack.development.config'
import {
  htmlWebpackPluginConfig as prodHtmlWebpackPluginConfig,
  definePluginConfig as prodDefinePluginConfig,
  webpackConfig as prodWebpackConfig,
} from './webpack.production.config'

export const envHtmlWebpackPluginConfig = process.env.NODE_ENV === 'development' ?
  devHtmlWebpackPluginConfig :
  prodHtmlWebpackPluginConfig
export const envDefinePluginConfig = process.env.NODE_ENV === 'development' ?
  devDefinePluginConfig :
  prodDefinePluginConfig
export const envWebpackConfig = process.env.NODE_ENV === 'development' ?
  devWebpackConfig :
  prodWebpackConfig
