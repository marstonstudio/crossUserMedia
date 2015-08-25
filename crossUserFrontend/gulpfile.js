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

var less =       require('gulp-less');
var minifyCSS =  require('gulp-minify-css');


//npm install --save-dev glob

var distDir =   'dist';
var webappDir = '../crossUserServer/src/main/webapp';

gulp.task('default', [
    'clean',
    'assembleStyles',
    'assembleLibraries',
    'assembleApplication',
    'build'
]);

gulp.task('clean', function(callback) {
    console.log('[gulp]: clean task');

    del([
            distDir + '/**/*',
            webappDir + '/css/*',
            webappDir + '/js/*',
            !webappDir + '/*/.gitignore'
        ]
        , {force: true}
        , callback);
});

gulp.task('assembleStyles', ['clean'] , function() {
    console.log('[gulp]: assembleStyles task');

    return gulp.src('styles/**/*.less')
        .pipe(less())
        //.pipe(minifyCSS())
        .pipe(gulp.dest(distDir + '/css'));
});

gulp.task('assembleLibraries', ['clean'] , function() {
   console.log('[gulp]: assembleLibraries task');

    return gulp.src([
            'node_modules/angular/angular.js',
            'node_modules/jakobmattsson-swfobject/swfobject/src/swfobject.js'
        ])
        .pipe(gulp.dest(distDir + '/js/src/libs'));
});

gulp.task('assembleApplication', ['clean'] , function() {
    console.log('[gulp]: assembleApplication task');

    return gulp.src('scripts/**/*.js')
        .pipe(gulp.dest(distDir + '/js/src/app'));
});

gulp.task('build', ['assembleLibraries', 'assembleApplication'], function() {
    console.log('[gulp]: build task');

    return gulp.src(distDir + '/**/*')
        .pipe(gulp.dest(webappDir));
});


//https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-tasks-in-series.md

gulp.task('scratch', function() {
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