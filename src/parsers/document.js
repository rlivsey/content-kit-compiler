/**
 * Abstracted `document` between node.js and browser
*/

var doc;

if (typeof exports === 'object') {
  var jsdom = require('jsdom').jsdom;
  doc = jsdom();
} else {
  // A document instance separate from the html page document. (if browser supports it)
  // Prevents images, scripts, and styles from executing while parsing
  var implementation = document.implementation;
  var createHTMLDocument = implementation.createHTMLDocument;
  if (createHTMLDocument) {
    doc = createHTMLDocument.call(implementation, '');
  } else {
    doc = document;
  }
}

export default doc;
