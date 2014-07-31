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
