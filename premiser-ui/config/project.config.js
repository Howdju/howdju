const path = require('path')
const merge = require('webpack-merge')


const basePath = path.resolve(__dirname, '..')

const baseConfig = {
  port: 3000,
  paths: {
    base: path.resolve.bind(path, basePath),
    public: path.resolve.bind(path, basePath, 'public'),
    src: path.resolve.bind(path, basePath, 'src'),
    dist: path.resolve.bind(path, basePath, 'dist')
  },
}

const envConfig = require(`./project.${process.env.NODE_ENV}.config.js`)

module.exports = merge(baseConfig, envConfig)