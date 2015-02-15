var gulp      = require('gulp');
var jshint    = require('gulp-jshint');
var qunit     = require('gulp-qunit');
var file      = require('gulp-file');
var esperanto = require('esperanto');

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
  return gulp.src(jsSrc)
             .pipe(jshint('.jshintrc'))
             .pipe(jshint.reporter('default'));
});

gulp.task('lint-built', ['build'], function() {
  return gulp.src(distPath)
             .pipe(jshint('.jshintrc'))
             .pipe(jshint.reporter('default'));
});

gulp.task('build', ['lint'], function() {
  return esperanto.bundle({
    entry: jsEntry,
    resolvePath: function (importee, importer) {
      return 'node_modules/' + importee + '.js';
    }
  }).then(function(bundle) {
    var built = bundle.concat();
    return file(distName, built.code, { src: true }).pipe(gulp.dest(distDest));
  });
});

gulp.task('test', ['build'], function() {
  return gulp.src(testRunner)
             .pipe(qunit());
});

gulp.task('watch', function() {
  return gulp.watch(jsSrc, ['build']);
});

gulp.task('default', ['lint', 'build', /*'lint-built',*/ 'test']);
