import './_fonts.scss'

if (process.env.NODE_ENV === 'development') {
  require("style-loader!./_fonts.development.scss");
} else {
  require("style-loader!./_fonts.production.scss");
}
