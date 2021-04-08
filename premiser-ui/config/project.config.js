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
const {merge} = require('webpack-merge')
const {
  hostAddress,
} = require("./util")

const basePath = path.resolve(__dirname, '..')

const baseConfig = {
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
    cacheDuration: 'P10M',
  }
}

const envConfig = require(`./project.${process.env.NODE_ENV}.config.js`)


module.exports = merge(baseConfig, envConfig)
