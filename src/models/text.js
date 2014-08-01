import BlockModel from './block';
import { DefaultBlockTypeSet } from '../types/default-types';
import { inherit } from '../utils/object-utils';

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

export default TextModel;
