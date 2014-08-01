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
var es6ModuleTranspiler = require('gulp-es6-module-transpiler');

var pkg = require('./package.json');

var jsSrc = [
  './src/content-kit.js',
  './src/**/*.js'
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
                  '(function(window, document, define, undefined) {',
                  '',
                  ''].join('\n'); 
var iifeFooter = ['',
                  '}(this, document, define));',
                  ''].join('\n'); 

gulp.task('lint', function() {
  gulp.src(jsSrc)
      .pipe(jshint('.jshintrc'))
      .pipe(jshint.reporter('default'));
});

gulp.task('lint-built', function() {
  return gulp.src(distPath)
             .pipe(jshint('.jshintrc'))
             .pipe(jshint.reporter('default'));
});

gulp.task('build', function() {
  gulp.src(jsSrc)
      .pipe(es6ModuleTranspiler({ type: 'amd' }))
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
