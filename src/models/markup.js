import Model from './model';
import { inherit } from 'content-kit-utils';

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

export default MarkupModel;
