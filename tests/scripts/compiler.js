module('compiler');


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

test('registering new types', function() {
  var compiler = new ContentKit.Compiler();
  var divType = new ContentKit.Type({ tag : 'div' });
  var citeType = new ContentKit.Type({ tag : 'cite' });

  compiler.registerBlockType(divType);
  compiler.registerMarkupType(citeType);

  var registeredDivType = compiler.blockTypes.DIV;
  var registeredCityType = compiler.markupTypes.CITE;

  ok ( registeredDivType );
  ok ( registeredDivType instanceof ContentKit.Type);
  equal ( registeredDivType.name, 'DIV' );
  equal ( registeredDivType.tag, 'div' );
  ok ( !registeredDivType.selfClosing );
  equal ( registeredDivType.id, 10 );

  ok ( registeredCityType );
  ok ( registeredCityType instanceof ContentKit.Type);
  equal ( registeredCityType.name, 'CITE' );
  equal ( registeredCityType.tag, 'cite' );
  ok ( !registeredCityType.selfClosing );
  equal ( registeredCityType.id, 9 );
});