import Type from '../types/type';
import HTMLElementRenderer from './html-element-renderer';
import HTMLEmbedRenderer from './html-embed-renderer';
import { DefaultBlockTypeSet, DefaultMarkupTypeSet } from '../types/default-types';
import { mergeWithOptions } from 'node_modules/content-kit-utils/src/object-utils';

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
 * @method rendererFor
 * @param block
 * @returns renderer
 * Returns an instance of a renderer for supplied block model
 */
HTMLRenderer.prototype.rendererFor = function(block) {
  var type = this.blockTypes.findById(block.type);
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
  var i, block, renderer, renderHook, blockHtml;

  for (i = 0; i < len; i++) {
    block = model[i];
    renderer = this.rendererFor(block);
    renderHook = this.typeRenderers[block.type];
    blockHtml = renderHook ? renderHook.call(renderer, block) : renderer.render(block);
    if (blockHtml) { 
      html += blockHtml;
    }
  }
  return html;
};

export default HTMLRenderer;
