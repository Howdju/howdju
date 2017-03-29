const gulp = require('gulp');
const zip = require('gulp-zip');

gulp.task('archive', () =>
    gulp.src('src/*')
        .pipe(zip('archive.zip'))
        .pipe(gulp.dest('dist'))
);