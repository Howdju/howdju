const fs = require('fs')
const os = require('os')

const del = require('del')
const gulp = require('gulp')
const gutil = require('gulp-util')
const install = require('gulp-install')
const rename = require('gulp-rename')
const runSequence = require('run-sequence')
const zip = require('gulp-zip')

const {
  updateFunctionCode,
  publishVersion,
  updateAlias,
} = require('./lib/lambda')

gulp.task('clean', next => del('./dist', next))

gulp.task('js', () =>
    gulp.src([
      'src/**/*.js',
      '!src/**/*.test.js',
      // Only include the necessary production app config
      'src/config/config.production.js',
      '!src/config/config.development.js',
      '!src/config/config.test.js',
    ])
      .pipe(gulp.dest('dist/premiser-api')))

gulp.task('npm', () =>
  gulp.src('./package.json')
      .pipe(gulp.dest('./dist/premiser-api'))
      .pipe(install({production: true})))

gulp.task('env', () =>
  gulp.src('./config/production.env')
      .pipe(rename('.env'))
      .pipe(gulp.dest('./dist/premiser-api')))

gulp.task('zip', () =>
  gulp.src([
    'dist/premiser-api/**/*',
    'dist/premiser-api/.env',
    '!dist/premiser-api/package.json',
  ])
      .pipe(zip('premiser-api.zip'))
      .pipe(gulp.dest('./dist/')))

gulp.task('build', (next) => runSequence(
    ['clean'],
    ['js', 'npm', 'env'],
    ['zip'],
    next
))
