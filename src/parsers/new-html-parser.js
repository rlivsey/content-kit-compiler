import { generateBuilder } from '../post-builder';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const MARKUP_SECTION_TAG_NAMES = ['P', 'H3', 'H2', 'H1', 'BLOCKQUOTE', 'UL', 'IMG', 'OL'];

const ALLOWED_ATTRIBUTES = ['href', 'rel', 'src'];

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
}

NewHTMLParser.prototype = {
  parse: function(postElement) {
    var post = {
      sections: []
    };
    var postBuilder = generateBuilder();
    var i, l, section, sectionElement;
    for (i=0, l=postElement.childNodes.length;i<l;i++) {
      sectionElement = postElement.childNodes[i];
      switch(sectionElement.nodeType) {
      case ELEMENT_NODE:
        var tagName = sectionElement.tagName;
        if (MARKUP_SECTION_TAG_NAMES.indexOf(tagName) !== -1) {
          section = postBuilder.generateSection(tagName, readAttributes(sectionElement));
          var node = sectionElement.firstChild;
          while (node) {
            parseMarkups(section, postBuilder, node);
            node = node.nextSibling;
          }
          post.sections.push(section);
          section = null;
        } else {
          if (!section) {
            section = postBuilder.generateSection('P');
            post.sections.push(section);
          }
          parseMarkups(section, postBuilder, sectionElement);
        }
        break;
      case TEXT_NODE:
        if (!section) {
          section = postBuilder.generateSection('P');
          post.sections.push(section);
        }
        parseMarkups(section, postBuilder, sectionElement);
        break;
      }
    }
    return post;
  }
};


export default NewHTMLParser;
