/*!
 * @overview ContentKit-Compiler: Parses HTML to ContentKit's JSON schema and renders back to HTML.
 * @version  0.1.0
 * @author   Garth Poitras <garth22@gmail.com> (http://garthpoitras.com/)
 * @license  MIT
 * Last modified: Jan 29, 2015
 */
(function() {
    "use strict";
    /**
     * @class Model
     * @constructor
     * @private
     */
    function src$models$model$$Model(options) {
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
    src$models$model$$Model.createWithType = function(type, options) {
      options = options || {};
      options.type = type.id;
      options.type_name = type.name;
      return new this(options);
    };

    var src$models$model$$default = src$models$model$$Model;
    /**
     * Merges defaults/options into an Object
     * Useful for constructors
     */
    function node_modules$content$kit$utils$src$object$utils$$mergeWithOptions(original, updates, options) {
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
    function node_modules$content$kit$utils$src$object$utils$$merge(original, updates) {
      return node_modules$content$kit$utils$src$object$utils$$mergeWithOptions(original, updates);
    }

    /**
     * Prototype inheritance helper
     */
    function node_modules$content$kit$utils$src$object$utils$$inherit(Subclass, Superclass) {
      for (var key in Superclass) {
        if (Superclass.hasOwnProperty(key)) {
          Subclass[key] = Superclass[key];
        }
      }
      Subclass.prototype = new Superclass();
      Subclass.constructor = Subclass;
      Subclass._super = Superclass;
    }

    /**
     * Ensures block markups at the same index are always in a specific order.
     * For example, so all bold links are consistently marked up 
     * as <a><b>text</b></a> instead of <b><a>text</a></b>
     */
    function src$models$block$$sortBlockMarkups(markups) {
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
    function src$models$block$$BlockModel(options) {
      options = options || {};
      src$models$model$$default.call(this, options);
      this.value = options.value || '';
      this.markup = src$models$block$$sortBlockMarkups(options.markup || []);
    }

    node_modules$content$kit$utils$src$object$utils$$inherit(src$models$block$$BlockModel, src$models$model$$default);

    var src$models$block$$default = src$models$block$$BlockModel;

    /**
     * @class MarkupModel
     * @constructor
     * @extends Model
     */
    function src$models$markup$$MarkupModel(options) {
      options = options || {};
      src$models$model$$default.call(this, options);
      this.start = options.start || 0;
      this.end = options.end || 0;
    }

    node_modules$content$kit$utils$src$object$utils$$inherit(src$models$markup$$MarkupModel, src$models$model$$default);

    var src$models$markup$$default = src$models$markup$$MarkupModel;
    var node_modules$content$kit$utils$src$string$utils$$RegExpTrim        = /^\s+|\s+$/g;
    var node_modules$content$kit$utils$src$string$utils$$RegExpTrimLeft    = /^\s+/;
    var node_modules$content$kit$utils$src$string$utils$$RegExpWSChars     = /(\r\n|\n|\r|\t|\u00A0)/gm;
    var node_modules$content$kit$utils$src$string$utils$$RegExpMultiWS     = /\s+/g;
    var node_modules$content$kit$utils$src$string$utils$$RegExpNonAlphaNum = /[^a-zA-Z\d]/g;

    /**
     * String.prototype.trim polyfill
     * Removes whitespace at beginning and end of string
     */
    function node_modules$content$kit$utils$src$string$utils$$trim(string) {
      return string ? (string + '').replace(node_modules$content$kit$utils$src$string$utils$$RegExpTrim, '') : '';
    }

    /**
     * String.prototype.trimLeft polyfill
     * Removes whitespace at beginning of string
     */
    function node_modules$content$kit$utils$src$string$utils$$trimLeft(string) {
      return string ? (string + '').replace(node_modules$content$kit$utils$src$string$utils$$RegExpTrimLeft, '') : '';
    }

    /**
     * Replaces non-alphanumeric chars with underscores
     */
    function node_modules$content$kit$utils$src$string$utils$$underscore(string) {
      return string ? node_modules$content$kit$utils$src$string$utils$$trim(string + '').replace(node_modules$content$kit$utils$src$string$utils$$RegExpNonAlphaNum, '_') : '';
    }

    /**
     * Cleans line breaks, tabs, non-breaking spaces, then multiple occuring whitespaces.
     */
    function node_modules$content$kit$utils$src$string$utils$$sanitizeWhitespace(string) {
      return string ? (string + '').replace(node_modules$content$kit$utils$src$string$utils$$RegExpWSChars, '').replace(node_modules$content$kit$utils$src$string$utils$$RegExpMultiWS, ' ') : '';
    }

    /**
     * Injects a string into another string at the index specified
     */
    function node_modules$content$kit$utils$src$string$utils$$injectIntoString(string, injection, index) {
      return string.substr(0, index) + injection + string.substr(index);
    }

    /**
     * @class Type
     * @constructor
     * Contains meta info about a node type (id, name, tag, etc).
     */
    function src$types$type$$Type(options) {
      if (options) {
        this.name = node_modules$content$kit$utils$src$string$utils$$underscore(options.name || options.tag).toUpperCase();
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
        src$types$type$$Type[this.name] = this;
      }
    }

    var src$types$type$$default = src$types$type$$Type;

    /**
     * @class TypeSet
     * @private
     * @constructor
     * A Set of Types
     */
    function src$types$type$set$$TypeSet(types) {
      var len = types && types.length, i;

      this._autoId    = 1;  // Auto-increment id counter
      this.idLookup   = {}; // Hash cache for finding by id
      this.tagLookup  = {}; // Hash cache for finding by tag

      for (i = 0; i < len; i++) {
        this.addType(types[i]);
      }
    }

    src$types$type$set$$TypeSet.prototype = {
      /**
       * Adds a type to the set
       */
      addType: function(type) {
        if (type instanceof src$types$type$$default) {
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

    var src$types$type$set$$default = src$types$type$set$$TypeSet;

    /**
     * Default supported block types
     */
    var src$types$default$types$$DefaultBlockTypeSet = new src$types$type$set$$default([
      new src$types$type$$default({ tag: 'p', name: 'paragraph' }),
      new src$types$type$$default({ tag: 'h2', name: 'heading' }),
      new src$types$type$$default({ tag: 'h3', name: 'subheading' }),
      new src$types$type$$default({ tag: 'img', name: 'image', isTextType: false }),
      new src$types$type$$default({ tag: 'blockquote', name: 'quote' }),
      new src$types$type$$default({ tag: 'ul', name: 'list' }),
      new src$types$type$$default({ tag: 'ol', name: 'ordered list' }),
      new src$types$type$$default({ name: 'embed', isTextType: false })
    ]);

    /**
     * Default supported markup types
     */
    var src$types$default$types$$DefaultMarkupTypeSet = new src$types$type$set$$default([
      new src$types$type$$default({ tag: 'strong', name: 'bold', mappedTags: ['b'] }),
      new src$types$type$$default({ tag: 'em', name: 'italic', mappedTags: ['i'] }),
      new src$types$type$$default({ tag: 'u', name: 'underline' }),
      new src$types$type$$default({ tag: 'a', name: 'link' }),
      new src$types$type$$default({ tag: 'br', name: 'break' }),
      new src$types$type$$default({ tag: 'li', name: 'list item' }),
      new src$types$type$$default({ tag: 'sub', name: 'subscript' }),
      new src$types$type$$default({ tag: 'sup', name: 'superscript' })
    ]);

    /**
     * Converts an array-like object (i.e. NodeList) to Array
     * Note: could just use Array.prototype.slice but does not work in IE <= 8
     */
    function node_modules$content$kit$utils$src$array$utils$$toArray(obj) {
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
    function node_modules$content$kit$utils$src$array$utils$$sumSparseArray(array) {
      var sum = 0, i;
      for (i in array) { // 'for in' is better for sparse arrays
        if (array.hasOwnProperty(i)) {
          sum += array[i];
        }
      }
      return sum;
    }

    /**
     * A document instance separate from the page's document. (if browser supports it)
     * Prevents images, scripts, and styles from executing while parsing nodes.
     */
    var node_modules$content$kit$utils$src$node$utils$$standaloneDocument = (function() {
      var implementation = document.implementation;
      var createHTMLDocument = implementation.createHTMLDocument;

      if (createHTMLDocument) {
        return createHTMLDocument.call(implementation, '');
      }
      return document;
    })();

    /**
     * document.createElement with our lean, standalone document
     */
    function node_modules$content$kit$utils$src$node$utils$$createElement(type) {
      return node_modules$content$kit$utils$src$node$utils$$standaloneDocument.createElement(type);
    }

    /**
     * A reusable DOM Node for parsing html content.
     */
    var node_modules$content$kit$utils$src$node$utils$$DOMParsingNode = node_modules$content$kit$utils$src$node$utils$$createElement('div');

    /**
     * Returns plain-text of a `Node`
     */
    function node_modules$content$kit$utils$src$node$utils$$textOfNode(node) {
      var text = node.textContent || node.innerText;
      return text ? node_modules$content$kit$utils$src$string$utils$$sanitizeWhitespace(text) : '';
    }

    /**
     * Replaces a `Node` with its children
     */
    function node_modules$content$kit$utils$src$node$utils$$unwrapNode(node) {
      if (node.hasChildNodes()) {
        var children = node_modules$content$kit$utils$src$array$utils$$toArray(node.childNodes);
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
    function node_modules$content$kit$utils$src$node$utils$$attributesForNode(node, blacklist) {
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

    var src$parsers$html$parser$$ELEMENT_NODE = window.Node && Node.ELEMENT_NODE || 1;
    var src$parsers$html$parser$$TEXT_NODE    = window.Node && Node.TEXT_NODE    || 3;
    var src$parsers$html$parser$$defaultAttributeBlacklist = { 'style' : 1, 'class' : 1 };

    /**
     * Returns the last block in the set or creates a default block if none exist yet.
     */
    function src$parsers$html$parser$$getLastBlockOrCreate(blocks) {
      var blockCount = blocks.length, block;
      if (blockCount) {
        block = blocks[blockCount - 1];
      } else {
        block = src$models$block$$default.createWithType(src$types$type$$default.PARAGRAPH);
        blocks.push(block);
      }
      return block;
    }

    /**
     * Helper to parse elements at the root that aren't blocks
     */
    function src$parsers$html$parser$$handleNonBlockAtRoot(parser, elementNode, blocks) {
      var block = src$parsers$html$parser$$getLastBlockOrCreate(blocks);
      var markup = parser.parseMarkupForElement(elementNode, block.value.length);
      if (markup) {
        block.markup = block.markup.concat(markup);
      }
      block.value += node_modules$content$kit$utils$src$node$utils$$textOfNode(elementNode);
    }

    /**
     * @class HTMLParser
     * @constructor
     */
    function src$parsers$html$parser$$HTMLParser(options) {
      var defaults = {
        blockTypes         : src$types$default$types$$DefaultBlockTypeSet,
        markupTypes        : src$types$default$types$$DefaultMarkupTypeSet,
        attributeBlacklist : src$parsers$html$parser$$defaultAttributeBlacklist,
        includeTypeNames   : false
      };
      node_modules$content$kit$utils$src$object$utils$$mergeWithOptions(this, defaults, options);
    }

    /**
     * @method parse
     * @param html String of HTML content
     * @return Array Parsed JSON content array
     */
    src$parsers$html$parser$$HTMLParser.prototype.parse = function(html) {
      node_modules$content$kit$utils$src$node$utils$$DOMParsingNode.innerHTML = node_modules$content$kit$utils$src$string$utils$$sanitizeWhitespace(html);

      var nodes = node_modules$content$kit$utils$src$array$utils$$toArray(node_modules$content$kit$utils$src$node$utils$$DOMParsingNode.childNodes);
      var nodeCount = nodes.length;
      var blocks = [];
      var i, node, nodeType, block, text;

      for (i = 0; i < nodeCount; i++) {
        node = nodes[i];
        nodeType = node.nodeType;

        if (nodeType === src$parsers$html$parser$$ELEMENT_NODE) {
          block = this.serializeBlockNode(node);
          if (block) {
            blocks.push(block);
          } else {
            src$parsers$html$parser$$handleNonBlockAtRoot(this, node, blocks);
          }
        } else if (nodeType === src$parsers$html$parser$$TEXT_NODE) {
          text = node.nodeValue;
          if (node_modules$content$kit$utils$src$string$utils$$trim(text)) {
            block = src$parsers$html$parser$$getLastBlockOrCreate(blocks);
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
    src$parsers$html$parser$$HTMLParser.prototype.parseMarkupForElement = function(node, startOffset) {
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

        if (nodeType === src$parsers$html$parser$$ELEMENT_NODE) {
          markup = this.serializeMarkupNode(currentNode, startOffset);
          if (markup) { markups.push(markup); }
          node_modules$content$kit$utils$src$node$utils$$unwrapNode(currentNode);
        } else if (nodeType === src$parsers$html$parser$$TEXT_NODE) {
          var text = node_modules$content$kit$utils$src$string$utils$$sanitizeWhitespace(currentNode.nodeValue);
          if (index === 0) { text = node_modules$content$kit$utils$src$string$utils$$trimLeft(text); }
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
    src$parsers$html$parser$$HTMLParser.prototype.serializeBlockNode = function(node) {
      var type = this.blockTypes.findByNode(node);
      if (type) {
        return new src$models$block$$default({
          type       : type.id,
          type_name  : this.includeTypeNames && type.name,
          value      : node_modules$content$kit$utils$src$string$utils$$trim(node_modules$content$kit$utils$src$node$utils$$textOfNode(node)),
          attributes : node_modules$content$kit$utils$src$node$utils$$attributesForNode(node, this.attributeBlacklist),
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
    src$parsers$html$parser$$HTMLParser.prototype.serializeMarkupNode = function(node, startIndex) {
      var type = this.markupTypes.findByNode(node);
      var selfClosing, endIndex;

      if (type) {
        selfClosing = type.selfClosing;
        if (!selfClosing && !node.hasChildNodes()) { return; } // check for empty nodes

        endIndex = startIndex + (selfClosing ? 0 : node_modules$content$kit$utils$src$node$utils$$textOfNode(node).length);
        if (endIndex > startIndex || (selfClosing && endIndex === startIndex)) { // check for empty nodes
          return new src$models$markup$$default({
            type       : type.id,
            type_name  : this.includeTypeNames && type.name,
            start      : startIndex,
            end        : endIndex,
            attributes : node_modules$content$kit$utils$src$node$utils$$attributesForNode(node, this.attributeBlacklist)
          });
        }
      }
    };

    var src$parsers$html$parser$$default = src$parsers$html$parser$$HTMLParser;

    /**
     * Builds an opening html tag. i.e. '<a href="http://link.com/" rel="author">'
     */
    function src$renderers$html$element$renderer$$createOpeningTag(tagName, attributes, selfClosing) {
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
    function src$renderers$html$element$renderer$$createCloseTag(tagName) {
      return '</' + tagName + '>';
    }

    /**
     * @class HTMLElementRenderer
     * @constructor
     */
    function src$renderers$html$element$renderer$$HTMLElementRenderer(options) {
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
    src$renderers$html$element$renderer$$HTMLElementRenderer.prototype.render = function(model) {
      var html = '';
      var type = this.type;
      var tagName = type.tag;
      var selfClosing = type.selfClosing;

      if (tagName) {
        html += src$renderers$html$element$renderer$$createOpeningTag(tagName, model.attributes, selfClosing);
      }
      if (!selfClosing) {
        html += this.renderMarkup(model.value, model.markup);
        if (tagName) {
          html += src$renderers$html$element$renderer$$createCloseTag(tagName);
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
    src$renderers$html$element$renderer$$HTMLElementRenderer.prototype.renderMarkup = function(text, markups) {
      var parsedTagsIndexes = [];
      var len = markups && markups.length, i;

      for (i = 0; i < len; i++) {
        var markup = markups[i],
            markupMeta = this.markupTypes.findById(markup.type),
            tagName = markupMeta.tag,
            selfClosing = markupMeta.selfClosing,
            start = markup.start,
            end = markup.end,
            openTag = src$renderers$html$element$renderer$$createOpeningTag(tagName, markup.attributes, selfClosing),
            parsedTagLengthAtIndex = parsedTagsIndexes[start] || 0,
            parsedTagLengthBeforeIndex = node_modules$content$kit$utils$src$array$utils$$sumSparseArray(parsedTagsIndexes.slice(0, start + 1));

        text = node_modules$content$kit$utils$src$string$utils$$injectIntoString(text, openTag, start + parsedTagLengthBeforeIndex);
        parsedTagsIndexes[start] = parsedTagLengthAtIndex + openTag.length;

        if (!selfClosing) {
          var closeTag = src$renderers$html$element$renderer$$createCloseTag(tagName);
          parsedTagLengthAtIndex = parsedTagsIndexes[end] || 0;
          parsedTagLengthBeforeIndex = node_modules$content$kit$utils$src$array$utils$$sumSparseArray(parsedTagsIndexes.slice(0, end));
          text = node_modules$content$kit$utils$src$string$utils$$injectIntoString(text, closeTag, end + parsedTagLengthBeforeIndex);
          parsedTagsIndexes[end]  = parsedTagLengthAtIndex + closeTag.length;
        }
      }

      return text;
    };

    var src$renderers$html$element$renderer$$default = src$renderers$html$element$renderer$$HTMLElementRenderer;

    /**
     * @class HTMLRenderer
     * @constructor
     */
    function src$renderers$html$renderer$$HTMLRenderer(options) {
      var defaults = {
        blockTypes    : src$types$default$types$$DefaultBlockTypeSet,
        markupTypes   : src$types$default$types$$DefaultMarkupTypeSet,
        typeRenderers : {}
      };
      node_modules$content$kit$utils$src$object$utils$$mergeWithOptions(this, defaults, options);
    }

    /**
     * @method willRenderType
     * @param type {Number|Type}
     * @param renderer the rendering function that returns a string of html
     * Registers custom rendering hooks for a type
     */
    src$renderers$html$renderer$$HTMLRenderer.prototype.willRenderType = function(type, renderer) {
      if ('number' !== typeof type) {
        type = type.id;
      }
      this.typeRenderers[type] = renderer;
    };

    /**
     * @method rendererFor
     * @param model
     * @returns renderer
     * Returns an instance of a renderer for supplied model
     */
    src$renderers$html$renderer$$HTMLRenderer.prototype.rendererFor = function(model) {
      var type = this.blockTypes.findById(model.type);
      var attrs = model.attributes;
      if (type === src$types$type$$default.EMBED) {
        return attrs && attrs.html || '';
      }
      return new src$renderers$html$element$renderer$$default({ type: type, markupTypes: this.markupTypes });
    };

    /**
     * @method render
     * @param model
     * @return String html
     */
    src$renderers$html$renderer$$HTMLRenderer.prototype.render = function(model) {
      var html = '';
      var len = model && model.length;
      var i, item, renderer, renderHook, itemHtml;

      for (i = 0; i < len; i++) {
        item = model[i];
        renderer = this.rendererFor(item);
        renderHook = this.typeRenderers[item.type];
        itemHtml = renderHook ? renderHook.call(renderer, item) : renderer.render(item);
        if (itemHtml) { html += itemHtml; }
      }
      return html;
    };

    var src$renderers$html$renderer$$default = src$renderers$html$renderer$$HTMLRenderer;

    /**
     * @class Compiler
     * @constructor
     * @param options
     */
    function src$compiler$$Compiler(options) {
      var parser = new src$parsers$html$parser$$default();
      var renderer = new src$renderers$html$renderer$$default();
      var defaults = {
        parser           : parser,
        renderer         : renderer,
        blockTypes       : src$types$default$types$$DefaultBlockTypeSet,
        markupTypes      : src$types$default$types$$DefaultMarkupTypeSet,
        includeTypeNames : false // Outputs `type_name:'HEADING'` etc. when parsing. Good for debugging.
      };
      node_modules$content$kit$utils$src$object$utils$$mergeWithOptions(this, defaults, options);

      // Reference the compiler settings
      parser.blockTypes  = renderer.blockTypes  = this.blockTypes;
      parser.markupTypes = renderer.markupTypes = this.markupTypes;
      parser.includeTypeNames = this.includeTypeNames;
    }

    /**
     * @method parse
     * @param input
     * @return Array
     */
    src$compiler$$Compiler.prototype.parse = function(input) {
      return this.parser.parse(input);
    };

    /**
     * @method render
     * @param model
     * @return String
     */
    src$compiler$$Compiler.prototype.render = function(model) {
      return this.renderer.render(model);
    };

    /**
     * @method rerender
     * @param input
     * @return String
     */
    src$compiler$$Compiler.prototype.rerender = function(input) {
      return this.render(this.parse(input));
    };

    /**
     * @method reparse
     * @param model
     * @return String
     */
    src$compiler$$Compiler.prototype.reparse = function(model) {
      return this.parse(this.render(model));
    };

    /**
     * @method registerBlockType
     * @param {Type} type
     */
    src$compiler$$Compiler.prototype.registerBlockType = function(type) {
      return this.blockTypes.addType(type);
    };

    /**
     * @method registerMarkupType
     * @param {Type} type
     */
    src$compiler$$Compiler.prototype.registerMarkupType = function(type) {
      return this.markupTypes.addType(type);
    };

    var src$compiler$$default = src$compiler$$Compiler;

    /**
     * @class EmbedModel
     * @constructor
     * @extends Model
     * Massages data from an oEmbed response into an EmbedModel
     */
    function src$models$embed$$EmbedModel(options) {
      if (!options) { return null; }

      src$models$model$$default.call(this, {
        type: src$types$type$$default.EMBED.id,
        type_name: src$types$type$$default.EMBED.name,
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

    var src$models$embed$$default = src$models$embed$$EmbedModel;

    /**
     * @namespace ContentKit
     * Merge public modules into the common ContentKit namespace.
     */
    var src$index$$ContentKit = window.ContentKit = window.ContentKit || {};
    src$index$$ContentKit.Type = src$types$type$$default;
    src$index$$ContentKit.BlockModel = src$models$block$$default;
    src$index$$ContentKit.EmbedModel = src$models$embed$$default;
    src$index$$ContentKit.Compiler = src$compiler$$default;
    src$index$$ContentKit.HTMLParser = src$parsers$html$parser$$default;
    src$index$$ContentKit.HTMLRenderer = src$renderers$html$renderer$$default;
}).call(this);

//# sourceMappingURL=bundle.map