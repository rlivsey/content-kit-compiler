import { generateBuilder } from '../post-builder';
import { trim } from 'content-kit-utils';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const MARKUP_SECTION_TAG_NAMES = ['P', 'H3', 'H2', 'H1', 'BLOCKQUOTE', 'UL', 'IMG', 'OL'];

const ALLOWED_ATTRIBUTES = ['href', 'rel', 'src'];

function isEmptyTextNode(node) {
  return node.nodeType === TEXT_NODE && trim(node.textContent) === '';
}

// FIXME: should probably always return an array
function readAttributes(node) {
  var attributes = null;
  if (node.hasAttributes()) {
    attributes = [];
    var i, l;
    for (i=0,l=node.attributes.length;i<l;i++) {
      if (ALLOWED_ATTRIBUTES.indexOf(node.attributes[i].name) !== -1) {
        attributes.push(node.attributes[i].name);
        attributes.push(node.attributes[i].value);
      }
    }
    if (attributes.length === 0) {
      return null;
    }
  }
  return attributes;
}

function parseMarkups(section, postBuilder, topNode) {
  var markupTypes = [];
  var text = null;
  var currentNode = topNode;
  while (currentNode) {
    switch(currentNode.nodeType) {
    case ELEMENT_NODE:
      markupTypes.push(postBuilder.generateMarkupType(currentNode.tagName, readAttributes(currentNode)));
      break;
    case TEXT_NODE:
      text = (text || '') + currentNode.textContent;
      break;
    }

    if (currentNode.firstChild) {
      if (text !== null) {
        section.markups.push(postBuilder.generateMarkup(markupTypes, 0, text));
        markupTypes = [];
        text = null;
      }
      currentNode = currentNode.firstChild;
    } else if (currentNode.nextSibling) {
      if (currentNode === topNode) {
        section.markups.push(postBuilder.generateMarkup(markupTypes, markupTypes.length, text));
        break;
      } else {
        currentNode = currentNode.nextSibling;
        if (currentNode.nodeType === ELEMENT_NODE && text !== null) {
          section.markups.push(postBuilder.generateMarkup(markupTypes, 0, text));
          markupTypes = [];
          text = null;
        }
      }
    } else {
      var toClose = 0;
      while (currentNode && !currentNode.nextSibling && currentNode !== topNode) {
        toClose++;
        currentNode = currentNode.parentNode;
      }
        section.markups.push(postBuilder.generateMarkup(markupTypes, toClose, text));
        markupTypes = [];
        text = null;
      if (currentNode === topNode) {
        break;
      } else {
        currentNode = currentNode.nextSibling;
        if (currentNode === topNode) {
          break;
        }
      }
    }
  }
}

function NewHTMLParser() {
  this.postBuilder = generateBuilder();
}

NewHTMLParser.prototype = {
  parseSection: function(previousSection, sectionElement) {
    var postBuilder = this.postBuilder;
    var section;
    switch(sectionElement.nodeType) {
    case ELEMENT_NODE:
      var tagName = sectionElement.tagName;
      // <p> <h2>, etc
      if (MARKUP_SECTION_TAG_NAMES.indexOf(tagName) !== -1) {
        section = postBuilder.generateSection(tagName, readAttributes(sectionElement));
        var node = sectionElement.firstChild;
        while (node) {
          parseMarkups(section, postBuilder, node);
          node = node.nextSibling;
        }
      // <strong> <b>, etc
      } else {
        if (previousSection && previousSection.isGenerated) {
          section = previousSection;
        } else {
          section = postBuilder.generateSection('P', {}, true);
        }
        parseMarkups(section, postBuilder, sectionElement);
      }
      break;
    case TEXT_NODE:
      if (previousSection && previousSection.isGenerated) {
        section = previousSection;
      } else {
        section = postBuilder.generateSection('P', {}, true);
      }
      parseMarkups(section, postBuilder, sectionElement);
      break;
    }
    return section;
  },
  parse: function(postElement) {
    var post = {
      sections: []
    };
    var i, l, section, previousSection, sectionElement;
    // FIXME: Instead of storing isGenerated on sections, and passing
    // the previous section to the parser, we could instead do a two-pass
    // parse. The first pass identifies sections and gathers a list of
    // dom nodes that can be parsed for markers, the second pass parses
    // for markers.
    for (i=0, l=postElement.childNodes.length;i<l;i++) {
      sectionElement = postElement.childNodes[i];
      if (!isEmptyTextNode(sectionElement)) {
        section = this.parseSection(previousSection, sectionElement);
        if (section !== previousSection) {
          post.sections.push(section);
          previousSection = section;
        }
      }
    }
    return post;
  }
};

export default NewHTMLParser;
