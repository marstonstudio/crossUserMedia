var browserify = require('browserify');
var del =        require('del');
var gulp =       require('gulp');
var less =       require('gulp-less');
var minifyCSS =  require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var uglify =     require('gulp-uglify');
var gutil =      require('gulp-util');
var buffer =     require('vinyl-buffer');
var source =     require('vinyl-source-stream');
var transform =  require('vinyl-transform');

//npm install --save-dev glob

var distDir =   'dist';
var webappDir = '../crossUserServer/src/main/webapp';

gulp.task('default', [
    'clean',
    'assembleStyles',
    'assembleHtml',
    'browserifyApplication',
    'copy'
]);

gulp.task('clean', function(callback) {
    console.log('[gulp]: clean task');

    del([
            distDir + '/**/*',
            webappDir + '/css/*',
            webappDir + '/js/*',
            webappDir + '/*.html',
            !webappDir + '/*/.gitignore'
        ]
        , {force: true}
        , callback);
});

gulp.task('assembleStyles', ['clean'] , function() {
    console.log('[gulp]: assembleStyles task');

    return gulp.src('styles/**/*.less')
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest(distDir + '/css'));
});

gulp.task('assembleHtml', ['clean'] , function() {
    console.log('[gulp]: assembleHtml task');

    return gulp.src('html/**/*.html')
        .pipe(gulp.dest(distDir));
});

gulp.task('browserifyApplication', ['clean'] , function() {
    console.log('[gulp]: browserifyApplication');

    var browserified = browserify({
        entries: './scripts/Main.js',
        debug: true
    });

    return browserified
        .bundle()
        .pipe(source('Application.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(distDir + '/js/'));
});

gulp.task('copy', ['assembleHtml', 'assembleStyles', 'browserifyApplication'], function() {
    console.log('[gulp]: copy task');

    return gulp.src(distDir + '/**/*')
        .pipe(gulp.dest(webappDir));
});