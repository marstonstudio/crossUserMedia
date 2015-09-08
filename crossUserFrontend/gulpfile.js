var browserify      = require('browserify');
var del             = require('del');
var gulp            = require('gulp');
var concatCss       = require('gulp-concat-css');
var fontgen         = require('gulp-fontgen');
var jshint          = require('gulp-jshint');
var less            = require('gulp-less');
var minifyCSS       = require('gulp-minify-css');
var ngAnnotate      = require('gulp-ng-annotate');
var sourcemaps      = require('gulp-sourcemaps');
var uglify          = require('gulp-uglify');
var gutil           = require('gulp-util');
var vinylBuffer     = require('vinyl-buffer');
var vinylSource     = require('vinyl-source-stream');
var vinylTransform  = require('vinyl-transform');

var assetDir = '../assets';
var fontPath = '/css/fonts'
var webappDir = '../crossUserServer/src/main/webapp';
var targetDir = '../crossUserServer/target/crossUserServer';

gulp.task('default', [
    'clean',
    'assembleStyles',
    'assembleImages',
    'assembleHtml',
    'assembleScripts',
    'copy',
    'deploy'
]);

gulp.task('clean', function(callback) {
    del([
            'dist/**/*',
            '!dist/css',
            '!dist/css/fonts',
            '!dist/css/fonts.css',
            '!dist/css/fonts/*',
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
    //'generateFonts',
    //'concatenateFonts'
]);

gulp.task('compileLess', ['clean'] , function() {
    return gulp.src('styles/**/*.less')
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest('dist/css'));
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

gulp.task('concatenateFonts', ['generateFonts'] , function() {
    return gulp.src('dist' + fontPath + '/*.css')
        .pipe(concatCss('fonts.css'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('assembleImages', ['clean'], function() {
    return gulp.src(assetDir + '/images/**/*')
        .pipe(gulp.dest('dist/img'));
})

gulp.task('assembleHtml', ['clean'], function() {
    return gulp.src('html/**/*.html')
        .pipe(gulp.dest('dist'));
});

gulp.task('analyzeScripts', function(){
    return gulp.src('scripts/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default', { verbose: true }))
});

gulp.task('assembleScripts', ['clean', 'analyzeScripts'] , function() {
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
        //.pipe(uglify())
        .on('error', function(err){
            console.error(err.toString());
            this.emit('end');
        })
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('copy', ['assembleHtml', 'assembleImages','assembleScripts', 'assembleStyles'], function() {
    return gulp.src('dist/**/*')
        .pipe(gulp.dest(webappDir));
});

gulp.task('deploy', ['copy'], function() {
    return gulp.src('dist/**/*')
        .pipe(gulp.dest(targetDir));
});

