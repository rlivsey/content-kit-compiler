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
