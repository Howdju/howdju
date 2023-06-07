import { devWebServerPort, getUiHost } from "howdju-ops";

/** Extract out the sass-loader config because webpack.production.config.ts requires it for ExtractTextPlugin */

const host = getUiHost();
const port = devWebServerPort();

const devSassLoaderData =
  `$dev-font-url-material-icons: url(http://${host}:${port}/fonts/Material-Icons.woff2);` +
  `$dev-font-url-lato-light-latin-ext: url(http://${host}:${port}/fonts/Lato-Light_LatinExt.woff2);` +
  `$dev-font-url-lato-light-latin: url(http://${host}:${port}/fonts/Lato-Light_Latin.woff2);` +
  `$dev-font-url-lato-regular-latin-ext: url(http://${host}:${port}/fonts/Lato-Regular_LatinExt.woff2);` +
  `$dev-font-url-lato-regular-latin: url(http://${host}:${port}/fonts/Lato-Regular_Latin.woff2);` +
  `$dev-font-url-orbitron-regular-latin: url(http://${host}:${port}/fonts/Orbitron-Regular_Latin.woff2);` +
  `$dev-font-url-oswald-extra-light-latin-ext: url(http://${host}:${port}/fonts/Oswald-ExtraLight_LatinExt.woff2);` +
  `$dev-font-url-oswald-extra-light-latin: url(http://${host}:${port}/fonts/Oswald-ExtraLight_Latin.woff2);`;

const fontServerAuthority =
  process.env.NODE_ENV === "development"
    ? `http://${host}:${port}`
    : "https://cdn.howdju.com";
const sassLoaderData =
  `$font-url-bebas-neue-thin: url(${fontServerAuthority}/fonts/BebasNeue-Thin.otf);` +
  `$font-url-bebas-neue-light: url(${fontServerAuthority}/fonts/BebasNeue-Light.otf);` +
  `$font-url-bebas-neue-book: url(${fontServerAuthority}/fonts/BebasNeue-Book.otf);` +
  `$font-url-bebas-neue-regular: url(${fontServerAuthority}/fonts/BebasNeue-Regular.otf);` +
  `$font-url-bebas-neue-bold: url(${fontServerAuthority}/fonts/BebasNeue-Bold.otf);`;

export const sassLoaderAdditionalData =
  process.env.NODE_ENV === "development"
    ? sassLoaderData + devSassLoaderData
    : sassLoaderData;
