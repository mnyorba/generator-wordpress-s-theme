'use strict';

var gulp         = require('gulp');
var sass         = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var rename       = require('gulp-rename');
var uglify       = require('gulp-uglify');
var jshint       = require('gulp-jshint');
var stylish      = require('jshint-stylish');
var wpPot        = require('gulp-wp-pot');
var sort         = require('gulp-sort');
var gcmq         = require('gulp-group-css-media-queries');
var del          = require('del');
var zip          = require('gulp-zip');
var browserSync = require('browser-sync');
var runSequence  = require('run-sequence');
var wiredep 		= require('wiredep').stream;
var js_files     = ['js/*.js', '!js/*.min.js', '!js/lib/**/*.js'];

var build_files = [
  '**',
  '!node_modules',
  '!node_modules/**',
  '!bower_components',
  '!bower_components/**',
  '!dist',
  '!dist/**',
  '!sass',
  '!sass/**',
  '!.git',
  '!.git/**',
  '!package.json',
  '!.gitignore',
  '!gulpfile.js',
  '!.editorconfig',
  '!.jshintrc'
];

gulp.task('wiredep', function () {
  gulp.src('sass/style.scss')
    .pipe(wiredep({
      optional: 'configuration',
      goes: 'here'
    }))
    .pipe(gulp.dest('sass/'));
});

gulp.task('sass', function () {
  gulp.src(['sass/style.scss'])
    .pipe(sass({outputStyle: 'expanded'}))
    .pipe(autoprefixer(['last 2 versions']))
    .pipe(gcmq())
    .pipe(gulp.dest('.'))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('lint', function() {
  return gulp.src(js_files)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('compress', function() {
  return gulp.src(js_files, {base: '.'})
    .pipe(gulp.dest('.'))
    .pipe(uglify())
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest('.'));
});

gulp.task('makepot', function () {
  return gulp.src(['**/*.php'])
    .pipe(sort())
    .pipe(wpPot({
      domain: '<%= theme_domain %>',
      destFile: '<%= theme_domain %>.pot',
      package: '<%= package_name %>',
      bugReport: '<%= theme_bugreport %>',
      team: '<%= author %> <<%= author_email %>>'
    }))
    .pipe(gulp.dest('languages'))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('browserSync', function() {
  browserSync({
    proxy: '<%= proxy_address %>/<%= proxy_domain %>',
    port: 8080,
    open: true,
    notify: false
  });
});

gulp.task('watch', function () {
  gulp.watch(js_files, ['lint']);
  gulp.watch(js_files, ['compress']);
  gulp.watch(['**/*.php'], ['makepot']);
  gulp.watch('sass/**/*.scss', ['sass']);
});

gulp.task('build-clean', function() {
  del(['dist/**/*']);
});

gulp.task('build-copy', function() {
  return gulp.src(build_files)
    .pipe(gulp.dest('dist/<%= theme_domain %>'));
});

gulp.task('build-zip', function() {
  return gulp.src('dist/**/*')
    .pipe(zip('<%= theme_domain %>.zip'))
    .pipe(gulp.dest('dist'));
});

gulp.task('build-delete', function() {
  del(['dist/**/*', '!dist/<%= theme_domain %>.zip']);
});

gulp.task('build', function(callback) {
  runSequence('build-clean', 'build-copy', 'build-zip', 'build-delete');
});

gulp.task('default', ['sass', 'lint', 'compress', 'makepot', 'watch', 'browserSync']);
