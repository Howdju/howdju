/**
 * * modes:
 *   - local (localhost, doesn't need network)
 *   - internal (uses internal IP.  Allows mobile testing)
 *   - development (CD environment.  Initial testing.  Can break)
 *   - candidate (pre-release testing.  Load testing)
 *   - production
 * stages
 *   - local/internal
 *   - dev
 *   - candi
 *   - prod
 */

const path = require('path')
const merge = require('webpack-merge')
const {
  hostAddress,
  devWebServerPort,
} = require("./util")

const basePath = path.resolve(__dirname, '..')

const baseConfig = {
  devWebServerPort: devWebServerPort(),
  hostAddress: hostAddress(),
  names: {
    js: 'premiser-ui.js',
    indexHtml: 'index.html',
  },
  paths: {
    base: path.resolve.bind(path, basePath),
    public: path.resolve.bind(path, basePath, 'public'),
    src: path.resolve.bind(path, basePath, 'src'),
    dist: path.resolve.bind(path, basePath, 'dist')
  },
  aws: {
    profile: 'premiser',
    region: 'us-east-1',
    bucket: 'www.howdju.com',
    // bucket: 'www.premiser.co',
    cacheDuration: 'P10M',
    // s3Domain: 'www.howdju.com.s3-website-us-east-1.amazonaws.com',
    // s3Domain: 'www.premiser.co,.s3-website-us-east-1.amazonaws.com',

    // howdju.com
    distributionId: 'E3ALDHFXYJRKKJ',
    //premiser.co
    // distributionId: 'E1MVR22QSL38AV',

    // howdju
    // cloudfrontDomain: 'd1fcdpsoaaf9i6.cloudfront.net',
    // premiser
    // cloudfrontDomain: 'd15uu6icvq1y8z.cloudfront.net',
  }
}

const envConfig = require(`./project.${process.env.NODE_ENV}.config.js`)


module.exports = merge(baseConfig, envConfig)