/**
 * @class BlockType
 * @private
 * @constructor
 * @extends Type
 */
function BlockType(options) {
  Type.call(this, options, BlockType.meta);
}
BlockType.meta = new TypeMeta();
inherit(BlockType, Type);

/**
 * Default supported block node type dictionary
 */
var DefaultBlockTypes = {
  TEXT         : new BlockType({ tag: 'p', name: 'text' }),
  HEADING      : new BlockType({ tag: 'h2', name: 'heading' }),
  SUBHEADING   : new BlockType({ tag: 'h3', name: 'subheading' }),
  IMAGE        : new BlockType({ tag: 'img', name: 'image' }),
  QUOTE        : new BlockType({ tag: 'blockquote', name: 'quote' }),
  LIST         : new BlockType({ tag: 'ul', name: 'list' }),
  ORDERED_LIST : new BlockType({ tag: 'ol', name: 'ordered list' }),
  EMBED        : new BlockType({ name: 'embed' }),
  GROUP        : new BlockType({ name: 'group' })
};
