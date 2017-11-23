var browserify      = require('browserify');
var del             = require('del');
var gulp            = require('gulp');
var concatCss       = require('gulp-concat-css');
var fontgen         = require('gulp-fontgen');
var jshint          = require('gulp-jshint');
var less            = require('gulp-less');
var cleanCSS        = require('gulp-clean-css');
var ngAnnotate      = require('gulp-ng-annotate');
var sourcemaps      = require('gulp-sourcemaps');
var uglify          = require('gulp-uglify');
var gutil           = require('gulp-util');
var vinylBuffer     = require('vinyl-buffer');
var vinylSource     = require('vinyl-source-stream');
var vinylTransform  = require('vinyl-transform');

var assetDir = '../assets';
var fontPath = '/css/fonts'
var webappDir = '../server/src/main/webapp';
var targetDir = '../server/target/server';

gulp.task('_default', [
    'clean',
    'assembleHtml',
    'assembleStyles',
    'assembleImages',
    'assembleScripts',
    'copy',
    'deploy'
]);

gulp.task('clean', function() {
    return del([
            'dist/**/*',
            '!dist/css',
            '!dist/css/fonts',
            '!dist/css/fonts.css',
            '!dist/css/fonts/*',
            '!dist/img',
            '!dist/js',
            webappDir + '/css/*',
            webappDir + '/js/*',
            webappDir + '/*.html',
            !webappDir + '/*/.gitignore',
            targetDir + '/css/*',
            targetDir + '/js/*',
            targetDir + '/*.html'
        ]
        , {force: true});
});

gulp.task('assembleHtml', ['clean'], function() {
    return gulp.src('html/**/*.html')
        .pipe(gulp.dest('dist'));
});

gulp.task('assembleImages', ['clean'], function() {
    return gulp.src([assetDir + '/images/**/*'])
        .pipe(gulp.dest('dist/img'));
});


gulp.task('compileLess', ['clean'] , function() {
    return gulp.src('styles/**/*.less')
        .pipe(less())
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css'));
});

//TODO: make this more conditional on an environment variable
gulp.task('assembleStyles', [
    'compileLess',
//    'generateFonts',
//    'concatenateFonts'
]);

gulp.task('analyzeScripts', ['clean'], function(){
    return gulp.src('scripts/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default', { verbose: true }))
});

gulp.task('copyEncoderJs', ['clean'], function(){
    return gulp.src(['node_modules/pcmencoder/encoder.*'])
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('assembleScripts', ['clean', 'analyzeScripts', 'copyEncoderJs'] , function() {
    var browserified = browserify({
        entries: './scripts/Main.js',
        debug: true
    });

    return browserified
        .bundle()
        .pipe(vinylSource('application.js'))
        .pipe(vinylBuffer())
        .pipe(ngAnnotate())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .on('error', function(err){
            console.error(err.toString());
            this.emit('end');
        })
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('copy', ['assembleHtml', 'assembleImages','assembleStyles', 'assembleScripts'], function() {
    return gulp.src('dist/**/*')
        .pipe(gulp.dest(webappDir));
});

gulp.task('deploy', ['copy'], function() {
    return gulp.src(['dist/**/*'])
        .pipe(gulp.dest(targetDir));
});

//TODO: make this more conditional on an environment variable
//must be run once
gulp.task('_defaultPrepareFonts', [
    'cleanFonts',
    'generateFonts',
    'concatenateFonts'
]);

gulp.task('cleanFonts', function() {
    return del([
            'dist/**/*',
            webappDir + '/css/*',
            targetDir + '/css/*'
        ]
        , {force: true});
});

gulp.task('generateFonts', ['clean'] , function() {
    // requires system libraries be installed
    // brew install fontforge ttf2eot batik ttfautohint
    return gulp.src(assetDir + '/fonts/*.otf')
        .pipe(fontgen({
            dest: 'dist' + fontPath,
            css_fontpath: fontPath
        }))
        .on('error', function(err){
            console.log(err.toString());
            this.emit('end');
        });
});

gulp.task('concatenateFonts', ['clean', 'generateFonts'] , function() {
    return gulp.src('dist' + fontPath + '/*.css')
        .pipe(concatCss('fonts.css'))
        .pipe(gulp.dest('dist/css'));
});

