const {
  hostAddress,
  devWebServerPort,
} = require('./util')


/** Extract out the sass-loader config because webpack.production.config.js requires it for ExtractTextPlugin */

const devSassLoaderData =
  `$dev-font-url-material-icons: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Material-Icons.woff2);` +
  `$dev-font-url-lato-light-latin-ext: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Lato-Light_LatinExt.woff2);` +
  `$dev-font-url-lato-light-latin: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Lato-Light_Latin.woff2);` +
  `$dev-font-url-lato-regular-latin-ext: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Lato-Regular_LatinExt.woff2);` +
  `$dev-font-url-lato-regular-latin: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Lato-Regular_Latin.woff2);` +
  `$dev-font-url-orbitron-regular-latin: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Orbitron-Regular_Latin.woff2);` +
  `$dev-font-url-oswald-extra-light-latin-ext: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Oswald-ExtraLight_LatinExt.woff2);` +
  `$dev-font-url-oswald-extra-light-latin: url(http://${hostAddress()}:${devWebServerPort()}/fonts/Oswald-ExtraLight_Latin.woff2);`

const fontServerAuthority = process.env.NODE_ENV === 'development' ?
  `http://${hostAddress()}:${devWebServerPort()}` :
  'https://cdn.howdju.com'
const sassLoaderData =
  `$font-url-bebas-neue-thin: url(${fontServerAuthority}/fonts/BebasNeue-Thin.otf);` +
  `$font-url-bebas-neue-light: url(${fontServerAuthority}/fonts/BebasNeue-Light.otf);` +
  `$font-url-bebas-neue-book: url(${fontServerAuthority}/fonts/BebasNeue-Book.otf);` +
  `$font-url-bebas-neue-regular: url(${fontServerAuthority}/fonts/BebasNeue-Regular.otf);` +
  `$font-url-bebas-neue-bold: url(${fontServerAuthority}/fonts/BebasNeue-Bold.otf);`

exports.sassLoaderConfig = process.env.NODE_ENV !== 'development' ?
  {
    loader: "sass-loader",
    options: {
      sourceMap: true,
      data: sassLoaderData,
    }
  } :
  {
    loader: "sass-loader",
    options: {
      sourceMap: true,
      data: sassLoaderData + devSassLoaderData,
    }
  }
