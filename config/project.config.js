const path = require('path')


const basePath = path.resolve(__dirname, '..')

const config = {
  port: 3000,
  paths: {
    base: path.resolve.bind(path, basePath),
    public: path.resolve.bind(path, basePath, 'public'),
    src: path.resolve.bind(path, basePath, 'src'),
    dist: path.resolve.bind(path, basePath, 'dist')
  },
  buildFailOnWarning: false,
  compilerStats: {
    chunks: false,
    chunkModules: false,
    colors: true
  }
}

module.exports = config
