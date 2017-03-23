const fs = require('fs-extra')
const webpack = require('webpack')
const debug = require('debug')('app:bin:build')
const webpackConfig = require('../config/webpack.config')
const projectConfig = require('../config/project.config')

// Wrapper around webpack to promisify its compiler and supply friendly logging
const compileToStats = (webpackConfig) =>
    new Promise((resolve, reject) => {
      const compiler = webpack(webpackConfig)

      compiler.run((err, stats) => {
        if (err) {
          debug('Webpack compiler encountered a fatal error.', err)
          return reject(err)
        }

        const jsonStats = stats.toJson()
        debug('Webpack build completed.')
        debug(stats.toString(projectConfig.compilerStats))

        if (jsonStats.errors.length > 0) {
          debug('Webpack compiler encountered errors.')
          debug(jsonStats.errors.join('\n'))
          return reject(new Error('Webpack compiler encountered errors'))
        } else if (jsonStats.warnings.length > 0) {
          debug('Webpack compiler encountered warnings.')
          debug(jsonStats.warnings.join('\n'))
        } else {
          debug('No errors or warnings encountered.')
        }
        resolve(jsonStats)
      })
    })

const build = () => {
  debug('Starting build.')
  return Promise.resolve()
      .then(() => compileToStats(webpackConfig))
      .then(stats => {
        if (stats.warnings.length && projectConfig.buildFailOnWarning) {
          throw new Error('Config set to fail on warning, exiting with status code "1".')
        }
        debug('Copying static assets to dist folder.')
        fs.copySync(projectConfig.paths.public(), projectConfig.paths.dist())
      })
      .then(() => {
        debug('Build completed successfully.')
      })
      .catch((err) => {
        debug('Build encountered an error.', err)
        process.exit(1)
      })
}

build()
