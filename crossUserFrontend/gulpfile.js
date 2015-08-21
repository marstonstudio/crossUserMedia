var gulp =       require('gulp');
var concat =     require('gulp-concat');
var uglify =     require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil =      require('gulp-util');

var browserify = require('browserify');
var source =     require('vinyl-source-stream');
var buffer =     require('vinyl-buffer');
var glob =       require('glob');
var del =        require('del');

//npm install --save-dev glob

gulp.task('default', ['clean', 'prepareAngular', 'prepareSwfObject', 'prepareApplets']);

gulp.task('clean', function() {
    console.log('[gulp]: clean task');

    return del('dist/**/*');
});

gulp.task('prepareAngular', ['clean'], function() {
    console.log('[gulp]: prepareAngular task');

    return gulp.src('node_modules/angular/angular.js')
        .pipe(gulp.dest('dist/js/src/libs'));
});

gulp.task('prepareSwfObject', ['clean'], function() {
    console.log('[gulp]: prepareSwfobject task');

    return gulp.src('node_modules/jakobmattsson-swfobject/swfobject/src/swfobject.js')
        .pipe(gulp.dest('dist/js/src/libs'));
});

gulp.task('prepareApplets', ['clean'], function() {
    console.log('[gulp]: prepareApplets task');

    return gulp.src('applets/**/*.js')
        .pipe(gulp.dest('dist/js/src/applets'));
});

//https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-tasks-in-series.md

gulp.task('build', function() {
    console.log('[gulp]: build task');

    //glob.sync('dist/src/js/**/ *.js'),

    var b = browserify({
        entries: ['dist/js/src/libs/angular.js','dist/js/src/libs/swfobject.js'],
        debug: true
    });

    return b.bundle()
        .pipe(source('application.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/js/'));

});

//http://ponyfoo.com/articles/my-first-gulp-adventure