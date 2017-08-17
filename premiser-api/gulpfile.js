const gulp = require('gulp')
const gutil = require('gulp-util')
const del = require('del')
const install = require('gulp-install')
const rename = require('gulp-rename')
const zip = require('gulp-zip')
const AWS = require('aws-sdk')
const fs = require('fs')
const runSequence = require('run-sequence')

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

// See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html
gulp.task('upload', () => {

  AWS.config.region = 'us-east-1'
  AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'premiser'});
  const lambda = new AWS.Lambda({apiVersion: '2015-03-31'})
  const FunctionName = 'premiserApi'

  fs.readFile('./dist/premiser-api.zip', (err, data) => {
    if (err) throw err

    const params = {
      FunctionName,
      Publish: false, // This boolean parameter can be used to request AWS Lambda to update the Lambda function and publish a version as an atomic operation.
      ZipFile: data
    }
    lambda.updateFunctionCode(params, (err, data) => {
      if (err) throw err
      gutil.log(`Uploaded ${FunctionName}`)
    })
  })
})

gulp.task('build', next => runSequence(
    ['clean'],
    ['js', 'npm', 'env'],
    ['zip'],
    next
))

gulp.task('deploy', next => runSequence(
    ['build'],
    ['upload'],
    next
))