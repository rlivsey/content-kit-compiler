var builder = require('broccoli-multi-builder');
var mergeTrees = require('broccoli-merge-trees');
var testTreeBuilder = require('./broccoli/test-tree-builder');

var buildOptions = {
  packageName: require('./package.json').name,
  src: './src',
  vendoredModules: ['content-kit-utils']
};

module.exports = mergeTrees([
  builder.buildAMD(buildOptions),
  builder.buildCJS(buildOptions),
  testTreeBuilder.build()
]);
