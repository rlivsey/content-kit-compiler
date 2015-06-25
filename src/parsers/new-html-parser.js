import { generateBuilder } from '../post-builder';

function NewHTMLParser() {
}

NewHTMLParser.prototype = {
  parse: function(html) {
    var postBuilder = generateBuilder();
    return postBuilder.toAST();
  }
};

export default NewHTMLParser;
