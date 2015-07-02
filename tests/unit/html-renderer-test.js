/* global QUnit, test, equal */
QUnit.module('HTMLRenderer');

import {
  Compiler,
  Type,
  doc,
  HTMLParser
} from 'content-kit-compiler';

var compiler = new Compiler({
  parser: new HTMLParser()
});

test('render', function() {
  var input = '<p>This is <em>italic</em>, this is <strong>bold</strong>, this is <em><strong>both styles</strong></em></p>';
  var parsed = compiler.parse(input);
  var rendered = compiler.render(parsed);

  equal ( rendered, input );
});

test('render from innerHTML', function() {
  var input = '<p>This is <em>italic</em>, this is <strong>bold</strong>, this is <em><strong>both styles</strong></em></p>';
  var element = doc.createElement('div');
  element.innerHTML = input;
  var parsed = compiler.parse(element.innerHTML);
  var rendered = compiler.render(parsed);

  equal ( rendered, input );
});

test('render with nested markup tags', function() {
  var input = '<p><em>Nested test <strong>end</strong></em>. <em><strong>Nested</strong> test start</em>. <em>Nested <strong>test</strong> middle</em>. <em><strong>Nested test whole</strong></em></p>';
  var parsed = compiler.parse(input);
  var rendered = compiler.render(parsed);

  equal ( rendered, input );
});

test('render with wrapped unsupported markup tags', function() {
  var input = '<p><span>Nested test <strong>end</strong></span>. <span><strong>Nested</strong> test start</span>. <span>Nested <strong>test</strong> middle</span>. <span><strong>Nested test whole</strong></span></p>';
  var correctOutput = '<p>Nested test <strong>end</strong>. <strong>Nested</strong> test start. Nested <strong>test</strong> middle. <strong>Nested test whole</strong></p>';
  var parsed = compiler.parse(input);
  var rendered = compiler.render(parsed);

  equal ( rendered, correctOutput );
});

test('render with nested unsupported markup tags', function() {
  var input = '<p><strong>Nested test <span>end</span></strong>. <strong><span>Nested</span> test start</strong>. <strong>Nested <span>test</span> middle</strong>. <strong><span>Nested test whole</span></strong></p>';
  var correctOutput = '<p><strong>Nested test end</strong>. <strong>Nested test start</strong>. <strong>Nested test middle</strong>. <strong>Nested test whole</strong></p>';
  var parsed = compiler.parse(input);
  var rendered = compiler.render(parsed);

  equal ( rendered, correctOutput );
});

test('render with attributes', function() {
  var input = '<p id="test"><a href="http://google.com/" rel="publisher">Link</a></p>';
  var parsed = compiler.parse(input);
  var rendered = compiler.render(parsed);

  // some browsers (firefox) change order of attributes so can't just do direct compare
  // equal ( rendered, input );

  var div = doc.createElement('div');
  div.innerHTML = rendered;
  var nodes = div.childNodes;

  equal( nodes[0].attributes.id.value, 'test' );
  equal( nodes[0].firstChild.attributes.href.value, 'http://google.com/' );
  equal( nodes[0].firstChild.attributes.rel.value, 'publisher' );
});

test('render elements', function() {
  var input = '<h2>The Title</h2><h3>The Subtitle</h3><p>Paragraph <strong>1</strong></p><p>Paragraph <em><strong>2</strong></em></p><p>Paragraph with a <a href="http://google.com/">link</a>.</p><blockquote>Quote</blockquote>';
  var parsed = compiler.parse(input);
  var rendered = compiler.render(parsed);
  
  equal ( rendered, input );
});

test('render self-closing elements', function() {
  var input = '<img src="http://domain.com/test1.png"/><img src="http://domain.com/test2.png"/>';
  var parsed = compiler.parse(input);
  var rendered = compiler.render(parsed);

  equal ( rendered, input );
});

test('render embeds', function() {
  var model = {
    type: Type.EMBED.id,
    attributes: {
      html: '<iframe src="http://test"></iframe>'
    }
  };
  var rendered = compiler.render([model]);

  equal ( rendered, model.attributes.html );
});
