/* globals require */
import config from './config'
if (config.isDev) {
  require("style-loader!./_fonts.development.scss")
} else {
  require("style-loader!./_fonts.production.scss")
}
