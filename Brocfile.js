var builder = require('broccoli-multi-builder');
var mergeTrees = require('broccoli-merge-trees');
var testTreeBuilder = require('broccoli-test-builder');

var buildOptions = {
  packageName: require('./package.json').name,
  libDirName: 'src',
  vendoredModules: [
    {
      name: 'content-kit-utils',
      options: {
        libDirName: 'src'
      }
    }
  ]
};

module.exports = mergeTrees([
  builder.build('amd', buildOptions),
  builder.build('global', buildOptions),
  builder.build('commonjs', buildOptions),
  testTreeBuilder.build()
]);
