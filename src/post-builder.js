const MARKUP_SECTION = 1;

var builder = {
  generateSection: function(tagName, attributes) {
    var section = {
      type: MARKUP_SECTION,
      tagName: tagName,
      markups: []
    };
    if (attributes && attributes.length) {
      section.attributes = attributes;
    }
    return section;
  },
  generateMarkup: function(open, close, value) {
    return {
      open: open,
      close: close,
      value: value
    };
  },
  generateMarkupType: function(tagName, attributes) {
    if (attributes) {
      // FIXME: This could also be cached
      return {
        tagName: tagName,
        attributes: attributes
      };
    }
    var markupType = this._markupTypeCache[tagName];
    if (!markupType) {
      this._markupTypeCache[tagName] = markupType = {
        tagName: tagName
      };
    }
    return markupType;
  }
};

function reset(builder){
  builder._markupTypeCache = {};
}

export function generateBuilder(){
  reset(builder);
  return builder;
}
