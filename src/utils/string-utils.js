var RegExpTrim     = /^\s+|\s+$/g,
    RegExpTrimLeft = /^\s+/,
    RegExpWSChars  = /(\r\n|\n|\r|\t|\u00A0)/gm,
    RegExpMultiWS  = / +/g;

/**
 * String.prototype.trim polyfill
 * Removes whitespace at beginning and end of string
 */
function trim(string) {
  return string ? string.replace(RegExpTrim, '') : '';
}

/**
 * String.prototype.trimLeft polyfill
 * Removes whitespace at beginning of string
 */
function trimLeft(string) {
  return string ? string.replace(RegExpTrimLeft, '') : '';
}

/**
 * Cleans line breaks, tabs, non-breaking spaces, then multiple occuring whitespaces.
 */
function sanitizeWhitespace(string) {
  return string.replace(RegExpWSChars, '').replace(RegExpMultiWS, ' ');
}

/**
 * Injects a string into another string at the index specified
 */
function injectIntoString(string, injection, index) {
  return string.substr(0, index) + injection + string.substr(index);
}
