const del = require('del')
const gulp = require('gulp')
const install = require('gulp-install')
const runSequence = require('run-sequence')
const zip = require('gulp-zip')

const lambdarcPath = path.resolve('lambdarc')
const lambdarc = require(lambdarcPath)
const lambdaName = lambdarc.name

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

gulp.task('zip', () =>
  gulp.src([
    'dist/premiser-api/**/*',
    '!dist/premiser-api/package.json',
  ])
    .pipe(zip(`${lambdaName}.zip`))
    .pipe(gulp.dest('./dist/')))

gulp.task('build', (next) => runSequence(
  ['clean'],
  ['js', 'npm'],
  ['zip'],
  next
))
