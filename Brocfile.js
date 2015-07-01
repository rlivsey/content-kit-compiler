var builder = require('broccoli-multi-builder');
var mergeTrees = require('broccoli-merge-trees');
var testTreeBuilder = require('./broccoli/test-tree-builder');

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

var amdTree = builder.build('amd', buildOptions),
    commonjsTree = builder.build('commonjs', buildOptions);

buildOptions.isGlobal = true;
var globalTree = builder.build('global', buildOptions);

module.exports = mergeTrees([
  amdTree,
  globalTree,
  commonjsTree,
  testTreeBuilder.build()
]);
