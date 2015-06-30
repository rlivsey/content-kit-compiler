/* global QUnit, test, ok, equal, deepEqual */
QUnit.module('Compiler');

import {
  Compiler,
  HTMLParser,
  HTMLRenderer,
  Type
} from 'content-kit-compiler';

test('can create a Compiler', function() {
  var compiler = new Compiler();
  ok ( compiler, 'Compiler created' );
  ok ( compiler instanceof Compiler, 'instance of Compiler' );
});

test('can set options when creating a Compiler', function() {
  var customParser = new HTMLParser();
  var customRenderer = new HTMLRenderer();
  var compiler = new Compiler({
    parser: customParser,
    renderer: customRenderer
  });

  deepEqual ( compiler.parser, customParser );
  deepEqual ( compiler.renderer, customRenderer );
  ok ( compiler.parser instanceof HTMLParser );
  ok ( compiler.renderer instanceof HTMLRenderer );
});

test('registering new types', function() {
  var compiler = new Compiler();
  var divType = new Type({ tag : 'div' });
  var citeType = new Type({ tag : 'cite' });

  compiler.registerBlockType(divType);
  compiler.registerMarkupType(citeType);

  var registeredDivType = compiler.blockTypes.DIV;
  var registeredCityType = compiler.markupTypes.CITE;

  // 10 because there were nine types, and the divType is a
  // new one.
  var html = compiler.render([ { type: 10, value: 'test' } ]);

  ok ( registeredDivType );
  ok ( registeredDivType instanceof Type);
  equal ( registeredDivType.name, 'DIV' );
  equal ( registeredDivType.tag, 'div' );
  ok ( !registeredDivType.selfClosing );
  equal ( registeredDivType.id, 10 );
  equal ( html, '<div>test</div>' );

  html = compiler.render([ { type: 10, value: 'test', markup: [ { type: 9, start: 0, end:4 } ] } ]);

  ok ( registeredCityType );
  ok ( registeredCityType instanceof Type);
  equal ( registeredCityType.name, 'CITE' );
  equal ( registeredCityType.tag, 'cite' );
  ok ( !registeredCityType.selfClosing );
  equal ( registeredCityType.id, 9 );
  equal ( html, '<div><cite>test</cite></div>' );
});
