import Post from "./models/post";

var builder = {
  generatePost() {
    return new Post();
  },
  generateSection(tagName, attributes, isGenerated) {
    var section = {
      type: 'markupSection',
      tagName: tagName,
      markers: []
    };
    if (attributes && attributes.length) {
      section.attributes = attributes;
    }
    if (isGenerated) {
      section.isGenerated = !!isGenerated;
    }
    return section;
  },
  generateMarker: function(open, close, value) {
    return {
      type: 'marker',
      open: open,
      close: close,
      value: value
    };
  },
  generateMarkerType: function(tagName, attributes) {
    if (attributes) {
      // FIXME: This could also be cached
      return {
        type: 'markerType',
        tagName: tagName,
        attributes: attributes
      };
    }
    var markerType = this._markerTypeCache[tagName];
    if (!markerType) {
      this._markerTypeCache[tagName] = markerType = {
        type: 'markerType',
        tagName: tagName
      };
    }
    return markerType;
  }
};

function reset(builder){
  builder._markerTypeCache = {};
}

export function generateBuilder(){
  reset(builder);
  return builder;
}
