var gulp =       require('gulp');
var concat =     require('gulp-concat');
var uglify =     require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil =      require('gulp-util');

var browserify = require('browserify');
var source =     require('vinyl-source-stream');
var buffer =     require('vinyl-buffer');
var glob =       require('glob');

//npm install --save-dev glob


gulp.task('default', function() {
    console.log('[gulp]: default task');
});

gulp.task('build', function() {

    //copy source version of dependencies
    gulp.src([
        './node_modules/angular/angular.js',
        './node_modules/jakobmattsson-swfobject/swfobject/src/swfobject.js'
    ]).pipe(gulp.dest('dist/src/libs'));

    //copy source of applets
    gulp.src([
        './applets/**/*.js'
    ]).pipe(gulp.dest('dist/src/applets'));

    var b = browserify({
        entries: glob.sync('dist/src/**/ *.js'),
        debug: true
    });

    return b.bundle()
        .pipe(source('application.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        //.on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));

});