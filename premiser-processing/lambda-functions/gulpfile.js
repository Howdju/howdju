const fs = require('fs')
const path = require('path')

const {ArgumentParser} = require('argparse')
const {exec} = require('child_process')
const del = require('del')
const gulp = require('gulp')
const install = require('gulp-install')
const zip = require('gulp-zip')
const assign = require('lodash/assign')
const runSequence = require('run-sequence')


const argumentParser = new ArgumentParser({
  description: 'Build lambda functions'
})
// must use optional syntax (start with --) so that gulp doesn't think it's a task
argumentParser.addArgument('--lambdaDir', {required: true})
argumentParser.addArgument('--removeHowdjuDeps')
// This file will also see the gulp arguments (such as --cwd and --gulpfile), so only parse the ones we care about
const [args] = argumentParser.parseKnownArgs()

// To allow del to do its safety check, we set CWD to the project root.  So paths must be relative to that
const lambdaDir = path.resolve('lambda-functions', args.lambdaDir)
if (!fs.existsSync(lambdaDir)) throw new Error(`lambda function directory does not exist: ${lambdaDir}`)

const lambdarcPath = path.join(lambdaDir, 'lambdarc.js')
const lambdarc = require(lambdarcPath)
const lambdaName = lambdarc.name
const lambdaBuildDir = path.resolve('build', 'lambda-functions', lambdaName)
const lambdaDistDir = path.resolve('dist', 'lambda-functions', lambdaName)

const requireHowdjuDeps = lambdarc.requireHowdjuDeps

gulp.task('clean', (next) =>
  del([
    lambdaBuildDir,
    lambdaDistDir
  ], next)
)

gulp.task('copy-src', () => {
  const src = lambdarc.src || 'src/**/*.js'
  const options = assign(
    {},
    // set cwd so that the lambdrc can define src paths relative to its own dir
    // set base to the src dir so that if there are paths like src/some-directory/**/*.js they are not flattened into the root of the build dir
    {cwd: lambdaDir, base: path.resolve(lambdaDir, 'src')},
    lambdarc.srcOptions
  )
  return gulp.src(src, options)
    .pipe(gulp.dest(lambdaBuildDir))
})

gulp.task('add-howdju-deps', (next) => {
  exec(`yarn install --cwd ${lambdaDir} --production ../howdju-service-common`, function (err, output, errOutput) {
    if (output) process.stdout.write(output + '\n')
    if (errOutput) process.stderr.write(errOutput + '\n')
    if (err) return next(err)
    // howdju-service-common package.json lacks a dependency on howdju-common (should we add it in a post-install step?)
    exec(`yarn install --cwd ${lambdaDir} --production ../howdju-common`, function (err, output, errOutput) {
      if (output) process.stdout.write(output + '\n')
      if (errOutput) process.stderr.write(errOutput + '\n')
      next(err)
    })
  })
})

gulp.task('npm-install', () =>
  gulp.src(path.resolve(lambdaDir, 'package.json'))
    .pipe(gulp.dest(lambdaBuildDir))
    .pipe(install({production: true}))
)

gulp.task('remove-howdju-deps', (next) => {
  exec(`yarn remove --cwd ${lambdaDir} howdju-service-common`, function (err, output, errOutput) {
    if (output) process.stdout.write(output + '\n')
    if (errOutput) process.stderr.write(errOutput + '\n')
    if (err) return next(err)
    exec(`yarn remove --cwd ${lambdaDir} howdju-common`, function (err, output, errOutput) {
      if (output) process.stdout.write(output + '\n')
      if (errOutput) process.stderr.write(errOutput + '\n')
      next(err)
    })
  })
})

// Gulp does not accept empty tasks, so we must pass a no-op
gulp.task('no-op')

gulp.task('zip', () =>
  gulp.src([
    path.join(lambdaBuildDir, '**/*'),
    `!${path.join(lambdaBuildDir, '/package.json')}`,
  ])
    .pipe(zip(`${lambdaName}.zip`))
    .pipe(gulp.dest(lambdaDistDir)))

const addHowdjuDeps = requireHowdjuDeps ? 'add-howdju-deps' : 'no-op'
const removeHowdjuDeps = requireHowdjuDeps && args.removeHowdjuDeps ? 'remove-howdju-deps' : 'no-op'

gulp.task('build', (next) => runSequence(
  'clean',
  addHowdjuDeps,
  [
    'copy-src',
    'npm-install'
  ],
  'zip',
  removeHowdjuDeps,
  next
))
