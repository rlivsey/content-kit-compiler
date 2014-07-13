/**
 * @class HTMLParser
 * @constructor
 */
function HTMLParser(options) {
  var defaults = {
    includeTypeNames : false
  };
  merge(this, defaults, options);
}

/**
 * @method parse
 * @param html String of HTML content
 * @return Array Parsed JSON content array
 */
HTMLParser.prototype.parse = function(html) {
  parserNode.innerHTML = sanitizeWhitespace(html);

  var children = toArray(parserNode.childNodes),
      len = children.length,
      blocks = [],
      i, currentNode, block, text;

  for (i = 0; i < len; i++) {
    currentNode = children[i];
    // All top level nodes *should be* `Element` nodes and supported block types.
    // We'll handle some cases if it isn't so we don't lose any content when parsing.
    // Parser assumes sane input (such as from the ContentKit Editor) and is not intended to be a full html sanitizer.
    if (currentNode.nodeType === 1) {
      block = parseBlock(currentNode, this.includeTypeNames);
      if (block) {
        blocks.push(block);
      } else {
        handleNonBlockElementAtRoot(currentNode, blocks);
      }
    } else if (currentNode.nodeType === 3) {
      text = currentNode.nodeValue;
      if (trim(text)) {
        block = getLastBlockOrCreate(blocks);
        block.value += text;
      }
    }
  }

  return blocks;
};

ContentKit.HTMLParser = HTMLParser;


/**
 * Parses a single block type node into json
 */
function parseBlock(node, includeTypeNames) {
  var meta = BlockType.findByNode(node), parsed, attributes;
  if (meta) {
    parsed = { type : meta.id };
    if (includeTypeNames && meta.name) {
      parsed.type_name = meta.name;
    }
    parsed.value = trim(textOfNode(node));
    attributes = attributesForNode(node);
    if (attributes) {
      parsed.attributes = attributes;
    }
    parsed.markup = parseBlockMarkup(node, includeTypeNames);
    return parsed;
  }
}

/**
 * Parses all of the markup in a block type node
 */
function parseBlockMarkup(node, includeTypeNames) {
  var processedText = '',
      markups = [],
      index = 0,
      currentNode, markup;

  while (node.hasChildNodes()) {
    currentNode = node.firstChild;
    if (currentNode.nodeType === 1) {
      markup = parseElementMarkup(currentNode, processedText.length, includeTypeNames);
      if (markup) {
        markups.push(markup);
      }
      // unwrap the element so we can process any children
      if (currentNode.hasChildNodes()) {
        unwrapNode(currentNode);
      }
    } else if (currentNode.nodeType === 3) {
      var text = sanitizeWhitespace(currentNode.nodeValue);
      if (index === 0) { text = trimLeft(text); }
      if (text) { processedText += text; }
    }

    // node has been processed, remove it
    currentNode.parentNode.removeChild(currentNode);
    index++;
  }

  return markups;
}

/**
 * Parses markup of a single html element node
 */
function parseElementMarkup(node, startIndex, includeTypeNames) {
  var meta = MarkupType.findByNode(node),
      selfClosing, endIndex, markup, attributes;

  if (meta) {
    selfClosing = meta.selfClosing;
    if (!selfClosing && !node.hasChildNodes()) { return; } // check for empty nodes

    endIndex = startIndex + (selfClosing ? 0 : textOfNode(node).length);
    if (endIndex > startIndex || (selfClosing && endIndex === startIndex)) { // check for empty nodes
      markup = { type : meta.id };
      if (includeTypeNames && meta.name) {
        markup.type_name = meta.name;
      }
      markup.start = startIndex;
      markup.end = endIndex;
      attributes = attributesForNode(node);
      if (attributes) {
        markup.attributes = attributes;
      }
      return markup;
    }
  }
}

/**
 * Helper to retain stray elements at the root of the html that aren't blocks
 */
function handleNonBlockElementAtRoot(elementNode, blocks) {
  var block = getLastBlockOrCreate(blocks),
      markup = parseElementMarkup(elementNode, block.value.length);
  if (markup) {
    block.markup = block.markup || [];
    block.markup.push(markup);
  }
  block.value += textOfNode(elementNode);
}

/**
 * Gets the last block in the set or creates and return a default block if none exist yet.
 */
function getLastBlockOrCreate(blocks) {
  var block;
  if (blocks.length) {
    block = blocks[blocks.length - 1];
  } else {
    block = parseBlock(doc.createElement('p'));
    blocks.push(block);
  }
  return block;
}
