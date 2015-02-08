var gulp      = require('gulp');
var jshint    = require('gulp-jshint');
var qunit     = require('gulp-qunit');
var concat    = require('gulp-concat');
var transpile = require('gulp-es6-module-transpiler');

var pkg = require('./package.json');

var jsSrc = [
  './src/**/*.js'
];

var jsEntry = './src/index.js';

var distName = 'content-kit-compiler.js';
var distDest = './dist/';
var distPath = distDest + distName;
var testRunner = './tests/index.html';

gulp.task('lint', function() {
  gulp.src(jsSrc)
      .pipe(jshint('.jshintrc'))
      .pipe(jshint.reporter('default'));
});

gulp.task('lint-built', ['build'], function() {
  return gulp.src(distPath)
             .pipe(jshint('.jshintrc'))
             .pipe(jshint.reporter('default'));
});

gulp.task('build', ['lint'], function() {
  gulp.src(jsEntry)
      .pipe(transpile({ format: 'bundle' }))
      .pipe(concat(distName))
      .pipe(gulp.dest(distDest));
});

gulp.task('test', ['build'], function() {
  return gulp.src(testRunner)
             .pipe(qunit());
});

gulp.task('watch', function() {
  gulp.watch(jsSrc, ['build']);
});

gulp.task('default', ['lint', 'build', /*'lint-built',*/ 'test']);
