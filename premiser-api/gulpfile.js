const del = require('del')
const gulp = require('gulp')
const zip = require('gulp-zip')
const {LocalInstaller} = require('install-local')
const path = require('path')
const runSequence = require('run-sequence')
const vfs = require('vinyl-fs')

const lambdarcPath = path.resolve('lambdarc')
const lambdarc = require(lambdarcPath)
const lambdaName = lambdarc.name

gulp.task('clean', next => del('./dist', next))

gulp.task('src', () =>
  gulp.src([
    'package.json',
    'src/**/*.js',
    '!src/**/*.test.js',
    // Only include the necessary production app config
    'src/config/config.production.js',
    '!src/config/config.development.js',
    '!src/config/config.test.js',
  ])
    .pipe(gulp.dest('dist/premiser-api')))

gulp.task('node_modules', () =>
  // Need vfs to follow symlinks
  vfs.src([
    'node_modules/**/*',
  ])
    .pipe(gulp.dest('dist/premiser-api/node_modules')))

gulp.task('local-deps', () =>
  (new LocalInstaller({
    './dist/premiser-api': [
      '../howdju-common',
      '../howdju-ops',
      '../howdju-service-common',
    ]
  }).install()))

gulp.task('zip', () =>
  gulp.src([
    'dist/premiser-api/**/*',
    '!dist/premiser-api/package.json',
  ])
    .pipe(zip(`${lambdaName}.zip`))
    .pipe(gulp.dest('./dist/')))

gulp.task('build', (next) => runSequence(
  ['clean'],
  ['src', 'node_modules'],
  // local-deps and node_modules will write to node_modules for local dep directories
  ['local-deps'],
  ['zip'],
  next
))
