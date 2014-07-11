/**
 * @class Type
 * @private
 * @constructor
 * Base class that contains info about an allowed node type (type id, tag, etc).
 * Only to be subclassed (BlockType, MarkupType)
 */
function Type(options, meta) {
  if (options) {
    this.id = options.id === undefined ? meta.autoId++ : options.id;
    meta.idLookup[this.id] = this;
    this.name = options.name || options.tag;
    if (options.tag) {
      this.tag = options.tag;
      this.selfClosing = /^(br|img|hr|meta|link|embed)$/i.test(this.tag);
      meta.tagLookup[this.tag] = this;
    }
  }
}

/**
 * Type static meta properties
 */
function TypeMeta() {
  this.autoId    = 1;  // Auto-increment id counter
  this.idLookup  = {}; // Hash cache for finding by id
  this.tagLookup = {}; // Hash cache for finding by tag
}

/**
 * Returns type info for a given Node
 */
Type.findByNode = function(node) {
  return this.meta.tagLookup[node.tagName.toLowerCase()];
};

/**
 * Returns type info for a given id
 */
Type.findById = function(id) {
  return this.meta.idLookup[id];
};
