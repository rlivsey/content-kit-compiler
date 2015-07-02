import NewHTMLParser from './parsers/new-html-parser';
import { DefaultBlockTypeSet, DefaultMarkupTypeSet } from './types/default-types';
import { mergeWithOptions } from 'content-kit-utils';

/**
 * @class Compiler
 * @constructor
 * @param options
 */
function Compiler(options) {
  var parser = new NewHTMLParser();
  var defaults = {
    renderer: null,
    parser,
    blockTypes:       DefaultBlockTypeSet,
    markupTypes:      DefaultMarkupTypeSet,
    // Outputs `type_name:'HEADING'` etc. when parsing. Good
    // for debugging.
    includeTypeNames: false
  };
  mergeWithOptions(this, defaults, options);
  if (!this.renderer) {
    throw new Error('renderer required');
  }
}

/**
 * @method parse
 * @param input
 * @return Array
 */
Compiler.prototype.parse = function(input) {
  return this.parser.parse(input);
};

/**
 * @method render
 * @param model
 * @return String
 */
Compiler.prototype.render = function(model, target) {
  return this.renderer.render(model, target);
};

/**
 * @method rerender
 * @param input
 * @return String
 */
Compiler.prototype.rerender = function(input) {
  return this.render(this.parse(input));
};

/**
 * @method reparse
 * @param model
 * @return String
 */
Compiler.prototype.reparse = function(model) {
  return this.parse(this.render(model));
};

/**
 * @method registerBlockType
 * @param {Type} type
 */
Compiler.prototype.registerBlockType = function(type) {
  return this.blockTypes.addType(type);
};

/**
 * @method registerMarkupType
 * @param {Type} type
 */
Compiler.prototype.registerMarkupType = function(type) {
  return this.markupTypes.addType(type);
};

export default Compiler;
