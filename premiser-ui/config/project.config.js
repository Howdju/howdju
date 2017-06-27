const path = require('path')
const merge = require('webpack-merge')


const basePath = path.resolve(__dirname, '..')

const baseConfig = {
  port: 3000,
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
    bucket: 'www.premiser.co',
    cacheDuration: 'P10M',
    s3Domain: 'www.premiser.co.s3-website-us-east-1.amazonaws.com',
    distributionId: 'E1MVR22QSL38AV',
    cloudfrontDomain: 'd15uu6icvq1y8z.cloudfront.net',
  }
}

const envConfig = require(`./project.${process.env.NODE_ENV}.config.js`)

module.exports = merge(baseConfig, envConfig)