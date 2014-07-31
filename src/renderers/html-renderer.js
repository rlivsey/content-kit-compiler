/**
 * @class HTMLRenderer
 * @constructor
 */
function HTMLRenderer(options) {
  var defaults = {
    typeRenderers : {},
    blockTypes    : DefaultBlockTypeSet,
    markupTypes   : DefaultMarkupTypeSet
  };
  merge(this, defaults, options);
}

/**
 * @method render
 * @param data
 * @return String html
 */
HTMLRenderer.prototype.render = function(data) {
  var html = '',
      len = data && data.length,
      i, block, typeRenderer, blockHtml;

  for (i = 0; i < len; i++) {
    block = data[i];
    typeRenderer = this.typeRenderers[block.type] || this.renderBlock;
    blockHtml = typeRenderer.call(this, block);
    if (blockHtml) { html += blockHtml; }
  }
  return html;
};

/**
 * @method renderBlock
 * @param block a block model
 * @return String html
 * Renders a block model into a HTML string.
 */
HTMLRenderer.prototype.renderBlock = function(block) {
  var type = this.blockTypes.findById(block.type),
      html = '', tagName, selfClosing;

  if (type) {
    tagName = type.tag;
    selfClosing = type.selfClosing;
    html += createOpeningTag(tagName, block.attributes, selfClosing);
    if (!selfClosing) {
      html += this.renderMarkup(block.value, block.markup);
      html += createCloseTag(tagName);
    }
  }
  return html;
};

/**
 * @method renderMarkup
 * @param text plain text to apply markup to
 * @param markup an array of markup models
 * @return String html
 * Renders a markup model into a HTML string.
 */
HTMLRenderer.prototype.renderMarkup = function(text, markups) {
  var parsedTagsIndexes = [],
      len = markups && markups.length, i;

  for (i = 0; i < len; i++) {
    var markup = markups[i],
        markupMeta = this.markupTypes.findById(markup.type),
        tagName = markupMeta.tag,
        selfClosing = markupMeta.selfClosing,
        start = markup.start,
        end = markup.end,
        openTag = createOpeningTag(tagName, markup.attributes, selfClosing),
        parsedTagLengthAtIndex = parsedTagsIndexes[start] || 0,
        parsedTagLengthBeforeIndex = sumArray(parsedTagsIndexes.slice(0, start + 1));

    text = injectIntoString(text, openTag, start + parsedTagLengthBeforeIndex);
    parsedTagsIndexes[start] = parsedTagLengthAtIndex + openTag.length;

    if (!selfClosing) {
      var closeTag = createCloseTag(tagName);
      parsedTagLengthAtIndex = parsedTagsIndexes[end] || 0;
      parsedTagLengthBeforeIndex = sumArray(parsedTagsIndexes.slice(0, end));
      text = injectIntoString(text, closeTag, end + parsedTagLengthBeforeIndex);
      parsedTagsIndexes[end]  = parsedTagLengthAtIndex + closeTag.length;
    }
  }

  return text;
};

/**
 * @method willRenderType
 * @param type type id
 * @param renderer the rendering function that returns a string of html
 * Registers custom rendering for a type
 */
HTMLRenderer.prototype.willRenderType = function(type, renderer) {
  this.typeRenderers[type] = renderer;
};

ContentKit.HTMLRenderer = HTMLRenderer;


/**
 * Builds an opening html tag. i.e. '<a href="http://link.com/" rel="author">'
 */
function createOpeningTag(tagName, attributes, selfClosing /*,blacklist*/) {
  var tag = '<' + tagName;
  for (var attr in attributes) {
    if (attributes.hasOwnProperty(attr)) {
      //if (blacklist && attr in blacklist) { continue; }
      tag += ' ' + attr + '="' + attributes[attr] + '"';
    }
  }
  if (selfClosing) { tag += '/'; }
  tag += '>';
  return tag;
}

/**
 * Builds a closing html tag. i.e. '</p>'
 */
function createCloseTag(tagName) {
  return '</' + tagName + '>';
}
