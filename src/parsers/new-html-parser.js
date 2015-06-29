import { generateBuilder } from '../post-builder';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const MARKUP_SECTION_TAG_NAMES = ['P', 'H3', 'H2', 'H1'];

function readAttributes(node) {
  var attributes = null;
  if (node.hasAttributes()) {
    attributes = [];
    var i, l;
    for (i=0,l=node.attributes.length;i<l;i=i+2) {
      attributes.push(node.attributes[i].name);
      attributes.push(node.attributes[i].value);
    }
  }
  return attributes;
}

function parseMarkups(section, postBuilder, topNode) {
  var markupTypes = [];
  var text = '';
  var currentNode = topNode;
  while (currentNode) {
    switch(currentNode.nodeType) {
    case ELEMENT_NODE:
      markupTypes.push(postBuilder.generateMarkupType(currentNode.tagName, readAttributes(currentNode)));
      break;
    case TEXT_NODE:
      text = text + currentNode.textContent;
      break;
    }

    if (currentNode.firstChild) {
      if (text !== '') {
        section.markups.push(postBuilder.generateMarkup(markupTypes, 0, text));
        markupTypes = [];
        text = '';
      }
      currentNode = currentNode.firstChild;
    } else if (currentNode !== topNode && currentNode.nextSibling) {
      currentNode = currentNode.nextSibling;
      if (currentNode.nodeType === ELEMENT_NODE && text !== '') {
        section.markups.push(postBuilder.generateMarkup(markupTypes, 0, text));
        markupTypes = [];
        text = '';
      }
    } else {
      var toClose = 0;
      while (currentNode && !currentNode.nextSibling && currentNode !== topNode) {
        toClose++;
        currentNode = currentNode.parentNode;
      }
      if (currentNode && currentNode !== topNode) {
        currentNode = currentNode.nextSibling;
      }
      section.markups.push(postBuilder.generateMarkup(markupTypes, toClose, text));
      markupTypes = [];
      text = '';
    }
    if (currentNode === topNode) {
      break;
    }
  }
}

function parseSection(post, postBuilder, sectionElement, previousSection) {
}

function NewHTMLParser() {
}

NewHTMLParser.prototype = {
  parse: function(postElement) {
    var post = {
      sections: []
    };
    var postBuilder = generateBuilder();
    var i, l, section, sectionElement, lastElement;
    for (i=0, l=postElement.childNodes.length;i<l;i++) {
      sectionElement = postElement.childNodes[i];
      switch(sectionElement.nodeType) {
      case ELEMENT_NODE:
        var tagName = sectionElement.tagName;
        if (MARKUP_SECTION_TAG_NAMES.indexOf(tagName) !== -1) {
          section = postBuilder.generateSection(tagName);
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
