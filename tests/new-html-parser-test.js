/* global QUnit, ok, equal, test, deepEqual */
const MARKUP_SECTION = 1;

function buildDOM(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

import ContentKit from 'content-kit-compiler';

QUnit.module('new HTMLParser');

var parser = new ContentKit.NewHTMLParser();

test('parse empty content', function() {
  var post = parser.parse(buildDOM(''));
  deepEqual(
    post,
    { sections: [] }
  );
});

test('p tag (section markup) should create a block', function() {
  var post = parser.parse(buildDOM('<p>text</p>'));

  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [],
        close: 0,
        value: 'text'
      }]
    }]
  });
});

test('strong tag (stray markup) without a block should create a block', function() {
  var post = parser.parse(buildDOM('<strong>text</strong>'));

  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [{
          tagName: 'STRONG'
        }],
        close: 1,
        value: 'text'
      }]
    }]
  });
});

test('strong tag (stray markup) without a block should create a block', function() {
  var post = parser.parse(buildDOM('<strong><em>stray</em> markup tags</strong>.'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [{
          tagName: 'STRONG'
        },{
          tagName: 'EM'
        }],
        close: 1,
        value: 'stray'
      },{
        open: [],
        close: 1,
        value: ' markup tags'
      },{
        open: [],
        close: 0,
        value: '.'
      }]
    }]
  });
});

test('stray text (stray markup) should create a block', function() {
  var post = parser.parse(buildDOM('text'));

  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [],
        close: 0,
        value: 'text'
      }]
    }]
  });
});

test('strong tag (stray markup) without a block should create a block', function() {
  var post = parser.parse(buildDOM('start <strong>bold</strong> end'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [],
        close: 0,
        value: 'start '
      },{
        open: [{
          tagName: 'STRONG'
        }],
        close: 1,
        value: 'bold'
      },{
        open: [],
        close: 0,
        value: ' end'
      }]
    }]
  });
});

test('italic tag (stray markup) without a block should create a block', function() {
  var post = parser.parse(buildDOM('<em>text</em>'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [{
          tagName: 'EM'
        }],
        close: 1,
        value: 'text'
      }]
    }]
  });
});

test('u tag (stray markup) without a block should create a block', function() {
  var post = parser.parse(buildDOM('<u>text</u>'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [{
          tagName: 'U'
        }],
        close: 1,
        value: 'text'
      }]
    }]
  });
});

test('a tag (stray markup) without a block should create a block', function() {
  var url = "http://test.com";
  var post = parser.parse(buildDOM('<a href="'+url+'">text</u>'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [{
          tagName: 'A',
          attributes: ['href', url]
        }],
        close: 1,
        value: 'text'
      }]
    }]
  });
});

/*
// FIXME: Implement void element markers
test('markup: break', function() {
  var parsed = compiler.parse('line <br/>break');
  equal ( parsed.length, 1 );
  equal ( parsed[0].value, 'line break' );
  equal ( parsed[0].markup.length, 1 );
  equal ( parsed[0].markup[0].type, Type.BREAK.id );
  equal ( parsed[0].markup[0].start, 5);
  equal ( parsed[0].markup[0].end, 5);
});
*/

test('sub tag (stray markup) without a block should create a block', function() {
  var post = parser.parse(buildDOM('footnote<sub>1</sub>'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [],
        close: 0,
        value: 'footnote'
      },{
        open: [{
          tagName: 'SUB'
        }],
        close: 1,
        value: '1'
      }]
    }]
  });
});

test('sup tag (stray markup) without a block should create a block', function() {
  var post = parser.parse(buildDOM('e=mc<sup>2</sup>'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [],
        close: 0,
        value: 'e=mc'
      },{
        open: [{
          tagName: 'SUP'
        }],
        close: 1,
        value: '2'
      }]
    }]
  });
});

test('list (stray markup) without a block should create a block', function() {
  var post = parser.parse(buildDOM('<ul><li>Item 1</li><li>Item 2</li></ul>'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [{
          tagName: 'UL'
        }, {
          tagName: 'LI'
        }],
        close: 1,
        value: 'Item 1'
      },{
        open: [{
          tagName: 'LI'
        }],
        close: 2,
        value: 'Item 2'
      }]
    }]
  });
});

test('nested tags (section markup) should create a block', function() {
  var post = parser.parse(buildDOM('<p><em><strong>Double.</strong></em> <strong><em>Double staggered</em> start.</strong> <strong>Double <em>staggered end.</em></strong> <strong>Double <em>staggered</em> middle.</strong></p>'));
  deepEqual( post, {
    sections: [{
      type: MARKUP_SECTION,
      tagName: 'P',
      markups: [{
        open: [{
          tagName: 'EM'
        }, {
          tagName: 'STRONG'
        }],
        close: 2,
        value: 'Double.'
      },{
        open: [],
        close: 0,
        value: ' '
      },{
        open: [{
          tagName: 'STRONG'
        },{
          tagName: 'EM'
        }],
        close: 1,
        value: 'Double staggered'
      },{
        open: [],
        close: 1,
        value: ' start.'
      },{
        open: [],
        close: 0,
        value: ' '
      },{
        open: [{
          tagName: 'STRONG'
        }],
        close: 0,
        value: 'Double '
      },{
        open: [{
          tagName: 'EM'
        }],
        close: 2,
        value: 'staggered end.'
      },{
        open: [],
        close: 0,
        value: ' '
      },{
        open: [{
          tagName: 'STRONG'
        }],
        close: 0,
        value: 'Double '
      },{
        open: [{
          tagName: 'EM'
        }],
        close: 1,
        value: 'staggered'
      },{
        open: [],
        close: 1,
        value: ' middle.'
      }]
    }]
  });
});

/*
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
*/
