var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var qunit  = require('gulp-qunit');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var header = require('gulp-header');
var footer = require('gulp-footer');
var util   = require('gulp-util');
var open   = require('gulp-open');

var pkg = require('./package.json');

var src = [
  './src/index.js',
  './src/types/type.js',
  './src/types/type-set.js',
  './src/models/model.js',
  './src/models/*.js',
  './src/utils/*.js',
  './src/compiler.js',
  './src/parsers/*.js',
  './src/renderers/*.js'
];

var distName = 'content-kit-compiler.js';
var distDest = './dist/';
var distPath = distDest + distName;

var testRunner = './tests/index.html';

var banner = ['/*!',
              ' * @overview <%= pkg.name %>: <%= pkg.description %>',
              ' * @version  <%= pkg.version %>',
              ' * @author   <%= pkg.author %>',
              ' * @license  <%= pkg.license %>',
              ' * Last modified: ' + util.date('mmm d, yyyy'),
              ' */',
              ''].join('\n'); 

var iifeHeader = ['',
                  '(function(exports, document, undefined) {',
                  '',
                  '\'use strict\';',
                  '',
                  ''].join('\n'); 
var iifeFooter = ['',
                  '}(this, document));',
                  ''].join('\n'); 

gulp.task('lint', function() {
  gulp.src(src)
      .pipe(jshint('.jshintrc'))
      .pipe(jshint.reporter('default'));
});

gulp.task('lint-built', function() {
  return gulp.src(distPath)
             .pipe(jshint('.jshintrc'))
             .pipe(jshint.reporter('default'));
});

gulp.task('build', function() {
  gulp.src(src)
      .pipe(concat(distName))
      .pipe(header(iifeHeader))
      .pipe(header(banner, { pkg : pkg } ))
      .pipe(footer(iifeFooter))
      .pipe(gulp.dest(distDest));
});

gulp.task('test', function() {
  return gulp.src(testRunner)
             .pipe(qunit());
});

gulp.task('test-browser', function(){
  return gulp.src(testRunner)
             .pipe(open('<% file.path %>')); 
});

gulp.task('watch', function() {
  gulp.watch(src, ['build']);
});


gulp.task('default', ['lint', 'build', 'lint-built', 'test']);
