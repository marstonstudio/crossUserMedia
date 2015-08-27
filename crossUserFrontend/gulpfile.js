var browserify  = require('browserify');
var del         = require('del');
var gulp        = require('gulp');
var concatCss   = require('gulp-concat-css');
var fontgen     = require('gulp-fontgen');
var less        = require('gulp-less');
var minifyCSS   = require('gulp-minify-css');
var sourcemaps  = require('gulp-sourcemaps');
var uglify      = require('gulp-uglify');
var gutil       = require('gulp-util');
var buffer      = require('vinyl-buffer');
var source      = require('vinyl-source-stream');
var transform   = require('vinyl-transform');

var distDir =   'dist';
var webappDir = '../crossUserServer/src/main/webapp';
var fontDir = '../assets/fonts';
var fontPath = '/css/fonts'

gulp.task('default', [
    'clean',
    'assembleStyles',
    'assembleHtml',
    'assembleScripts',
    'copy'
]);

gulp.task('clean', function(callback) {
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

gulp.task('assembleStyles', [
    'compileLess',
    'generateFonts',
    'concatenateFonts'
]);

gulp.task('compileLess', ['clean'] , function() {
    return gulp.src('styles/**/*.less')
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest(distDir + '/css'));
});

gulp.task('generateFonts', ['clean'] , function() {
    // requires system libraries be installed
    // brew install fontforge ttf2eot batik ttfautohint
    return gulp.src(fontDir + '/*.otf')
        .pipe(fontgen({
            dest: distDir + fontPath,
            css_fontpath: fontPath
        }))
        .on('error', function(err){
            console.log(err.toString());
            this.emit('end');
        });
});

gulp.task('concatenateFonts', ['generateFonts'] , function() {
    return gulp.src(distDir + fontPath + '/*.css')
        .pipe(concatCss('fonts.css'))
        .pipe(gulp.dest(distDir + '/css'));
});

gulp.task('assembleHtml', ['clean'], function() {
    return gulp.src('html/**/*.html')
        .pipe(gulp.dest(distDir));
});

gulp.task('assembleScripts', ['clean'] , function() {
    var browserified = browserify({
        entries: './scripts/Main.js',
        debug: true
    });

    return browserified
        .bundle()
        .pipe(source('application.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .on('error', function(err){
            console.log(err.toString());
            this.emit('end');
        })
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(distDir + '/js/'));
});

gulp.task('copy', ['assembleHtml', 'assembleScripts', 'assembleStyles'], function() {
    return gulp.src(distDir + '/**/*')
        .pipe(gulp.dest(webappDir));
});