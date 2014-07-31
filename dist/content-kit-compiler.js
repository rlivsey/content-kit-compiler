/*!
 * @overview ContentKit-Compiler: Parses HTML to ContentKit's JSON schema and renders back to HTML.
 * @version  0.1.0
 * @author   Garth Poitras <garth22@gmail.com> (http://garthpoitras.com/)
 * @license  MIT
 * Last modified: Aug 1, 2014
 */

(function(exports, document, undefined) {

'use strict';

/**
 * @namespace ContentKit
 */
var ContentKit = exports.ContentKit || {};
exports.ContentKit = ContentKit;

/**
 * @class Type
 * @constructor
 * Contains meta info about a node type (id, name, tag, etc).
 */
function Type(options) {
  if (options) {
    this.name = underscore(options.name || options.tag).toUpperCase();
    if (options.id !== undefined) {
      this.id = options.id;
    }
    if (options.tag) {
      this.tag = options.tag.toLowerCase();
      this.selfClosing = /^(br|img|hr|meta|link|embed)$/i.test(this.tag);
    }
  }
}

ContentKit.Type = Type;

/**
 * @class TypeSet
 * @private
 * @constructor
 */
function TypeSet(types) {
  var len = types && types.length, i;

  this._autoId    = 1;  // Auto-increment id counter
  this.idLookup   = {}; // Hash cache for finding by id
  this.tagLookup  = {}; // Hash cache for finding by tag

  for (i = 0; i < len; i++) {
    this.addType(types[i]);
  }
}

TypeSet.prototype = {
  /**
   * Adds a type to the set
   */
  addType: function(type) {
    this[type.name] = type;
    if (type.id === undefined) {
      type.id = this._autoId++;
    }
    this.idLookup[type.id] = type;
    if (type.tag) {
      this.tagLookup[type.tag] = type;
    }
    return type;
  },

  /**
   * Returns type info for a given Node
   */
  findByNode: function(node) {
    return this.findByTag(node.tagName);
  },
  /**
   * Returns type info for a given tag
   */
  findByTag: function(tag) {
    return this.tagLookup[tag.toLowerCase()];
  },
  /**
   * Returns type info for a given id
   */
  findById: function(id) {
    return this.idLookup[id];
  }
};

/**
 * Default supported block types
 */
var DefaultBlockTypeSet = new TypeSet([
  new Type({ tag: 'p', name: 'text' }),
  new Type({ tag: 'h2', name: 'heading' }),
  new Type({ tag: 'h3', name: 'subheading' }),
  new Type({ tag: 'img', name: 'image' }),
  new Type({ tag: 'blockquote', name: 'quote' }),
  new Type({ tag: 'ul', name: 'list' }),
  new Type({ tag: 'ol', name: 'ordered list' }),
  new Type({ name: 'embed' }),
  new Type({ name: 'group' })
]);

/**
 * Default supported markup types
 */
var DefaultMarkupTypeSet = new TypeSet([
  new Type({ tag: 'b', name: 'bold' }),
  new Type({ tag: 'i', name: 'italic' }),
  new Type({ tag: 'u', name: 'underline' }),
  new Type({ tag: 'a', name: 'link' }),
  new Type({ tag: 'br', name: 'break' }),
  new Type({ tag: 'li', name: 'list item' }),
  new Type({ tag: 'sub', name: 'subscript' }),
  new Type({ tag: 'sup', name: 'superscript' })
]);

/**
 * @class Model
 * @constructor
 * @private
 */
function Model(options) {
  options = options || {};
  var type_name = options.type_name;
  var attributes = options.attributes;

  this.type = options.type || null;
  if (type_name) {
    this.type_name = type_name;
  }
  if (attributes) {
    this.attributes = attributes;
  }
}

/**
 * @class BlockModel
 * @constructor
 * @extends Model
 */
function BlockModel(options) {
  options = options || {};
  Model.call(this, options);
  this.value = options.value || '';
  this.markup = sortBlockMarkups(options.markup || []);
}
inherit(BlockModel, Model);

/**
 * Ensures block markups at the same index are always in a specific order.
 * For example, so all bold links are consistently marked up 
 * as <a><b>text</b></a> instead of <b><a>text</a></b>
 */
function sortBlockMarkups(markups) {
  return markups.sort(function(a, b) {
    if (a.start === b.start && a.end === b.end) {
      return b.type - a.type;
    }
    return 0;
  });
}

ContentKit.BlockModel = BlockModel;

/**
 * @class TextModel
 * @constructor
 * @extends BlockModel
 */
function TextModel(options) {
  options = options || {};
  options.type = DefaultBlockTypeSet.TEXT.id;
  options.type_name = DefaultBlockTypeSet.TEXT.name;
  BlockModel.call(this, options);
}
inherit(TextModel, BlockModel);

ContentKit.TextModel = TextModel;

/**
 * @class MarkupModel
 * @constructor
 * @extends Model
 */
function MarkupModel(options) {
  options = options || {};
  Model.call(this, options);
  this.start = options.start || 0;
  this.end = options.end || 0;
}
inherit(MarkupModel, Model);

ContentKit.MarkupModel = MarkupModel;

/**
 * Converts an array-like object (i.e. NodeList) to Array
 */
function toArray(obj) {
  var array = [],
      i = obj.length >>> 0; // cast to Uint32
  while (i--) {
    array[i] = obj[i];
  }
  return array;
}

/**
 * Computes the sum of values in an array
 */
function sumArray(array) {
  var sum = 0, i, num;
  for (i in array) { // 'for in' best for sparse arrays
    sum += array[i];
  }
  return sum;
}

/**
 * A document instance separate from the page's document. (if browser supports it)
 * Prevents images, scripts, and styles from executing while parsing nodes.
 */
var doc = (function() {
  var implementation = document.implementation,
      createHTMLDocument = implementation.createHTMLDocument;
  if (createHTMLDocument) {
    return createHTMLDocument.call(implementation, '');
  }
  return document;
})();

/**
 * A reusable DOM Node for parsing html content.
 */
var parserNode = doc.createElement('div');

/**
 * Returns plain-text of a `Node`
 */
function textOfNode(node) {
  var text = node.textContent || node.innerText;
  return text ? sanitizeWhitespace(text) : '';
}

/**
 * Replaces a `Node` with it with its children
 */
function unwrapNode(node) {
  var children = toArray(node.childNodes),
      len = children.length,
      parent = node.parentNode, i;
  for (i = 0; i < len; i++) {
    parent.insertBefore(children[i], node);
  }
}

/**
 * Extracts attributes of a `Node` to a hash of key/value pairs
 */
function attributesForNode(node /*,blacklist*/) {
  var attrs = node.attributes,
      len = attrs && attrs.length,
      i, attr, name, hash;
  for (i = 0; i < len; i++) {
    attr = attrs[i];
    name = attr.name;
    if (attr.specified) {
      //if (blacklist && name in blacklist)) { continue; }
      hash = hash || {};
      hash[name] = attr.value;
    }
  }
  return hash;
}

/**
 * Merges set of properties on a object
 * Useful for constructor defaults/options
 */
function merge(object, defaults, updates) {
  updates = updates || {};
  for(var o in defaults) {
    if (defaults.hasOwnProperty(o)) {
      object[o] = updates[o] || defaults[o];
    }
  }
}

/**
 * Prototype inheritance helper
 */
function inherit(Sub, Super) {
  for (var key in Super) {
    if (Super.hasOwnProperty(key)) {
      Sub[key] = Super[key];
    }
  }
  Sub.prototype = new Super();
  Sub.constructor = Sub;
}

var RegExpTrim        = /^\s+|\s+$/g;
var RegExpTrimLeft    = /^\s+/;
var RegExpWSChars     = /(\r\n|\n|\r|\t|\u00A0)/gm;
var RegExpMultiWS     = /\s+/g;

/**
 * String.prototype.trim polyfill
 * Removes whitespace at beginning and end of string
 */
function trim(string) {
  return string ? (string + '').replace(RegExpTrim, '') : '';
}

/**
 * String.prototype.trimLeft polyfill
 * Removes whitespace at beginning of string
 */
function trimLeft(string) {
  return string ? (string + '').replace(RegExpTrimLeft, '') : '';
}

/**
 * Replaces non-alphanumeric chars with underscores
 */
function underscore(string) {
  return string ? (string + '').replace(/ /g, '_') : '';
}

/**
 * Cleans line breaks, tabs, non-breaking spaces, then multiple occuring whitespaces.
 */
function sanitizeWhitespace(string) {
  return string ? (string + '').replace(RegExpWSChars, '').replace(RegExpMultiWS, ' ') : '';
}

/**
 * Injects a string into another string at the index specified
 */
function injectIntoString(string, injection, index) {
  return string.substr(0, index) + injection + string.substr(index);
}

/**
 * @class Compiler
 * @constructor
 * @param options
 */
function Compiler(options) {
  var parser = new HTMLParser();
  var renderer = new HTMLRenderer();
  var defaults = {
    parser           : parser,
    renderer         : renderer,
    blockTypes       : DefaultBlockTypeSet,
    markupTypes      : DefaultMarkupTypeSet,
    includeTypeNames : false // true will output type_name: 'TEXT' etc. when parsing for easier debugging
  };
  merge(this, defaults, options);

  // Reference the compiler settings
  parser.blockTypes  = renderer.blockTypes  = this.blockTypes;
  parser.markupTypes = renderer.markupTypes = this.markupTypes;
  parser.includeTypeNames = this.includeTypeNames;
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

/**
 * @method registerBlockType
 * @param {Type} type
 */
Compiler.prototype.registerBlockType = function(type) {
  if (type instanceof Type) {
    this.blockTypes.addType(type);
  }
};

/**
 * @method registerMarkupType
 * @param {Type} type
 */
Compiler.prototype.registerMarkupType = function(type) {
  if (type instanceof Type) {
    this.markupTypes.addType(type);
  }
};

ContentKit.Compiler = Compiler;

/**
 * @class HTMLParser
 * @constructor
 */
function HTMLParser(options) {
  var defaults = {
    blockTypes       : DefaultBlockTypeSet,
    markupTypes      : DefaultMarkupTypeSet,
    includeTypeNames : false
  };
  merge(this, defaults, options);
}

/**
 * @method parse
 * @param html String of HTML content
 * @return Array Parsed JSON content array
 */
HTMLParser.prototype.parse = function(html) {
  parserNode.innerHTML = sanitizeWhitespace(html);

  var children = toArray(parserNode.childNodes),
      len = children.length,
      blocks = [],
      i, currentNode, block, text;

  for (i = 0; i < len; i++) {
    currentNode = children[i];
    // All top level nodes *should be* `Element` nodes and supported block types.
    // We'll handle some cases if it isn't so we don't lose any content when parsing.
    // Parser assumes sane input (such as from the ContentKit Editor) and is not intended to be a full html sanitizer.
    if (currentNode.nodeType === 1) {
      block = this.parseBlock(currentNode);
      if (block) {
        blocks.push(block);
      } else {
        handleNonBlockElementAtRoot(this, currentNode, blocks);
      }
    } else if (currentNode.nodeType === 3) {
      text = currentNode.nodeValue;
      if (trim(text)) {
        block = getLastBlockOrCreate(this, blocks);
        block.value += text;
      }
    }
  }

  return blocks;
};

/**
 * @method parseBlock
 * @param node DOM node to parse
 * @return {BlockModel} parsed block model
 * Parses a single block type node into a model
 */
HTMLParser.prototype.parseBlock = function(node) {
  var type = this.blockTypes.findByNode(node);
  if (type) {
    return new BlockModel({
      type       : type.id,
      type_name  : this.includeTypeNames && type.name,
      value      : trim(textOfNode(node)),
      attributes : attributesForNode(node),
      markup     : this.parseBlockMarkup(node)
    });
  }
};

/**
 * @method parseBlockMarkup
 * @param node DOM node to parse
 * @return {Array} parsed markups
 * Parses a single block type node's markup
 */
HTMLParser.prototype.parseBlockMarkup = function(node) {
  var processedText = '',
      markups = [],
      index = 0,
      currentNode, markup;

  while (node.hasChildNodes()) {
    currentNode = node.firstChild;
    if (currentNode.nodeType === 1) {
      markup = this.parseElementMarkup(currentNode, processedText.length);
      if (markup) {
        markups.push(markup);
      }
      // unwrap the element so we can process any children
      if (currentNode.hasChildNodes()) {
        unwrapNode(currentNode);
      }
    } else if (currentNode.nodeType === 3) {
      var text = sanitizeWhitespace(currentNode.nodeValue);
      if (index === 0) { text = trimLeft(text); }
      if (text) { processedText += text; }
    }

    // node has been processed, remove it
    currentNode.parentNode.removeChild(currentNode);
    index++;
  }

  return markups;
};

/**
 * @method parseElementMarkup
 * @param node DOM node to parse
 * @param startIndex DOM node to parse
 * @return {MarkupModel} parsed markup model
 * Parses markup of a single html element node
 */
HTMLParser.prototype.parseElementMarkup = function(node, startIndex) {
  var type = this.markupTypes.findByNode(node),
      selfClosing, endIndex;

  if (type) {
    selfClosing = type.selfClosing;
    if (!selfClosing && !node.hasChildNodes()) { return; } // check for empty nodes

    endIndex = startIndex + (selfClosing ? 0 : textOfNode(node).length);
    if (endIndex > startIndex || (selfClosing && endIndex === startIndex)) { // check for empty nodes
      return new MarkupModel({
        type       : type.id,
        type_name  : this.includeTypeNames && type.name,
        start      : startIndex,
        end        : endIndex,
        attributes : attributesForNode(node)
      });
    }
  }
};

ContentKit.HTMLParser = HTMLParser;


/**
 * Helper to retain stray elements at the root of the html that aren't blocks
 */
function handleNonBlockElementAtRoot(parser, elementNode, blocks) {
  var block = getLastBlockOrCreate(parser, blocks),
      markup = parser.parseElementMarkup(elementNode, block.value.length);
  if (markup) {
    block.markup.push(markup);
  }
  block.value += textOfNode(elementNode);
}

/**
 * Gets the last block in the set or creates and return a default block if none exist yet.
 */
function getLastBlockOrCreate(parser, blocks) {
  var block;
  if (blocks.length) {
    block = blocks[blocks.length - 1];
  } else {
    block = parser.parseBlock(doc.createElement(DefaultBlockTypeSet.TEXT.tag));
    blocks.push(block);
  }
  return block;
}

/**
 * @class HTMLRenderer
 * @constructor
 */
function HTMLRenderer(options) {
  var defaults = {
    typeRenderers : {},
    blockTypes    : DefaultBlockTypeSet,
    markupTypes   : DefaultMarkupTypeSet
  };
  merge(this, defaults, options);
}

/**
 * @method render
 * @param data
 * @return String html
 */
HTMLRenderer.prototype.render = function(data) {
  var html = '',
      len = data && data.length,
      i, block, typeRenderer, blockHtml;

  for (i = 0; i < len; i++) {
    block = data[i];
    typeRenderer = this.typeRenderers[block.type] || this.renderBlock;
    blockHtml = typeRenderer.call(this, block);
    if (blockHtml) { html += blockHtml; }
  }
  return html;
};

/**
 * @method renderBlock
 * @param block a block model
 * @return String html
 * Renders a block model into a HTML string.
 */
HTMLRenderer.prototype.renderBlock = function(block) {
  var type = this.blockTypes.findById(block.type),
      html = '', tagName, selfClosing;

  if (type) {
    tagName = type.tag;
    selfClosing = type.selfClosing;
    html += createOpeningTag(tagName, block.attributes, selfClosing);
    if (!selfClosing) {
      html += this.renderMarkup(block.value, block.markup);
      html += createCloseTag(tagName);
    }
  }
  return html;
};

/**
 * @method renderMarkup
 * @param text plain text to apply markup to
 * @param markup an array of markup models
 * @return String html
 * Renders a markup model into a HTML string.
 */
HTMLRenderer.prototype.renderMarkup = function(text, markups) {
  var parsedTagsIndexes = [],
      len = markups && markups.length, i;

  for (i = 0; i < len; i++) {
    var markup = markups[i],
        markupMeta = this.markupTypes.findById(markup.type),
        tagName = markupMeta.tag,
        selfClosing = markupMeta.selfClosing,
        start = markup.start,
        end = markup.end,
        openTag = createOpeningTag(tagName, markup.attributes, selfClosing),
        parsedTagLengthAtIndex = parsedTagsIndexes[start] || 0,
        parsedTagLengthBeforeIndex = sumArray(parsedTagsIndexes.slice(0, start + 1));

    text = injectIntoString(text, openTag, start + parsedTagLengthBeforeIndex);
    parsedTagsIndexes[start] = parsedTagLengthAtIndex + openTag.length;

    if (!selfClosing) {
      var closeTag = createCloseTag(tagName);
      parsedTagLengthAtIndex = parsedTagsIndexes[end] || 0;
      parsedTagLengthBeforeIndex = sumArray(parsedTagsIndexes.slice(0, end));
      text = injectIntoString(text, closeTag, end + parsedTagLengthBeforeIndex);
      parsedTagsIndexes[end]  = parsedTagLengthAtIndex + closeTag.length;
    }
  }

  return text;
};

/**
 * @method willRenderType
 * @param type type id
 * @param renderer the rendering function that returns a string of html
 * Registers custom rendering for a type
 */
HTMLRenderer.prototype.willRenderType = function(type, renderer) {
  this.typeRenderers[type] = renderer;
};

ContentKit.HTMLRenderer = HTMLRenderer;


/**
 * Builds an opening html tag. i.e. '<a href="http://link.com/" rel="author">'
 */
function createOpeningTag(tagName, attributes, selfClosing /*,blacklist*/) {
  var tag = '<' + tagName;
  for (var attr in attributes) {
    if (attributes.hasOwnProperty(attr)) {
      //if (blacklist && attr in blacklist) { continue; }
      tag += ' ' + attr + '="' + attributes[attr] + '"';
    }
  }
  if (selfClosing) { tag += '/'; }
  tag += '>';
  return tag;
}

/**
 * Builds a closing html tag. i.e. '</p>'
 */
function createCloseTag(tagName) {
  return '</' + tagName + '>';
}

}(this, document));
