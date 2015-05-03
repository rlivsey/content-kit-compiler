(function () { 'use strict';

  var RegExpTrim        = /^\s+|\s+$/g;
  var RegExpTrimLeft    = /^\s+/;
  var RegExpWSChars     = /(\r\n|\n|\r|\t)/gm;
  var RegExpMultiWS     = /\s+/g;
  var RegExpNonAlphaNum = /[^a-zA-Z\d]/g;

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
    return string ? trim(string + '').replace(RegExpNonAlphaNum, '_') : '';
  }

  /**
   * Cleans line breaks, tabs, then multiple occuring whitespaces.
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

  function Type(options) {
    if (options) {
      this.name = underscore(options.name || options.tag).toUpperCase();
      this.isTextType = options.isTextType !== undefined ? options.isTextType : true;

      if (options.id !== undefined) {
        this.id = options.id;
      }
      if (options.tag) {
        this.tag = options.tag.toLowerCase();
        this.selfClosing = /^(br|img|hr|meta|link|embed)$/i.test(this.tag);
        if (options.mappedTags) {
          this.mappedTags = options.mappedTags;
        }
      }

      // Register the type as constant
      Type[this.name] = this;
    }
  }

  var types_type = Type;

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
   * @method createWithType
   * @static
   * @param type Type
   * @param options Object
   */
  Model.createWithType = function(type, options) {
    options = options || {};
    options.type = type.id;
    options.type_name = type.name;
    return new this(options);
  };

  var models_model = Model;

  /**
   * Merges defaults/options into an Object
   * Useful for constructors
   */
  function mergeWithOptions(original, updates, options) {
    options = options || {};
    for(var prop in updates) {
      if (options.hasOwnProperty(prop)) {
        original[prop] = options[prop];
      } else if (updates.hasOwnProperty(prop)) {
        original[prop] = updates[prop];
      }
    }
    return original;
  }

  /**
   * Merges properties of one object into another
   */
  function merge(original, updates) {
    return mergeWithOptions(original, updates);
  }

  /**
   * Prototype inheritance helper
   */
  function inherit(Subclass, Superclass) {
    for (var key in Superclass) {
      if (Superclass.hasOwnProperty(key)) {
        Subclass[key] = Superclass[key];
      }
    }
    Subclass.prototype = new Superclass();
    Subclass.constructor = Subclass;
    Subclass._super = Superclass;
  }

  function sortBlockMarkups(markups) {
    return markups.sort(function(a, b) {
      if (a.start === b.start && a.end === b.end) {
        return b.type - a.type;
      }
      return 0;
    });
  }

  /**
   * @class BlockModel
   * @constructor
   * @extends Model
   */
  function BlockModel(options) {
    options = options || {};
    models_model.call(this, options);
    this.value = options.value || '';
    this.markup = sortBlockMarkups(options.markup || []);
  }

  inherit(BlockModel, models_model);

  var models_block = BlockModel;

  function EmbedModel(options) {
    if (!options) { return null; }

    models_model.call(this, {
      type: types_type.EMBED.id,
      type_name: types_type.EMBED.name,
      attributes: {}
    });

    // Massage the oEmbed data
    var attributes = this.attributes;
    var embedType = options.type;
    var providerName = options.provider_name;
    var embedUrl = options.url;
    var embedTitle = options.title;
    var embedThumbnail = options.thumbnail_url;
    var embedHtml = options.html;

    if (embedType)    { attributes.embed_type = embedType; }
    if (providerName) { attributes.provider_name = providerName; }
    if (embedUrl)     { attributes.url = embedUrl; }
    if (embedTitle)   { attributes.title = embedTitle; }

    if (embedType === 'photo') {
      attributes.thumbnail = options.media_url || embedUrl;
    } else if (embedThumbnail) {
      attributes.thumbnail = embedThumbnail;
    }

    if (embedHtml && (embedType === 'rich' || embedType === 'video')) {
      attributes.html = embedHtml;
    }
  }

  var embed = EmbedModel;

  /**
   * Abstracted `document` between node.js and browser
  */

  var doc;

  if (typeof exports === 'object') {
    var jsdom = require('jsdom').jsdom;
    doc = jsdom();
  } else {
    // A document instance separate from the html page document. (if browser supports it)
    // Prevents images, scripts, and styles from executing while parsing
    var implementation = document.implementation;
    var createHTMLDocument = implementation.createHTMLDocument;
    if (createHTMLDocument) {
      doc = createHTMLDocument.call(implementation, '');
    } else {
      doc = document;
    }
  }

  var parserDocument = doc;

  function MarkupModel(options) {
    options = options || {};
    models_model.call(this, options);
    this.start = options.start || 0;
    this.end = options.end || 0;
  }

  inherit(MarkupModel, models_model);

  var models_markup = MarkupModel;

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
      if (type instanceof types_type) {
        this[type.name] = type;
        if (type.id === undefined) {
          type.id = this._autoId++;
        }
        this.idLookup[type.id] = type;
        if (type.tag) {
          this.tagLookup[type.tag] = type;
          if (type.mappedTags) {
            for (var i = 0, len = type.mappedTags.length; i < len; i++) {
              this.tagLookup[type.mappedTags[i]] = type;
            }
          }
        }
        return type;
      }
    },

    /**
     * Returns type info for a given Node
     */
    findByNode: function(node) {
      if (node) {
        return this.findByTag(node.tagName);
      }
    },
    /**
     * Returns type info for a given tag
     */
    findByTag: function(tag) {
      if (tag) {
        return this.tagLookup[tag.toLowerCase()];
      }
    },
    /**
     * Returns type info for a given id
     */
    findById: function(id) {
      return this.idLookup[id];
    }
  };

  var type_set = TypeSet;

  var DefaultBlockTypeSet = new type_set([
    new types_type({ tag: 'p', name: 'paragraph' }),
    new types_type({ tag: 'h2', name: 'heading' }),
    new types_type({ tag: 'h3', name: 'subheading' }),
    new types_type({ tag: 'img', name: 'image', isTextType: false }),
    new types_type({ tag: 'blockquote', name: 'quote' }),
    new types_type({ tag: 'ul', name: 'list' }),
    new types_type({ tag: 'ol', name: 'ordered list' }),
    new types_type({ name: 'embed', isTextType: false })
  ]);

  /**
   * Default supported markup types
   */
  var DefaultMarkupTypeSet = new type_set([
    new types_type({ tag: 'strong', name: 'bold', mappedTags: ['b'] }),
    new types_type({ tag: 'em', name: 'italic', mappedTags: ['i'] }),
    new types_type({ tag: 'u', name: 'underline' }),
    new types_type({ tag: 'a', name: 'link' }),
    new types_type({ tag: 'br', name: 'break' }),
    new types_type({ tag: 'li', name: 'list item' }),
    new types_type({ tag: 'sub', name: 'subscript' }),
    new types_type({ tag: 'sup', name: 'superscript' })
  ]);

  /**
   * Converts an array-like object (i.e. NodeList) to Array
   * Note: could just use Array.prototype.slice but does not work in IE <= 8
   */
  function toArray(obj) {
    var array = [];
    var i = obj && obj.length >>> 0; // cast to Uint32
    while (i--) {
      array[i] = obj[i];
    }
    return array;
  }

  /**
   * Computes the sum of values in a (sparse) array
   */
  function sumSparseArray(array) {
    var sum = 0, i;
    for (i in array) { // 'for in' is better for sparse arrays
      if (array.hasOwnProperty(i)) {
        sum += array[i];
      }
    }
    return sum;
  }

  function textOfNode(node) {
    var text = node.textContent || node.innerText;
    return text ? sanitizeWhitespace(text) : '';
  }

  /**
   * Replaces a `Node` with its children
   */
  function unwrapNode(node) {
    if (node.hasChildNodes()) {
      var children = toArray(node.childNodes);
      var len = children.length;
      var parent = node.parentNode, i;
      for (i = 0; i < len; i++) {
        parent.insertBefore(children[i], node);
      }
    }
  }

  /**
   * Extracts attributes of a `Node` to a hash of key/value pairs
   */
  function attributesForNode(node, blacklist) {
    var attrs = node.attributes;
    var len = attrs && attrs.length;
    var i, attr, name, hash;
    
    for (i = 0; i < len; i++) {
      attr = attrs[i];
      name = attr.name;
      if (attr.specified && attr.value) {
        if (blacklist && (name in blacklist)) { continue; }
        hash = hash || {};
        hash[name] = attr.value;
      }
    }
    return hash;
  }

  var ELEMENT_NODE = 1;
  var TEXT_NODE    = 3;
  var defaultAttributeBlacklist = { 'style' : 1, 'class' : 1 };

  /**
   * Returns the last block in the set or creates a default block if none exist yet.
   */
  function getLastBlockOrCreate(blocks) {
    var blockCount = blocks.length, block;
    if (blockCount) {
      block = blocks[blockCount - 1];
    } else {
      block = models_block.createWithType(types_type.PARAGRAPH);
      blocks.push(block);
    }
    return block;
  }

  /**
   * Helper to parse elements at the root that aren't blocks
   */
  function handleNonBlockAtRoot(parser, elementNode, blocks) {
    var block = getLastBlockOrCreate(blocks);
    var markup = parser.parseMarkupForElement(elementNode, block.value.length);
    if (markup) {
      block.markup = block.markup.concat(markup);
    }
    block.value += textOfNode(elementNode);
  }

  /**
   * @class HTMLParser
   * @constructor
   */
  function HTMLParser(options) {
    var defaults = {
      blockTypes         : DefaultBlockTypeSet,
      markupTypes        : DefaultMarkupTypeSet,
      attributeBlacklist : defaultAttributeBlacklist,
      includeTypeNames   : false
    };
    mergeWithOptions(this, defaults, options);
  }

  /**
   * @method parse
   * @param html String of HTML content
   * @return Array Parsed JSON content array
   */
  HTMLParser.prototype.parse = function(html) {
    var parsingNode = parserDocument.createElement('div');
    parsingNode.innerHTML = sanitizeWhitespace(html);

    var nodes = toArray(parsingNode.childNodes);
    var nodeCount = nodes.length;
    var blocks = [];
    var i, node, nodeType, block, text;

    for (i = 0; i < nodeCount; i++) {
      node = nodes[i];
      nodeType = node.nodeType;

      if (nodeType === ELEMENT_NODE) {
        block = this.serializeBlockNode(node);
        if (block) {
          blocks.push(block);
        } else {
          handleNonBlockAtRoot(this, node, blocks);
        }
      } else if (nodeType === TEXT_NODE) {
        text = node.nodeValue;
        if (trim(text)) {
          block = getLastBlockOrCreate(blocks);
          block.value += text;
        }
      }
    }

    return blocks;
  };

  /**
   * @method parseMarkupForElement
   * @param node element node to parse
   * @return {Array} parsed markups
   */
  HTMLParser.prototype.parseMarkupForElement = function(node, startOffset) {
    var index = 0;
    var markups = [];
    var currentNode, nodeType, markup;

    startOffset = startOffset || 0;
    node = node.cloneNode(true);
    markup = this.serializeMarkupNode(node, startOffset);
    if (markup) { markups.push(markup); }

    while (node.hasChildNodes()) {
      currentNode = node.firstChild;
      nodeType = currentNode.nodeType;

      if (nodeType === ELEMENT_NODE) {
        markup = this.serializeMarkupNode(currentNode, startOffset);
        if (markup) { markups.push(markup); }
        unwrapNode(currentNode);
      } else if (nodeType === TEXT_NODE) {
        var text = sanitizeWhitespace(currentNode.nodeValue);
        if (index === 0) { text = trimLeft(text); }
        if (text) { startOffset += text.length; }
      }

      currentNode.parentNode.removeChild(currentNode);
      index++;
    }

    return markups;
  };

  /**
   * @method serializeBlockNode
   * @param node element node to parse
   * @return {BlockModel} parsed block model
   * Serializes a single block type node into a model
   */
  HTMLParser.prototype.serializeBlockNode = function(node) {
    var type = this.blockTypes.findByNode(node);
    if (type) {
      return new models_block({
        type       : type.id,
        type_name  : this.includeTypeNames && type.name,
        value      : trim(textOfNode(node)),
        attributes : attributesForNode(node, this.attributeBlacklist),
        markup     : this.parseMarkupForElement(node)
      });
    }
  };

  /**
   * @method serializeMarkupNode
   * @param node element node to parse
   * @param startIndex 
   * @return {MarkupModel} markup model
   * Serializes markup of a single html element node (no child elements)
   */
  HTMLParser.prototype.serializeMarkupNode = function(node, startIndex) {
    var type = this.markupTypes.findByNode(node);
    var selfClosing, endIndex;

    if (type) {
      selfClosing = type.selfClosing;
      if (!selfClosing && !node.hasChildNodes()) { return; } // check for empty nodes

      endIndex = startIndex + (selfClosing ? 0 : textOfNode(node).length);
      if (endIndex > startIndex || (selfClosing && endIndex === startIndex)) { // check for empty nodes
        return new models_markup({
          type       : type.id,
          type_name  : this.includeTypeNames && type.name,
          start      : startIndex,
          end        : endIndex,
          attributes : attributesForNode(node, this.attributeBlacklist)
        });
      }
    }
  };

  var html_parser = HTMLParser;

  function createOpeningTag(tagName, attributes, selfClosing) {
    var tag = '<' + tagName;
    for (var attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
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

  /**
   * @class HTMLElementRenderer
   * @constructor
   */
  function HTMLElementRenderer(options) {
    options = options || {};
    this.type = options.type;
    this.markupTypes = options.markupTypes;
  }

  /**
   * @method render
   * @param model a block model
   * @return String html
   * Renders a block model into a HTML string.
   */
  HTMLElementRenderer.prototype.render = function(model) {
    var html = '';
    var type = this.type;
    var tagName = type.tag;
    var selfClosing = type.selfClosing;

    if (tagName) {
      html += createOpeningTag(tagName, model.attributes, selfClosing);
    }
    if (!selfClosing) {
      html += this.renderMarkup(model.value, model.markup);
      if (tagName) {
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
  HTMLElementRenderer.prototype.renderMarkup = function(text, markups) {
    var parsedTagsIndexes = [];
    var len = markups && markups.length, i;

    for (i = 0; i < len; i++) {
      var markup = markups[i],
          markupMeta = this.markupTypes.findById(markup.type),
          tagName = markupMeta.tag,
          selfClosing = markupMeta.selfClosing,
          start = markup.start,
          end = markup.end,
          openTag = createOpeningTag(tagName, markup.attributes, selfClosing),
          parsedTagLengthAtIndex = parsedTagsIndexes[start] || 0,
          parsedTagLengthBeforeIndex = sumSparseArray(parsedTagsIndexes.slice(0, start + 1));

      text = injectIntoString(text, openTag, start + parsedTagLengthBeforeIndex);
      parsedTagsIndexes[start] = parsedTagLengthAtIndex + openTag.length;

      if (!selfClosing) {
        var closeTag = createCloseTag(tagName);
        parsedTagLengthAtIndex = parsedTagsIndexes[end] || 0;
        parsedTagLengthBeforeIndex = sumSparseArray(parsedTagsIndexes.slice(0, end));
        text = injectIntoString(text, closeTag, end + parsedTagLengthBeforeIndex);
        parsedTagsIndexes[end]  = parsedTagLengthAtIndex + closeTag.length;
      }
    }

    return text;
  };

  var html_element_renderer = HTMLElementRenderer;

  /**
   * @class HTMLEmbedRenderer
   * @constructor
   */
  function HTMLEmbedRenderer() {}

  /**
   * @method render
   * @param model a block model
   * @return String html
   */
  HTMLEmbedRenderer.prototype.render = function(model) {
    var attrs = model.attributes;
    return attrs && attrs.html || '';
  };

  var html_embed_renderer = HTMLEmbedRenderer;

  function HTMLRenderer(options) {
    var defaults = {
      blockTypes    : DefaultBlockTypeSet,
      markupTypes   : DefaultMarkupTypeSet,
      typeRenderers : {}
    };
    mergeWithOptions(this, defaults, options);
  }

  /**
   * @method rendererFor
   * @param block
   * @returns renderer
   * Returns an instance of a renderer for supplied block model
   */
  HTMLRenderer.prototype.rendererFor = function(block) {
    var type = this.blockTypes.findById(block.type);
    if (type === types_type.EMBED) {
      return new html_embed_renderer();
    }
    return new html_element_renderer({ type: type, markupTypes: this.markupTypes });
  };

  /**
   * @method render
   * @param model
   * @return String html
   */
  HTMLRenderer.prototype.render = function(model) {
    var html = '';
    var len = model && model.length;
    var i, blockHtml;

    for (i = 0; i < len; i++) {
      blockHtml = this.renderBlock(model[i]);
      if (blockHtml) { 
        html += blockHtml;
      }
    }

    return html;
  };

  /**
   * @method renderBlock
   * @param block
   * @return String html
   */
  HTMLRenderer.prototype.renderBlock = function(block) {
    var renderer = this.rendererFor(block);
    var renderHook = this.typeRenderers[block.type];
    return renderHook ? renderHook.call(renderer, block) : renderer.render(block);
  };

  var html_renderer = HTMLRenderer;

  function Compiler(options) {
    var parser = new html_parser();
    var renderer = new html_renderer();
    var defaults = {
      parser           : parser,
      renderer         : renderer,
      blockTypes       : DefaultBlockTypeSet,
      markupTypes      : DefaultMarkupTypeSet,
      includeTypeNames : false // Outputs `type_name:'HEADING'` etc. when parsing. Good for debugging.
    };
    mergeWithOptions(this, defaults, options);

    // Reference the compiler settings
    this.parser.blockTypes  = this.renderer.blockTypes  = this.blockTypes;
    this.parser.markupTypes = this.renderer.markupTypes = this.markupTypes;
    this.parser.includeTypeNames = this.includeTypeNames;
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
  Compiler.prototype.render = function(model) {
    return this.renderer.render(model);
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

  var compiler = Compiler;

  var ContentKit = {};
  ContentKit.Type = types_type;
  ContentKit.BlockModel = models_block;
  ContentKit.EmbedModel = embed;
  ContentKit.Compiler = compiler;
  ContentKit.HTMLParser = html_parser;
  ContentKit.HTMLRenderer = html_renderer;

  var main = ContentKit;

  if (typeof exports === 'object') {
    module.exports = main;
  } else {
    window.ContentKit = main;
  }

})();