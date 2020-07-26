const del = require('del')
const gulp = require('gulp')
const zip = require('gulp-zip')
const install = require('gulp-install')
const {LocalInstaller} = require('install-local')
const path = require('path')
const runSequence = require('gulp4-run-sequence')

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

gulp.task('install', () =>
  gulp.src('./package.json')
    .pipe(gulp.dest('./dist/premiser-api'))
    .pipe(install({production: true})))

gulp.task('install-local', () =>
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
  ['src'],
  // install-local requires dist/premiser-api/package.json to exist already
  ['install', 'install-local'],
  ['zip'],
  next
))
