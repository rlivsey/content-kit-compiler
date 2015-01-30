/**
 * @class HTMLEmbedRenderer
 * @constructor
 */
function HTMLEmbedRenderer() {}

/**
 * @method render
 * @param model a block model
 * @return String html
 */
HTMLEmbedRenderer.prototype.render = function(model) {
  var attrs = model.attributes;
  return attrs && attrs.html || '';
};

export default HTMLEmbedRenderer;
