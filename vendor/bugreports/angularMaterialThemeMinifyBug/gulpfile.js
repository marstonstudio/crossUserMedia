var browserify  = require('browserify');
var del         = require('del');
var express     = require('express');
var gulp        = require('gulp');
var uglify      = require('gulp-uglify');
var gutil       = require('gulp-util');
var buffer      = require('vinyl-buffer');
var source      = require('vinyl-source-stream');
var transform   = require('vinyl-transform');

var distDir =   'dist';

gulp.task('default', [
    'clean',
    'assembleHtml',
    'assembleScripts',
    'server'
]);

gulp.task('clean', function(callback) {
    del([
            distDir + '/**/*',
        ]
        , {force: true}
        , callback);
});

gulp.task('assembleHtml', ['clean'], function() {
    return gulp.src('**/*.html')
        .pipe(gulp.dest(distDir));
});

gulp.task('assembleScripts', ['clean'] , function() {
    var browserified = browserify({
        entries: './entry.js',
        debug: true
    });

    return browserified
        .bundle()
        .pipe(source('application.js'))
        .pipe(buffer())
        .pipe(uglify())
        .on('error', function(err){
            console.log(err.toString());
            this.emit('end');
        })
        .pipe(gulp.dest(distDir));
});

gulp.task('server', ['assembleHtml', 'assembleScripts'], function() {
    var server = express();
    server.use(express.static('dist'));
    server.listen(8000);
});