var gulp = require('gulp');
var ngTemplate = require('gulp-ng-template');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var eventStream = require('event-stream');
var order = require('gulp-order');
var less = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var ngAnnotate = require('gulp-ng-annotate');

gulp.task('build', function () {
    return eventStream.merge(
        gulp.src('src/js/angular-dual-multi-select.js'),
        createTemplate()
    )
    .pipe(order(['**/angular-dual-multi-select.js', '**/templates.js']))
    .pipe(concat('angular-dual-multi-select.js'))
    .pipe(gulp.dest('dist'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(rename('angular-dual-multi-select.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('css', function () {
    return gulp.src('src/less/*.less')
    .pipe(less())
    .pipe(gulp.dest('./dist'))
    .pipe(minifyCss())
    .pipe(rename('angular-dual-multi-select.min.css'))
    .pipe(gulp.dest('./dist'));
});

function createTemplate() {
    return gulp.src('src/template/*.tpl')
    .pipe(ngTemplate({
        moduleName: 'DualMultiSelect',
        filePath: './templates.js'
    })); 
}