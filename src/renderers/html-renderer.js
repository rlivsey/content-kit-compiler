import Type from '../types/type';
import HTMLElementRenderer from './html-element-renderer';
import HTMLEmbedRenderer from './html-embed-renderer';
import CardRenderer from './card-renderer';
import { DefaultBlockTypeSet, DefaultMarkupTypeSet } from '../types/default-types';
import { mergeWithOptions } from 'content-kit-utils/src/object-utils';

/**
 * @class HTMLRenderer
 * @constructor
 */
function HTMLRenderer(options) {
  var defaults = {
    blockTypes    : DefaultBlockTypeSet,
    markupTypes   : DefaultMarkupTypeSet,
    typeRenderers : {},
    cards         : {}
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
  if (type === Type.CARD) {
    return new CardRenderer(this.cards);
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
  var i, blockHtml;

  for (i = 0; i < len; i++) {
    // this is renderModel, not only blocks!!
    blockHtml = this.renderBlock(model[i]);
    if (blockHtml) {
      html += blockHtml;
    }
  }

  return html;
};

/**
 * @method renderBlock
 * @param block
 * @return String html
 */
HTMLRenderer.prototype.renderBlock = function(block) {
  var renderer = this.rendererFor(block);
  var renderHook = this.typeRenderers[block.type];
  return renderHook ? renderHook.call(renderer, block) : renderer.render(block);
};

export default HTMLRenderer;
