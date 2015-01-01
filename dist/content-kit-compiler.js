/*!
 * @overview ContentKit-Compiler: Parses HTML to ContentKit's JSON schema and renders back to HTML.
 * @version  0.1.0
 * @author   Garth Poitras <garth22@gmail.com> (http://garthpoitras.com/)
 * @license  MIT
 * Last modified: Jan 1, 2015
 */
(function() {
    "use strict";
    var src$content$kit$utils$string$utils$$RegExpTrim        = /^\s+|\s+$/g;
    var src$content$kit$utils$string$utils$$RegExpTrimLeft    = /^\s+/;
    var src$content$kit$utils$string$utils$$RegExpWSChars     = /(\r\n|\n|\r|\t|\u00A0)/gm;
    var src$content$kit$utils$string$utils$$RegExpMultiWS     = /\s+/g;
    var src$content$kit$utils$string$utils$$RegExpNonAlphaNum = /[^a-zA-Z\d]/g;

    /**
     * String.prototype.trim polyfill
     * Removes whitespace at beginning and end of string
     */
    function src$content$kit$utils$string$utils$$trim(string) {
      return string ? (string + '').replace(src$content$kit$utils$string$utils$$RegExpTrim, '') : '';
    }

    /**
     * String.prototype.trimLeft polyfill
     * Removes whitespace at beginning of string
     */
    function src$content$kit$utils$string$utils$$trimLeft(string) {
      return string ? (string + '').replace(src$content$kit$utils$string$utils$$RegExpTrimLeft, '') : '';
    }

    /**
     * Replaces non-alphanumeric chars with underscores
     */
    function src$content$kit$utils$string$utils$$underscore(string) {
      return string ? src$content$kit$utils$string$utils$$trim(string + '').replace(src$content$kit$utils$string$utils$$RegExpNonAlphaNum, '_') : '';
    }

    /**
     * Cleans line breaks, tabs, non-breaking spaces, then multiple occuring whitespaces.
     */
    function src$content$kit$utils$string$utils$$sanitizeWhitespace(string) {
      return string ? (string + '').replace(src$content$kit$utils$string$utils$$RegExpWSChars, '').replace(src$content$kit$utils$string$utils$$RegExpMultiWS, ' ') : '';
    }

    /**
     * Injects a string into another string at the index specified
     */
    function src$content$kit$utils$string$utils$$injectIntoString(string, injection, index) {
      return string.substr(0, index) + injection + string.substr(index);
    }

    /**
     * @class Type
     * @constructor
     * Contains meta info about a node type (id, name, tag, etc).
     */
    function src$content$kit$compiler$types$type$$Type(options) {
      if (options) {
        this.name = src$content$kit$utils$string$utils$$underscore(options.name || options.tag).toUpperCase();
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
        src$content$kit$compiler$types$type$$Type[this.name] = this;
      }
    }

    var src$content$kit$compiler$types$type$$default = src$content$kit$compiler$types$type$$Type;
    /**
     * @class Model
     * @constructor
     * @private
     */
    function src$content$kit$compiler$models$model$$Model(options) {
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
    src$content$kit$compiler$models$model$$Model.createWithType = function(type, options) {
      options = options || {};
      options.type = type.id;
      options.type_name = type.name;
      return new this(options);
    };

    var src$content$kit$compiler$models$model$$default = src$content$kit$compiler$models$model$$Model;
    /**
     * Merges defaults/options into an Object
     * Useful for constructors
     */
    function src$content$kit$utils$object$utils$$mergeWithOptions(original, updates, options) {
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
    function src$content$kit$utils$object$utils$$merge(original, updates) {
      return src$content$kit$utils$object$utils$$mergeWithOptions(original, updates);
    }

    /**
     * Prototype inheritance helper
     */
    function src$content$kit$utils$object$utils$$inherit(Subclass, Superclass) {
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
    function src$content$kit$compiler$models$block$$sortBlockMarkups(markups) {
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
    function src$content$kit$compiler$models$block$$BlockModel(options) {
      options = options || {};
      src$content$kit$compiler$models$model$$default.call(this, options);
      this.value = options.value || '';
      this.markup = src$content$kit$compiler$models$block$$sortBlockMarkups(options.markup || []);
    }

    src$content$kit$utils$object$utils$$inherit(src$content$kit$compiler$models$block$$BlockModel, src$content$kit$compiler$models$model$$default);

    var src$content$kit$compiler$models$block$$default = src$content$kit$compiler$models$block$$BlockModel;

    /**
     * @class EmbedModel
     * @constructor
     * @extends Model
     * Massages data from an oEmbed response into an EmbedModel
     */
    function src$content$kit$compiler$models$embed$$EmbedModel(options) {
      if (!options) { return null; }

      src$content$kit$compiler$models$model$$default.call(this, {
        type: src$content$kit$compiler$types$type$$default.EMBED.id,
        type_name: src$content$kit$compiler$types$type$$default.EMBED.name,
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

    var src$content$kit$compiler$models$embed$$default = src$content$kit$compiler$models$embed$$EmbedModel;

    /**
     * @class MarkupModel
     * @constructor
     * @extends Model
     */
    function src$content$kit$compiler$models$markup$$MarkupModel(options) {
      options = options || {};
      src$content$kit$compiler$models$model$$default.call(this, options);
      this.start = options.start || 0;
      this.end = options.end || 0;
    }

    src$content$kit$utils$object$utils$$inherit(src$content$kit$compiler$models$markup$$MarkupModel, src$content$kit$compiler$models$model$$default);

    var src$content$kit$compiler$models$markup$$default = src$content$kit$compiler$models$markup$$MarkupModel;

    /**
     * @class TypeSet
     * @private
     * @constructor
     * A Set of Types
     */
    function src$content$kit$compiler$types$type$set$$TypeSet(types) {
      var len = types && types.length, i;

      this._autoId    = 1;  // Auto-increment id counter
      this.idLookup   = {}; // Hash cache for finding by id
      this.tagLookup  = {}; // Hash cache for finding by tag

      for (i = 0; i < len; i++) {
        this.addType(types[i]);
      }
    }

    src$content$kit$compiler$types$type$set$$TypeSet.prototype = {
      /**
       * Adds a type to the set
       */
      addType: function(type) {
        if (type instanceof src$content$kit$compiler$types$type$$default) {
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

    var src$content$kit$compiler$types$type$set$$default = src$content$kit$compiler$types$type$set$$TypeSet;

    /**
     * Default supported block types
     */
    var src$content$kit$compiler$types$default$types$$DefaultBlockTypeSet = new src$content$kit$compiler$types$type$set$$default([
      new src$content$kit$compiler$types$type$$default({ tag: 'p', name: 'paragraph' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'h2', name: 'heading' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'h3', name: 'subheading' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'img', name: 'image', isTextType: false }),
      new src$content$kit$compiler$types$type$$default({ tag: 'blockquote', name: 'quote' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'ul', name: 'list' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'ol', name: 'ordered list' }),
      new src$content$kit$compiler$types$type$$default({ name: 'embed', isTextType: false })
    ]);

    /**
     * Default supported markup types
     */
    var src$content$kit$compiler$types$default$types$$DefaultMarkupTypeSet = new src$content$kit$compiler$types$type$set$$default([
      new src$content$kit$compiler$types$type$$default({ tag: 'strong', name: 'bold', mappedTags: ['b'] }),
      new src$content$kit$compiler$types$type$$default({ tag: 'em', name: 'italic', mappedTags: ['i'] }),
      new src$content$kit$compiler$types$type$$default({ tag: 'u', name: 'underline' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'a', name: 'link' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'br', name: 'break' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'li', name: 'list item' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'sub', name: 'subscript' }),
      new src$content$kit$compiler$types$type$$default({ tag: 'sup', name: 'superscript' })
    ]);

    /**
     * Converts an array-like object (i.e. NodeList) to Array
     * Note: could just use Array.prototype.slice but does not work in IE <= 8
     */
    function src$content$kit$utils$array$utils$$toArray(obj) {
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
    function src$content$kit$utils$array$utils$$sumSparseArray(array) {
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
    var src$content$kit$utils$node$utils$$standaloneDocument = (function() {
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
    function src$content$kit$utils$node$utils$$createElement(type) {
      return src$content$kit$utils$node$utils$$standaloneDocument.createElement(type);
    }

    /**
     * A reusable DOM Node for parsing html content.
     */
    var src$content$kit$utils$node$utils$$DOMParsingNode = src$content$kit$utils$node$utils$$createElement('div');

    /**
     * Returns plain-text of a `Node`
     */
    function src$content$kit$utils$node$utils$$textOfNode(node) {
      var text = node.textContent || node.innerText;
      return text ? src$content$kit$utils$string$utils$$sanitizeWhitespace(text) : '';
    }

    /**
     * Replaces a `Node` with its children
     */
    function src$content$kit$utils$node$utils$$unwrapNode(node) {
      if (node.hasChildNodes()) {
        var children = src$content$kit$utils$array$utils$$toArray(node.childNodes);
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
    function src$content$kit$utils$node$utils$$attributesForNode(node, blacklist) {
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

    var src$content$kit$compiler$parsers$html$parser$$ELEMENT_NODE = window.Node && Node.ELEMENT_NODE || 1;
    var src$content$kit$compiler$parsers$html$parser$$TEXT_NODE    = window.Node && Node.TEXT_NODE    || 3;
    var src$content$kit$compiler$parsers$html$parser$$defaultAttributeBlacklist = { 'style' : 1, 'class' : 1 };

    /**
     * Returns the last block in the set or creates a default block if none exist yet.
     */
    function src$content$kit$compiler$parsers$html$parser$$getLastBlockOrCreate(blocks) {
      var blockCount = blocks.length, block;
      if (blockCount) {
        block = blocks[blockCount - 1];
      } else {
        block = src$content$kit$compiler$models$block$$default.createWithType(src$content$kit$compiler$types$type$$default.PARAGRAPH);
        blocks.push(block);
      }
      return block;
    }

    /**
     * Helper to parse elements at the root that aren't blocks
     */
    function src$content$kit$compiler$parsers$html$parser$$handleNonBlockAtRoot(parser, elementNode, blocks) {
      var block = src$content$kit$compiler$parsers$html$parser$$getLastBlockOrCreate(blocks);
      var markup = parser.parseMarkupForElement(elementNode, block.value.length);
      if (markup) {
        block.markup = block.markup.concat(markup);
      }
      block.value += src$content$kit$utils$node$utils$$textOfNode(elementNode);
    }

    /**
     * @class HTMLParser
     * @constructor
     */
    function src$content$kit$compiler$parsers$html$parser$$HTMLParser(options) {
      var defaults = {
        blockTypes         : src$content$kit$compiler$types$default$types$$DefaultBlockTypeSet,
        markupTypes        : src$content$kit$compiler$types$default$types$$DefaultMarkupTypeSet,
        attributeBlacklist : src$content$kit$compiler$parsers$html$parser$$defaultAttributeBlacklist,
        includeTypeNames   : false
      };
      src$content$kit$utils$object$utils$$mergeWithOptions(this, defaults, options);
    }

    /**
     * @method parse
     * @param html String of HTML content
     * @return Array Parsed JSON content array
     */
    src$content$kit$compiler$parsers$html$parser$$HTMLParser.prototype.parse = function(html) {
      src$content$kit$utils$node$utils$$DOMParsingNode.innerHTML = src$content$kit$utils$string$utils$$sanitizeWhitespace(html);

      var nodes = src$content$kit$utils$array$utils$$toArray(src$content$kit$utils$node$utils$$DOMParsingNode.childNodes);
      var nodeCount = nodes.length;
      var blocks = [];
      var i, node, nodeType, block, text;

      for (i = 0; i < nodeCount; i++) {
        node = nodes[i];
        nodeType = node.nodeType;

        if (nodeType === src$content$kit$compiler$parsers$html$parser$$ELEMENT_NODE) {
          block = this.serializeBlockNode(node);
          if (block) {
            blocks.push(block);
          } else {
            src$content$kit$compiler$parsers$html$parser$$handleNonBlockAtRoot(this, node, blocks);
          }
        } else if (nodeType === src$content$kit$compiler$parsers$html$parser$$TEXT_NODE) {
          text = node.nodeValue;
          if (src$content$kit$utils$string$utils$$trim(text)) {
            block = src$content$kit$compiler$parsers$html$parser$$getLastBlockOrCreate(blocks);
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
    src$content$kit$compiler$parsers$html$parser$$HTMLParser.prototype.parseMarkupForElement = function(node, startOffset) {
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

        if (nodeType === src$content$kit$compiler$parsers$html$parser$$ELEMENT_NODE) {
          markup = this.serializeMarkupNode(currentNode, startOffset);
          if (markup) { markups.push(markup); }
          src$content$kit$utils$node$utils$$unwrapNode(currentNode);
        } else if (nodeType === src$content$kit$compiler$parsers$html$parser$$TEXT_NODE) {
          var text = src$content$kit$utils$string$utils$$sanitizeWhitespace(currentNode.nodeValue);
          if (index === 0) { text = src$content$kit$utils$string$utils$$trimLeft(text); }
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
    src$content$kit$compiler$parsers$html$parser$$HTMLParser.prototype.serializeBlockNode = function(node) {
      var type = this.blockTypes.findByNode(node);
      if (type) {
        return new src$content$kit$compiler$models$block$$default({
          type       : type.id,
          type_name  : this.includeTypeNames && type.name,
          value      : src$content$kit$utils$string$utils$$trim(src$content$kit$utils$node$utils$$textOfNode(node)),
          attributes : src$content$kit$utils$node$utils$$attributesForNode(node, this.attributeBlacklist),
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
    src$content$kit$compiler$parsers$html$parser$$HTMLParser.prototype.serializeMarkupNode = function(node, startIndex) {
      var type = this.markupTypes.findByNode(node);
      var selfClosing, endIndex;

      if (type) {
        selfClosing = type.selfClosing;
        if (!selfClosing && !node.hasChildNodes()) { return; } // check for empty nodes

        endIndex = startIndex + (selfClosing ? 0 : src$content$kit$utils$node$utils$$textOfNode(node).length);
        if (endIndex > startIndex || (selfClosing && endIndex === startIndex)) { // check for empty nodes
          return new src$content$kit$compiler$models$markup$$default({
            type       : type.id,
            type_name  : this.includeTypeNames && type.name,
            start      : startIndex,
            end        : endIndex,
            attributes : src$content$kit$utils$node$utils$$attributesForNode(node, this.attributeBlacklist)
          });
        }
      }
    };

    var src$content$kit$compiler$parsers$html$parser$$default = src$content$kit$compiler$parsers$html$parser$$HTMLParser;

    /**
     * Builds an opening html tag. i.e. '<a href="http://link.com/" rel="author">'
     */
    function src$content$kit$compiler$renderers$html$element$renderer$$createOpeningTag(tagName, attributes, selfClosing) {
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
    function src$content$kit$compiler$renderers$html$element$renderer$$createCloseTag(tagName) {
      return '</' + tagName + '>';
    }

    /**
     * @class HTMLElementRenderer
     * @constructor
     */
    function src$content$kit$compiler$renderers$html$element$renderer$$HTMLElementRenderer(options) {
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
    src$content$kit$compiler$renderers$html$element$renderer$$HTMLElementRenderer.prototype.render = function(model) {
      var html = '';
      var type = this.type;
      var tagName = type.tag;
      var selfClosing = type.selfClosing;

      if (tagName) {
        html += src$content$kit$compiler$renderers$html$element$renderer$$createOpeningTag(tagName, model.attributes, selfClosing);
      }
      if (!selfClosing) {
        html += this.renderMarkup(model.value, model.markup);
        if (tagName) {
          html += src$content$kit$compiler$renderers$html$element$renderer$$createCloseTag(tagName);
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
    src$content$kit$compiler$renderers$html$element$renderer$$HTMLElementRenderer.prototype.renderMarkup = function(text, markups) {
      var parsedTagsIndexes = [];
      var len = markups && markups.length, i;

      for (i = 0; i < len; i++) {
        var markup = markups[i],
            markupMeta = this.markupTypes.findById(markup.type),
            tagName = markupMeta.tag,
            selfClosing = markupMeta.selfClosing,
            start = markup.start,
            end = markup.end,
            openTag = src$content$kit$compiler$renderers$html$element$renderer$$createOpeningTag(tagName, markup.attributes, selfClosing),
            parsedTagLengthAtIndex = parsedTagsIndexes[start] || 0,
            parsedTagLengthBeforeIndex = src$content$kit$utils$array$utils$$sumSparseArray(parsedTagsIndexes.slice(0, start + 1));

        text = src$content$kit$utils$string$utils$$injectIntoString(text, openTag, start + parsedTagLengthBeforeIndex);
        parsedTagsIndexes[start] = parsedTagLengthAtIndex + openTag.length;

        if (!selfClosing) {
          var closeTag = src$content$kit$compiler$renderers$html$element$renderer$$createCloseTag(tagName);
          parsedTagLengthAtIndex = parsedTagsIndexes[end] || 0;
          parsedTagLengthBeforeIndex = src$content$kit$utils$array$utils$$sumSparseArray(parsedTagsIndexes.slice(0, end));
          text = src$content$kit$utils$string$utils$$injectIntoString(text, closeTag, end + parsedTagLengthBeforeIndex);
          parsedTagsIndexes[end]  = parsedTagLengthAtIndex + closeTag.length;
        }
      }

      return text;
    };

    var src$content$kit$compiler$renderers$html$element$renderer$$default = src$content$kit$compiler$renderers$html$element$renderer$$HTMLElementRenderer;

    /**
     * @class HTMLRenderer
     * @constructor
     */
    function src$content$kit$compiler$renderers$html$renderer$$HTMLRenderer(options) {
      var defaults = {
        blockTypes    : src$content$kit$compiler$types$default$types$$DefaultBlockTypeSet,
        markupTypes   : src$content$kit$compiler$types$default$types$$DefaultMarkupTypeSet,
        typeRenderers : {}
      };
      src$content$kit$utils$object$utils$$mergeWithOptions(this, defaults, options);
    }

    /**
     * @method willRenderType
     * @param type {Number|Type}
     * @param renderer the rendering function that returns a string of html
     * Registers custom rendering hooks for a type
     */
    src$content$kit$compiler$renderers$html$renderer$$HTMLRenderer.prototype.willRenderType = function(type, renderer) {
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
    src$content$kit$compiler$renderers$html$renderer$$HTMLRenderer.prototype.rendererFor = function(model) {
      var type = this.blockTypes.findById(model.type);
      var attrs = model.attributes;
      if (type === src$content$kit$compiler$types$type$$default.EMBED) {
        return attrs && attrs.html || '';
      }
      return new src$content$kit$compiler$renderers$html$element$renderer$$default({ type: type, markupTypes: this.markupTypes });
    };

    /**
     * @method render
     * @param model
     * @return String html
     */
    src$content$kit$compiler$renderers$html$renderer$$HTMLRenderer.prototype.render = function(model) {
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

    var src$content$kit$compiler$renderers$html$renderer$$default = src$content$kit$compiler$renderers$html$renderer$$HTMLRenderer;

    /**
     * @class Compiler
     * @constructor
     * @param options
     */
    function src$content$kit$compiler$compiler$$Compiler(options) {
      var parser = new src$content$kit$compiler$parsers$html$parser$$default();
      var renderer = new src$content$kit$compiler$renderers$html$renderer$$default();
      var defaults = {
        parser           : parser,
        renderer         : renderer,
        blockTypes       : src$content$kit$compiler$types$default$types$$DefaultBlockTypeSet,
        markupTypes      : src$content$kit$compiler$types$default$types$$DefaultMarkupTypeSet,
        includeTypeNames : false // Outputs `type_name:'HEADING'` etc. when parsing. Good for debugging.
      };
      src$content$kit$utils$object$utils$$mergeWithOptions(this, defaults, options);

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
    src$content$kit$compiler$compiler$$Compiler.prototype.parse = function(input) {
      return this.parser.parse(input);
    };

    /**
     * @method render
     * @param model
     * @return String
     */
    src$content$kit$compiler$compiler$$Compiler.prototype.render = function(model) {
      return this.renderer.render(model);
    };

    /**
     * @method rerender
     * @param input
     * @return String
     */
    src$content$kit$compiler$compiler$$Compiler.prototype.rerender = function(input) {
      return this.render(this.parse(input));
    };

    /**
     * @method reparse
     * @param model
     * @return String
     */
    src$content$kit$compiler$compiler$$Compiler.prototype.reparse = function(model) {
      return this.parse(this.render(model));
    };

    /**
     * @method registerBlockType
     * @param {Type} type
     */
    src$content$kit$compiler$compiler$$Compiler.prototype.registerBlockType = function(type) {
      return this.blockTypes.addType(type);
    };

    /**
     * @method registerMarkupType
     * @param {Type} type
     */
    src$content$kit$compiler$compiler$$Compiler.prototype.registerMarkupType = function(type) {
      return this.markupTypes.addType(type);
    };

    var src$content$kit$compiler$compiler$$default = src$content$kit$compiler$compiler$$Compiler;

    /**
     * @namespace ContentKit
     * Merge public modules into the common ContentKit namespace.
     */
    var src$content$kit$$ContentKit = window.ContentKit = window.ContentKit || {};
    src$content$kit$$ContentKit.Type = src$content$kit$compiler$types$type$$default;
    src$content$kit$$ContentKit.BlockModel = src$content$kit$compiler$models$block$$default;
    src$content$kit$$ContentKit.EmbedModel = src$content$kit$compiler$models$embed$$default;
    src$content$kit$$ContentKit.Compiler = src$content$kit$compiler$compiler$$default;
    src$content$kit$$ContentKit.HTMLParser = src$content$kit$compiler$parsers$html$parser$$default;
    src$content$kit$$ContentKit.HTMLRenderer = src$content$kit$compiler$renderers$html$renderer$$default;
}).call(this);

//# sourceMappingURL=bundle.map