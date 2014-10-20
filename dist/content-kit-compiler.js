/*!
 * @overview ContentKit-Compiler: Parses HTML to ContentKit's JSON schema and renders back to HTML.
 * @version  0.1.0
 * @author   Garth Poitras <garth22@gmail.com> (http://garthpoitras.com/)
 * @license  MIT
 * Last modified: Oct 20, 2014
 */
(function(window, document, undefined) {

define("content-kit",
  ["./content-kit-compiler/types/type","./content-kit-compiler/models/block","./content-kit-compiler/models/embed","./content-kit-compiler/compiler","./content-kit-compiler/parsers/html-parser","./content-kit-compiler/renderers/html-renderer","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var Type = __dependency1__["default"];
    var BlockModel = __dependency2__["default"];
    var EmbedModel = __dependency3__["default"];
    var Compiler = __dependency4__["default"];
    var HTMLParser = __dependency5__["default"];
    var HTMLRenderer = __dependency6__["default"];

    /**
     * @namespace ContentKit
     * Merge public modules into the common ContentKit namespace.
     * Handy for working in the browser with globals.
     */
    var ContentKit = window.ContentKit || {};
    ContentKit.Type = Type;
    ContentKit.BlockModel = BlockModel;
    ContentKit.EmbedModel = EmbedModel;
    ContentKit.Compiler = Compiler;
    ContentKit.HTMLParser = HTMLParser;
    ContentKit.HTMLRenderer = HTMLRenderer;

    __exports__["default"] = ContentKit;
  });
define("content-kit-compiler/compiler",
  ["./parsers/html-parser","./renderers/html-renderer","./types/default-types","../content-kit-utils/object-utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var HTMLParser = __dependency1__["default"];
    var HTMLRenderer = __dependency2__["default"];
    var DefaultBlockTypeSet = __dependency3__.DefaultBlockTypeSet;
    var DefaultMarkupTypeSet = __dependency3__.DefaultMarkupTypeSet;
    var mergeWithOptions = __dependency4__.mergeWithOptions;

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
        includeTypeNames : false // Outputs `type_name:'HEADING'` etc. when parsing. Good for debugging.
      };
      mergeWithOptions(this, defaults, options);

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

    __exports__["default"] = Compiler;
  });
define("content-kit-utils/array-utils",
  ["exports"],
  function(__exports__) {
    "use strict";
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

    __exports__.toArray = toArray;
    __exports__.sumSparseArray = sumSparseArray;
  });
define("content-kit-utils/node-utils",
  ["./string-utils","./array-utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var sanitizeWhitespace = __dependency1__.sanitizeWhitespace;
    var toArray = __dependency2__.toArray;

    /**
     * A document instance separate from the page's document. (if browser supports it)
     * Prevents images, scripts, and styles from executing while parsing nodes.
     */
    var standaloneDocument = (function() {
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
    function createElement(type) {
      return standaloneDocument.createElement(type);
    }

    /**
     * A reusable DOM Node for parsing html content.
     */
    var DOMParsingNode = createElement('div');

    /**
     * Returns plain-text of a `Node`
     */
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

    __exports__.createElement = createElement;
    __exports__.DOMParsingNode = DOMParsingNode;
    __exports__.textOfNode = textOfNode;
    __exports__.unwrapNode = unwrapNode;
    __exports__.attributesForNode = attributesForNode;
  });
define("content-kit-utils/object-utils",
  ["exports"],
  function(__exports__) {
    "use strict";
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

    __exports__.mergeWithOptions = mergeWithOptions;
    __exports__.merge = merge;
    __exports__.inherit = inherit;
  });
define("content-kit-utils/string-utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    var RegExpTrim        = /^\s+|\s+$/g;
    var RegExpTrimLeft    = /^\s+/;
    var RegExpWSChars     = /(\r\n|\n|\r|\t|\u00A0)/gm;
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

    __exports__.trim = trim;
    __exports__.trimLeft = trimLeft;
    __exports__.underscore = underscore;
    __exports__.sanitizeWhitespace = sanitizeWhitespace;
    __exports__.injectIntoString = injectIntoString;
  });
define("content-kit-compiler/models/block",
  ["./model","../../content-kit-utils/object-utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Model = __dependency1__["default"];
    var inherit = __dependency2__.inherit;

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

    __exports__["default"] = BlockModel;
  });
define("content-kit-compiler/models/embed",
  ["../models/model","../types/type","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Model = __dependency1__["default"];
    var Type = __dependency2__["default"];

    /**
     * @class EmbedModel
     * @constructor
     * @extends Model
     * Massages data from an oEmbed response into an EmbedModel
     */
    function EmbedModel(options) {
      if (!options) { return null; }

      Model.call(this, {
        type: Type.EMBED.id,
        type_name: Type.EMBED.name,
        attributes: {}
      });

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

      if (embedHtml && embedType === 'rich') {
        attributes.html = embedHtml;
      }
    }

    __exports__["default"] = EmbedModel;
  });
define("content-kit-compiler/models/markup",
  ["./model","../../content-kit-utils/object-utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Model = __dependency1__["default"];
    var inherit = __dependency2__.inherit;

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

    __exports__["default"] = MarkupModel;
  });
define("content-kit-compiler/models/model",
  ["exports"],
  function(__exports__) {
    "use strict";
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

    __exports__["default"] = Model;
  });
define("content-kit-compiler/parsers/html-parser",
  ["../models/block","../models/markup","../types/type","../types/default-types","../../content-kit-utils/object-utils","../../content-kit-utils/array-utils","../../content-kit-utils/string-utils","../../content-kit-utils/node-utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var BlockModel = __dependency1__["default"];
    var MarkupModel = __dependency2__["default"];
    var Type = __dependency3__["default"];
    var DefaultBlockTypeSet = __dependency4__.DefaultBlockTypeSet;
    var DefaultMarkupTypeSet = __dependency4__.DefaultMarkupTypeSet;
    var mergeWithOptions = __dependency5__.mergeWithOptions;
    var toArray = __dependency6__.toArray;
    var trim = __dependency7__.trim;
    var trimLeft = __dependency7__.trimLeft;
    var sanitizeWhitespace = __dependency7__.sanitizeWhitespace;
    var DOMParsingNode = __dependency8__.DOMParsingNode;
    var textOfNode = __dependency8__.textOfNode;
    var unwrapNode = __dependency8__.unwrapNode;
    var attributesForNode = __dependency8__.attributesForNode;

    var ELEMENT_NODE = window.Node && Node.ELEMENT_NODE || 1;
    var TEXT_NODE    = window.Node && Node.TEXT_NODE    || 3;
    var defaultAttributeBlacklist = { 'style' : 1, 'class' : 1 };

    /**
     * Returns the last block in the set or creates a default block if none exist yet.
     */
    function getLastBlockOrCreate(blocks) {
      var blockCount = blocks.length, block;
      if (blockCount) {
        block = blocks[blockCount - 1];
      } else {
        block = BlockModel.createWithType(Type.PARAGRAPH);
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
      DOMParsingNode.innerHTML = sanitizeWhitespace(html);

      var nodes = toArray(DOMParsingNode.childNodes);
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
        return new BlockModel({
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
          return new MarkupModel({
            type       : type.id,
            type_name  : this.includeTypeNames && type.name,
            start      : startIndex,
            end        : endIndex,
            attributes : attributesForNode(node, this.attributeBlacklist)
          });
        }
      }
    };

    __exports__["default"] = HTMLParser;
  });
define("content-kit-compiler/renderers/html-element-renderer",
  ["../../content-kit-utils/string-utils","../../content-kit-utils/array-utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var injectIntoString = __dependency1__.injectIntoString;
    var sumSparseArray = __dependency2__.sumSparseArray;

    /**
     * Builds an opening html tag. i.e. '<a href="http://link.com/" rel="author">'
     */
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

    __exports__["default"] = HTMLElementRenderer;
  });
define("content-kit-compiler/renderers/html-embed-renderer",
  ["./embeds/youtube","./embeds/twitter","./embeds/instagram","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var YouTubeRenderer = __dependency1__["default"];
    var TwitterRenderer = __dependency2__["default"];
    var InstagramRenderer = __dependency3__["default"];

    /**
     * A dictionary of supported embed services
     */
    var services = {
      YOUTUBE : {
        id: 1,
        renderer: new YouTubeRenderer()
      },
      TWITTER : {
        id: 2,
        renderer: new TwitterRenderer()
      },
      INSTAGRAM : {
        id: 3,
        renderer: new InstagramRenderer()
      }
    };

    /**
     * @class EmbedRenderer
     * @constructor
     */
    function EmbedRenderer() {}

    /**
     * @method render
     * @param model
     * @return String html
     */
    EmbedRenderer.prototype.render = function(model) {
      var renderer = this.rendererFor(model);
      if (renderer) {
        return renderer.render(model);
      }
      var attrs = model.attributes;
      return attrs && attrs.html || '';
    };

    /**
     * @method rendererFor
     * @param model
     * @return service renderer
     */
    EmbedRenderer.prototype.rendererFor = function(model) {
      var provider = model.attributes.provider_name;
      var providerKey = provider && provider.toUpperCase();
      var service = services[providerKey];
      return service && service.renderer;
    };

    __exports__["default"] = EmbedRenderer;
  });
define("content-kit-compiler/renderers/html-renderer",
  ["../types/type","./html-element-renderer","./html-embed-renderer","../types/default-types","../../content-kit-utils/object-utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var Type = __dependency1__["default"];
    var HTMLElementRenderer = __dependency2__["default"];
    var HTMLEmbedRenderer = __dependency3__["default"];
    var DefaultBlockTypeSet = __dependency4__.DefaultBlockTypeSet;
    var DefaultMarkupTypeSet = __dependency4__.DefaultMarkupTypeSet;
    var mergeWithOptions = __dependency5__.mergeWithOptions;

    /**
     * @class HTMLRenderer
     * @constructor
     */
    function HTMLRenderer(options) {
      var defaults = {
        blockTypes    : DefaultBlockTypeSet,
        markupTypes   : DefaultMarkupTypeSet,
        typeRenderers : {}
      };
      mergeWithOptions(this, defaults, options);
    }

    /**
     * @method willRenderType
     * @param type {Number|Type}
     * @param renderer the rendering function that returns a string of html
     * Registers custom rendering hooks for a type
     */
    HTMLRenderer.prototype.willRenderType = function(type, renderer) {
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
    HTMLRenderer.prototype.rendererFor = function(model) {
      var type = this.blockTypes.findById(model.type);
      if (type === Type.EMBED) {
        return new HTMLEmbedRenderer();
      }
      return new HTMLElementRenderer({ type: type, markupTypes: this.markupTypes });
    };

    /**
     * @method render
     * @param model
     * @return String html
     */
    HTMLRenderer.prototype.render = function(model) {
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

    __exports__["default"] = HTMLRenderer;
  });
define("content-kit-compiler/types/default-types",
  ["./type-set","./type","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var TypeSet = __dependency1__["default"];
    var Type = __dependency2__["default"];

    /**
     * Default supported block types
     */
    var DefaultBlockTypeSet = new TypeSet([
      new Type({ tag: 'p', name: 'paragraph' }),
      new Type({ tag: 'h2', name: 'heading' }),
      new Type({ tag: 'h3', name: 'subheading' }),
      new Type({ tag: 'img', name: 'image', isTextType: false }),
      new Type({ tag: 'blockquote', name: 'quote' }),
      new Type({ tag: 'ul', name: 'list' }),
      new Type({ tag: 'ol', name: 'ordered list' }),
      new Type({ name: 'embed', isTextType: false })
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

    __exports__.DefaultBlockTypeSet = DefaultBlockTypeSet;
    __exports__.DefaultMarkupTypeSet = DefaultMarkupTypeSet;
  });
define("content-kit-compiler/types/type-set",
  ["./type","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Type = __dependency1__["default"];

    /**
     * @class TypeSet
     * @private
     * @constructor
     * A Set of Types
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
        if (type instanceof Type) {
          this[type.name] = type;
          if (type.id === undefined) {
            type.id = this._autoId++;
          }
          this.idLookup[type.id] = type;
          if (type.tag) {
            this.tagLookup[type.tag] = type;
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

    __exports__["default"] = TypeSet;
  });
define("content-kit-compiler/types/type",
  ["../../content-kit-utils/string-utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var underscore = __dependency1__.underscore;

    /**
     * @class Type
     * @constructor
     * Contains meta info about a node type (id, name, tag, etc).
     */
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
        }

        // Register the type as constant
        Type[this.name] = this;
      }
    }

    __exports__["default"] = Type;
  });
define("content-kit-compiler/renderers/embeds/instagram",
  ["exports"],
  function(__exports__) {
    "use strict";

    function InstagramRenderer() {}
    InstagramRenderer.prototype.render = function(model) {
      return '<img src="' + model.attributes.url + '"/>';
    };

    __exports__["default"] = InstagramRenderer;
  });
define("content-kit-compiler/renderers/embeds/twitter",
  ["exports"],
  function(__exports__) {
    "use strict";

    function TwitterRenderer() {}
    TwitterRenderer.prototype.render = function(model) {
      return '<blockquote class="twitter-tweet"><a href="' + model.attributes.url + '"></a></blockquote>';
    };

    __exports__["default"] = TwitterRenderer;
  });
define("content-kit-compiler/renderers/embeds/youtube",
  ["exports"],
  function(__exports__) {
    "use strict";

    var RegExVideoId = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;

    function getVideoIdFromUrl(url) {
      var match = url && url.match(RegExVideoId);
      if (match && match[1].length === 11){
        return match[1];
      }
      return null;
    }

    function YouTubeRenderer() {}
    YouTubeRenderer.prototype.render = function(model) {
      var videoId = getVideoIdFromUrl(model.attributes.url);
      var embedUrl = 'http://www.youtube.com/embed/' + videoId + '?controls=2&showinfo=0&color=white&theme=light';
      return '<iframe width="100%" height="400" frameborder="0" allowfullscreen src="' + embedUrl + '"></iframe>';
    };

    __exports__["default"] = YouTubeRenderer;
  });}(this, document));
