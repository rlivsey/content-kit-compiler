# ContentKit Compiler [![Build Status](https://travis-ci.org/bustlelabs/content-kit-compiler.svg?branch=master)](https://travis-ci.org/bustlelabs/content-kit-compiler)

Parses and renders content to and from the JSON model that backs ContentKit's WYSIWYG Editor

### Examples

Parsing HTML:
```html
<h2>My First Blog Post</h2>
<h3>The Subtitle</h3>
<p>This is a paragraph, with a <a href="http://google.com/">link</a> and some <b>formatting</b>.</p>
<img src="kittens.png" alt="Kittens"/>
<ul>
  <li>Item A</li>
  <li>Item B</li>
</ul>
```

```js
var compiler = new ContentKit.Compiler();
var json = compiler.parse(html);
```

_Output:_
```json
[
  {
    "type":2,
    "value":"My First Blog Post",
    "markup":[]
  },
  {
    "type":3,
    "value":"The Subtitle",
    "markup":[]
  },
  {
    "type":1,
    "value":"This is a paragraph, with a link and some formatting.",
    "markup":[
      {
        "start":28,
        "end":32,
        "type":4,
        "attributes":{
          "href":"http://google.com/"
        }
      },
      {
        "start":42,
        "end":52,
        "type":1
      }
    ]
  },
  {
    "type":4,
    "value":"",
    "markup":[],
    "attributes":{
      "src":"kittens.png",
      "alt":"Kittens"
    }
  },
  {
    "type":6,
    "value":"Item A Item B",
    "markup":[
      {
        "start":0,
        "end":6,
        "type":6
      },
      {
        "start":7,
        "end":13,
        "type":6
      }
    ]
  }
]
```

Rendering JSON to HTML:
```js
var html = compiler.render(json);
```

_Output:_
```html
<h2>My First Blog Post</h2><h3>The Subtitle</h3><p>This is a paragraph, with a <a href="http://google.com/">link</a> and some <b>formatting</b>.</p><img src="kittens.png" alt="Kittens"/><ul><li>Item A</li> <li>Item B</li></ul>
```

## Building / Testing

 * `bower install`
 * `npm install`
 * `npm run serve && open http://localhost:4200/tests` or
 * `npm test` (uses testem to run tests in phantom and chrome)
