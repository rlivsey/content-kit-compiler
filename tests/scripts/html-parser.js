module('HTMLParser');

var compiler = new ContentKit.Compiler();
var Type = ContentKit.Type;

test('propertly handle empty content', function() {
  var parsed = compiler.parse();
  deepEqual (parsed, []);

  parsed = compiler.parse('');
  deepEqual (parsed, []);

  parsed = compiler.parse(' ');
  deepEqual (parsed, []);
});

test('stray markup without a block should create a default block', function() {
  var parsed = compiler.parse('<strong>text</strong>');

  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'text' );
  equal ( parsed[0].type, Type.PARAGRAPH.id );
  equal ( parsed[0].markup.length, 1);
  equal ( parsed[0].markup[0].type, Type.BOLD.id );
  equal ( parsed[0].markup[0].start, 0 );
  equal ( parsed[0].markup[0].end, 4 );

  parsed = compiler.parse('<strong><em>stray</em> markup tags</strong>.');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'stray markup tags.' );
  equal ( parsed[0].type, Type.PARAGRAPH.id );
  equal ( parsed[0].markup.length, 2);
  equal ( parsed[0].markup[0].type, Type.BOLD.id );
  equal ( parsed[0].markup[0].start, 0 );
  equal ( parsed[0].markup[0].end, 17 );
  equal ( parsed[0].markup[1].type, Type.ITALIC.id );
  equal ( parsed[0].markup[1].start, 0 );
  equal ( parsed[0].markup[1].end, 5 );
});

test('stray text without a block should create a default block', function() {
  var parsed = compiler.parse('text');

  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'text' );
  equal ( parsed[0].type, Type.PARAGRAPH.id );
});

test('stray content gets appended to previous block element', function() {
  var parsed = compiler.parse('start <strong>bold</strong> end');

  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'start bold end' );
  equal ( parsed[0].type, Type.PARAGRAPH.id );
  equal ( parsed[0].markup.length, 1);
  equal ( parsed[0].markup[0].type, Type.BOLD.id );
  equal ( parsed[0].markup[0].start, 6);
  equal ( parsed[0].markup[0].end, 10);
});

test('markup: bold', function() {
  var parsed = compiler.parse('<strong>text</strong>');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'text' );
  equal ( parsed[0].markup.length, 1 );
  equal ( parsed[0].markup[0].type, Type.BOLD.id );
  equal ( parsed[0].markup[0].start, 0);
  equal ( parsed[0].markup[0].end, 4);
});

test('markup: italic', function() {
  var parsed = compiler.parse('italic <em>text</em>');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'italic text' );
  equal ( parsed[0].markup.length, 1 );
  equal ( parsed[0].markup[0].type, Type.ITALIC.id );
  equal ( parsed[0].markup[0].start, 7);
  equal ( parsed[0].markup[0].end, 11);
});

test('markup: underline', function() {
  var parsed = compiler.parse('<u>underline</u> text');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'underline text' );
  equal ( parsed[0].markup.length, 1 );
  equal ( parsed[0].markup[0].type, Type.UNDERLINE.id );
  equal ( parsed[0].markup[0].start, 0);
  equal ( parsed[0].markup[0].end, 9);
});

test('markup: link', function() {
  var parsed = compiler.parse('<a href="http://test.com/">link</a>');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'link' );
  equal ( parsed[0].markup.length, 1 );
  equal ( parsed[0].markup[0].type, Type.LINK.id );
  equal ( parsed[0].markup[0].start, 0);
  equal ( parsed[0].markup[0].end, 4);
  equal ( parsed[0].markup[0].attributes.href, 'http://test.com/');
});

test('markup: break', function() {
  var parsed = compiler.parse('line <br/>break');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'line break' );
  equal ( parsed[0].markup.length, 1 );
  equal ( parsed[0].markup[0].type, Type.BREAK.id );
  equal ( parsed[0].markup[0].start, 5);
  equal ( parsed[0].markup[0].end, 5);
});

test('markup: subscript', function() {
  var parsed = compiler.parse('footnote<sub>1</sub>');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'footnote1' );
  equal ( parsed[0].markup.length, 1 );
  equal ( parsed[0].markup[0].type, Type.SUBSCRIPT.id );
  equal ( parsed[0].markup[0].start, 8);
  equal ( parsed[0].markup[0].end, 9);
});

test('markup: superscript', function() {
  var parsed = compiler.parse('e=mc<sup>2</sup>');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'e=mc2' );
  equal ( parsed[0].markup.length, 1 );
  equal ( parsed[0].markup[0].type, Type.SUPERSCRIPT.id );
  equal ( parsed[0].markup[0].start, 4);
  equal ( parsed[0].markup[0].end, 5);
});

test('markup: list items', function() {
  var parsed = compiler.parse('<ul><li>Item 1</li><li>Item 2</li></ul>');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'Item 1Item 2' );
  equal ( parsed[0].markup.length, 2 );
  equal ( parsed[0].markup[0].type, Type.LIST_ITEM.id );
  equal ( parsed[0].markup[0].start, 0 );
  equal ( parsed[0].markup[0].end, 6 );
  equal ( parsed[0].markup[1].type, Type.LIST_ITEM.id );
  equal ( parsed[0].markup[1].start, 6 );
  equal ( parsed[0].markup[1].end, 12 );
});

test('markup: nested tags', function() {
  var parsed = compiler.parse('<p><em><strong>Double.</strong></em> <strong><em>Double staggered</em> start.</strong> <strong>Double <em>staggered end.</em></strong> <strong>Double <em>staggered</em> middle.</strong></p>');

  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'Double. Double staggered start. Double staggered end. Double staggered middle.' );
  equal ( parsed[0].markup.length, 8 );

  equal ( parsed[0].markup[0].type, Type.ITALIC.id );
  equal ( parsed[0].markup[0].start, 0 );
  equal ( parsed[0].markup[0].end, 7 );

  equal ( parsed[0].markup[1].type, Type.BOLD.id );
  equal ( parsed[0].markup[1].start, 0 );
  equal ( parsed[0].markup[1].end, 7 );

  equal ( parsed[0].markup[2].type, Type.BOLD.id );
  equal ( parsed[0].markup[2].start, 8 );
  equal ( parsed[0].markup[2].end, 31 );

  equal ( parsed[0].markup[3].type, Type.ITALIC.id );
  equal ( parsed[0].markup[3].start, 8 );
  equal ( parsed[0].markup[3].end, 24 );

  equal ( parsed[0].markup[4].type, Type.BOLD.id );
  equal ( parsed[0].markup[4].start, 32 );
  equal ( parsed[0].markup[4].end, 53 );

  equal ( parsed[0].markup[5].type, Type.ITALIC.id );
  equal ( parsed[0].markup[5].start, 39 );
  equal ( parsed[0].markup[5].end, 53 );

  equal ( parsed[0].markup[6].type, Type.BOLD.id );
  equal ( parsed[0].markup[6].start, 54 );
  equal ( parsed[0].markup[6].end, 78 );

  equal ( parsed[0].markup[7].type, Type.ITALIC.id );
  equal ( parsed[0].markup[7].start, 61 );
  equal ( parsed[0].markup[7].end, 70 );
});

test('markup: nested/unsupported tags', function() {
  var parsed = compiler.parse('<p>Test one <strong>two</strong> <em><strong>three</strong></em> <span>four</span> <span><strong>five</strong></span> <strong><span>six</span></strong> <strong></strong><span></span><strong><span></span></strong><span><strong></strong></span>seven</p>');

  equal ( parsed.length, 1 );
  equal ( parsed[0].type, Type.PARAGRAPH.id );
  equal ( parsed[0].value, 'Test one two three four five six seven' );
  equal ( parsed[0].markup.length, 5 );

  equal ( parsed[0].markup[0].type, Type.BOLD.id );
  equal ( parsed[0].markup[0].start, 9 );
  equal ( parsed[0].markup[0].end, 12 );

  equal ( parsed[0].markup[1].type, Type.ITALIC.id );
  equal ( parsed[0].markup[1].start, 13 );
  equal ( parsed[0].markup[1].end, 18 );

  equal ( parsed[0].markup[2].type, Type.BOLD.id );
  equal ( parsed[0].markup[2].start, 13 );
  equal ( parsed[0].markup[2].end, 18 );

  equal ( parsed[0].markup[3].type, Type.BOLD.id );
  equal ( parsed[0].markup[3].start, 24 );
  equal ( parsed[0].markup[3].end, 28 );

  equal ( parsed[0].markup[4].type, Type.BOLD.id );
  equal ( parsed[0].markup[4].start, 29 );
  equal ( parsed[0].markup[4].end, 32 );
});

test('markup: preserves spaces in empty tags', function() {
  var rendered = compiler.rerender('<p>Testing a<span> </span><em>space</em></p>');
  equal ( rendered, '<p>Testing a <em>space</em></p>');
});

test('markup: self-closing tags with nesting', function() {
  var input = '<p><strong>Blah <br/>blah</strong> <br/>blah</p>';
  var parsed = compiler.parse(input);

  equal ( parsed[0].value, 'Blah blah blah' );
  equal ( parsed[0].markup.length, 3 );

  equal ( parsed[0].markup[0].type, Type.BOLD.id );
  equal ( parsed[0].markup[0].start, 0 );
  equal ( parsed[0].markup[0].end, 9 );

  equal ( parsed[0].markup[1].type, Type.BREAK.id );
  equal ( parsed[0].markup[1].start, 5 );
  equal ( parsed[0].markup[1].end, 5 );

  equal ( parsed[0].markup[2].type, Type.BREAK.id );
  equal ( parsed[0].markup[2].start, 10 );
  equal ( parsed[0].markup[2].end, 10 );
});

test('markup: whitespace', function() {
  var parsed = compiler.parse('<ul>   ' +
                              '\t <li>Item <em>1</em></li> &nbsp;\n' +
                              '   <li><strong>Item 2</strong></li>\r\n &nbsp; ' +
                              '\t\t<li><strong>Item</strong> 3</li>\r' +
                              '</ul>');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'Item 1 Item 2 Item 3' );

  var markup = parsed[0].markup
  equal ( markup.length, 6);
  equal ( markup[0].type, Type.LIST_ITEM.id );
  equal ( markup[0].start, 0 );
  equal ( markup[0].end, 6 );
  equal ( markup[1].type, Type.ITALIC.id );
  equal ( markup[1].start, 5 );
  equal ( markup[1].end, 6 );
  equal ( markup[2].type, Type.LIST_ITEM.id );
  equal ( markup[2].start, 7 );
  equal ( markup[2].end, 13 );
  equal ( markup[3].type, Type.BOLD.id );
  equal ( markup[3].start, 7 );
  equal ( markup[3].end, 13 );
  equal ( markup[4].type, Type.LIST_ITEM.id );
  equal ( markup[4].start, 14 );
  equal ( markup[4].end, 20 );
  equal ( markup[5].type, Type.BOLD.id );
  equal ( markup[5].start, 14 );
  equal ( markup[5].end, 18 );
});

test('markup: consistent order', function() {
  var correctlyOrdered = compiler.parse('<p><a><strong>text</strong></a></p>');
  var incorrectlyOrdered = compiler.parse('<p><strong><a>text</a></strong></p>');

  equal( compiler.render(correctlyOrdered),  compiler.render(incorrectlyOrdered) );
});

test('attributes', function() {
  var parsed = compiler.parse('<p><a href="http://google.com/" rel="nofollow">Link to google.com</a></p>');

  equal ( parsed[0].markup[0].attributes.href, 'http://google.com/' );
  equal ( parsed[0].markup[0].attributes.rel,  'nofollow' );
});

test('attributes filters out inline styles and classes', function() {
  var parsed = compiler.parse('<p class="test" style="color:red;"><b style="line-height:11px">test</strong></p>');

  equal ( parsed[0].attributes, undefined );
  equal ( parsed[0].markup[0].attributes, undefined );
});

test('blocks: paragraph', function() {
  var parsed = compiler.parse('<p>TEXT</p>');
  
  equal ( parsed.length, 1 );
  equal ( parsed[0].type, Type.PARAGRAPH.id );
});

test('blocks: heading', function() {
  var parsed = compiler.parse('<h2>TEXT</h2>');
  
  equal ( parsed.length, 1 );
  equal ( parsed[0].type, Type.HEADING.id );
});

test('blocks: subheading', function() {
  var parsed = compiler.parse('<h3>TEXT</h3>');
  
  equal ( parsed.length, 1 );
  equal ( parsed[0].type, Type.SUBHEADING.id );
});

test('blocks: image', function() {
  var parsed = compiler.parse('<img src="http://domain.com/test.png"/>');
  
  equal ( parsed.length, 1 );
  equal ( parsed[0].type, Type.IMAGE.id );
  equal ( parsed[0].attributes.src, 'http://domain.com/test.png' );
});

test('blocks: quote', function() {
  var parsed = compiler.parse('<blockquote>quote</blockquote>');
  
  equal ( parsed.length, 1 );
  equal ( parsed[0].type, Type.QUOTE.id );
});

test('blocks: list', function() {
  var parsed = compiler.parse('<ul><li>Item 1</li> <li>Item 2</li></ul>');
  
  equal ( parsed.length, 1 );
  equal ( parsed[0].type, Type.LIST.id );
});

test('blocks: ordered list', function() {
  var parsed = compiler.parse('<ol><li>Item 1</li> <li>Item 2</li></ol>');
  
  equal ( parsed.length, 1 );
  equal ( parsed[0].type, Type.ORDERED_LIST.id );
});

test('blocks: mixed', function() {
  var input = '<h2>The Title</h2><h3>The Subtitle</h3><p>TEXT <strong>1</strong></p><p>TEXT <strong><em>2</em></strong></p><p>TEXT with a <a href="http://google.com/">link</a>.</p><blockquote>Quote</blockquote>';
  var parsed = compiler.parse(input);
  
  equal ( parsed.length, 6 );
  equal ( parsed[0].type, Type.HEADING.id );
  equal ( parsed[1].type, Type.SUBHEADING.id );
  equal ( parsed[2].type, Type.PARAGRAPH.id );
  equal ( parsed[3].type, Type.PARAGRAPH.id );
  equal ( parsed[4].type, Type.PARAGRAPH.id );
  equal ( parsed[5].type, Type.QUOTE.id );
});

test('blocks: self-closing', function() {
  var input = '<img src="http://domain.com/test.png"/><p>Line<br/>break</p>';
  var parsed = compiler.parse(input);
  
  equal ( parsed.length, 2 );
  equal ( parsed[0].type, Type.IMAGE.id );
  equal ( parsed[0].attributes.src, 'http://domain.com/test.png' );
});

test('converts tags to mapped values', function() {
  var input = '<p><b><i>Converts</i> tags</b>.</p>';
  var parsed = compiler.parse(input);
  var rendered = compiler.render(parsed);

  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'Converts tags.');
  equal ( parsed[0].markup.length, 2);
  equal ( parsed[0].markup[0].type, Type.BOLD.id );
  equal ( parsed[0].markup[0].start, 0 );
  equal ( parsed[0].markup[0].end, 13 );
  equal ( parsed[0].markup[1].type, Type.ITALIC.id );
  equal ( rendered, '<p><strong><em>Converts</em> tags</strong>.</p>');
});
