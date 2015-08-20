var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function() {
    console.log('[gulp]: default task');
});

gulp.task('build', function() {

    gulp.src([
            './node_modules/angular/angular.js',
            './node_modules/jakobmattsson-swfobject/swfobject/src/swfobject.js'
        ])
        .pipe(concat('modules.js'))
        .pipe(gulp.dest('../webapp/js/'));

});