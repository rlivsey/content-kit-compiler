export function generateBuilder(){
  reset(builder);
  return builder;
}

function reset(builder){
  var postNode = {
    sections: []
  };
  builder._ast = postNode;
}

var builder = {
  toAST: function(){
    return this._ast;
  }
}
