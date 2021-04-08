/* globals require process */
if (process.env.NODE_ENV === 'development') {
  require("./_fonts.development.scss")
} else {
  require("./_fonts.production.scss")
}
