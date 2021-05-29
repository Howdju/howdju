const fs = require('fs')
const path = require('path')
const zip = new require('node-zip')

const {logger} = require('howdju-ops')

// Assume we are run from the lambda package root
const packagePath = process.cwd()
const packageInfoPath = path.resolve(packagePath, 'package.json')
const packageInfo = JSON.parse(fs.readFileSync(packageInfoPath))
logger.info(`Zipping lambda ${packageInfo.name}`)

const distDir = path.resolve(packagePath, 'dist')
const zipFile = zip()
for (let filename of ['index.js', 'index.js.map']) {
  const data = fs.readFileSync(path.join(distDir, filename))
  zipFile.file(filename, data)
}
const zipData = zipFile.generate({base64: false, compression: 'DEFLATE'})
const zipPath = path.join(distDir, `lambda.zip`)
fs.writeFileSync(zipPath, zipData, 'binary')
logger.info(`Wrote ${zipPath}`)
