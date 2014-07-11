/**
 * @class Compiler
 * @constructor
 * @param options
 */
function Compiler(options) {
  var defaults = {
    parser        : new HTMLParser(),
    renderer      : new HTMLRenderer(),
    blockTypes    : DefaultBlockTypes,
    markupTypes   : DefaultMarkupTypes
  };
  merge(this, defaults, options);
}

/**
 * @method parse
 * @param input
 * @return Object
 */
Compiler.prototype.parse = function(input) {
  return this.parser.parse(input);
};

/**
 * @method render
 * @param data
 * @return Object
 */
Compiler.prototype.render = function(data) {
  return this.renderer.render(data);
};

ContentKit.Compiler = Compiler;
