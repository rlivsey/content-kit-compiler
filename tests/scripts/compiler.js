module('compiler');

var compiler = new ContentKit.Compiler();

test('can create a Compiler', function() {
  var compiler = new ContentKit.Compiler();
  ok ( compiler, 'Compiler created' );
  ok ( compiler instanceof ContentKit.Compiler, 'instance of Compiler' );
});

test('can set options when creating a Compiler', function() {
  var customParser = new ContentKit.HTMLParser();
  var customRenderer = new ContentKit.HTMLRenderer();
  var compiler = new ContentKit.Compiler({
    parser: customParser,
    renderer: customRenderer
  });

  deepEqual ( compiler.parser, customParser );
  deepEqual ( compiler.renderer, customRenderer );
  ok ( compiler.parser instanceof ContentKit.HTMLParser );
  ok ( compiler.renderer instanceof ContentKit.HTMLRenderer );
});
