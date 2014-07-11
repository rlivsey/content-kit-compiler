/**
 * @class MarkupType
 * @private
 * @constructor
 * @extends Type
 */
function MarkupType(options) {
  Type.call(this, options, MarkupType.meta);
}
MarkupType.meta = new TypeMeta();
inherit(MarkupType, Type);

/**
 * Default supported markup type dictionary
 */
var DefaultMarkupTypes = {
  BOLD        : new MarkupType({ tag: 'b', name: 'bold' }),
  ITALIC      : new MarkupType({ tag: 'i', name: 'italic' }),
  UNDERLINE   : new MarkupType({ tag: 'u', name: 'underline' }),
  LINK        : new MarkupType({ tag: 'a', name: 'link' }),
  BREAK       : new MarkupType({ tag: 'br', name: 'break' }),
  LIST_ITEM   : new MarkupType({ tag: 'li', name: 'list item' }),
  SUBSCRIPT   : new MarkupType({ tag: 'sub', name: 'subscript' }),
  SUPERSCRIPT : new MarkupType({ tag: 'sup', name: 'superscript' })
};
