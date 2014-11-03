Templz
======

A Mustache-inspired template engine that can work with string and DOM elements.

## Installation

As a standalone Javascript file (not needed when using AMD loaders like Require.js):

```html
<script type="text/javascript" src="templz.js"></script>
```

When using an AMD loader (like RequireJS in this example), you should require the module
at the beginning like this:

```js
require(["templz"], function(Templz) {
    ...
});
```

The module returns the `Templz` object, together with its static methods and properties.


## Usage

The basic concept is to create a compiled template out of a string, a DOM element or a `DocumentFragment`, and then use it to render the final result using the data and the partial passed to the `render` function. When used with plain strings, it behaves just like an implementation of Mustache's specs:

```js
var template = Templz.parse("This is {{city}}!");

console.log(template.render({ city: "Atheeeens" });
// "This is Atheeeens!"
```

The resulting template object a *string* template (`template.type === "string"`).

When an element is passed to the `Templz.parse` function, it *also* uses the directives represented as specially named attributes to define Mustache-like constructs:

```html
<template id="myTemplate">
    This is one of the following {{kind}}:
    <ul>
        <li tpl-section="items">{{type}} (<span tpl-name="quantity"></span>);</li>
    </ul>
    {{#warning}}
    You <em class="{{chanceClass}}">may</em> expect some issues.
    {{/warning}}
</template>
```

```js
var template = Templz.parse(document.getElementById("myTemplate"));

document.body.appendChild(template.render({
    kind: "fruits",
    items: [
        { type: "apples", quantity: 20},
        { type: "oranges", quantity: 10},
        { type: "pears", quantity: 15}
    ],
    warning: { chanceClass: "plain" }
}));
```

As you can see, you can mix Mustache tags with Templz' own directives, and use Mustache templates in attributes too. This is the result, given as a `DocumentFragment`:

```html
This is one of the following fruits:
<ul>
    <li>apples (<span>20</span>);</li>
    <li>oranges (<span>10</span>);</li>
    <li>pears (<span>15</span>);</li>
</ul>
You <em class="plain">may</em> expect some issues.
```

In this case, `template.type === "fragment"`.

Although Templz has been developed with the `<template>` element in mind, it can work with any `Element` or `DocumentFragment` nodes, so you can use `<template>` to define your DOM templates in browsers that doesn't support it (of course, be sure to make them invisible using `display: none` or other method, and keep in mind that they won't be *inert*, i.e. elements like `<img>`, `<script>` and `<link>` may perform HTTP requests and run scripts).

## Directives

As you can see from the preliminary examples, Templz' directives are defined as attributes with names beginning with `tpl-`. This prefix is defined in the `Templz.prefix` property, so you can change it to your needs (for example, setting it to `data-tpl` to make it HTML5 compliant).

All the directive attributes will be removed in the final result.

* `tpl-name`

  This is the equivalent of the usual value interpolation of Mustache. The node is filled with the respective value from the data passed to the `render` function, with troublesome HTML entities escaped, and the existing content is discarded.
  
  ```html
  <span tpl-name="value">This text will be removed in the rendered result.</span>
  ```

* `tpl-content`

  This behaves like `tpl-name`, but the interpolated value isn't escaped. This is the equivalent of `{{{...}}}` or `{{&...}}` tags in Mustache.
  
  ```html
  The content in the following element will <em>not</em> be escaped:
  <div tpl-content="html"></div>
  ```

* `tpl-section`

  Templz' sections are sort of like Mustache's sections. The element is kept or discarded in the rendered result if the respective value in the data is *truthy* or *falsy* (according to the Javascript definitions). But if the value is an array, the element is repeated for each item of the array, and rendered using the data contaned in the item.
  
  ```html
  <div class="user-box" tpl-section="users">
      {{username}} <span tpl-name="role"></span>
  </div>
  ```

* `tpl-empty`

  Templz also supports inverted sections, i.e. elements that are rendered if and only if the respective data is *falsy*, similarly to `{{^...}}` tags in Mustache.
  
  ```html
  Operation complete.
  <div tpl-empty="items" clas="warning-message">
      Warning: no item has been found.
  </div>
  ```

* `tpl-partial`

  Elements defined as partial wrappers are filled with the rendered result of the respective partial template passed to the `render` method. If no corresponding partial is found, the node is discarded from the final result.
  
  ```html
  Upload your photo here:
  <div data-upload-type="photo" tpl-partial="upload"></div>
  
  Upload your document here:
  <div data-upload-type="document" tpl-partial="upload"></div>
  ```

* `tpl-prefix`

  This changes the directive prefix for the subsequent compilation of the template. Keep in mind that different user agents handle attributes in different ways, so using lowercase prefixes is recommended.
  
  ```html
  This uses the default prefix: <span tpl-name="value"></span>
  <div tpl-prefix="hello-">
      A new way: <span hello-name="world"></span>.
      This tag will not be filled: <span tpl-name="world">exactly</span>,
      and will keel the <code>tpl-name</code> attribute.
  </div>
  Restoring the default prefix: <span hello-prefix="tpl-" tpl-name="confirm"></span>.
  ```
  
  Unlike the previous directives, which are mutually exclusive, `tpl-prefix` can be used together with other directives.

* `tpl-tags`

  This changes the delimiters of text tags, similarly to `{{=...}}` tags in Mustache. Just as in Mustache, the opening and closing tags should be separated by whitespaces.
  
  ```html
  <div tpl-tags="(% %)" class="(% theClass %)">
      A list: (%#list%) (%.%), (%/list%) and nothing else matters.
  </div>
  ```
  
  This one can be used with other directives, like `tpl-prefix`. The default tag delimiters are set in `Templz.tags` as an array of two strings.

## Partials

Partials can be defined in the key/value pairs argument passed after the data object in the `render` method. Partials can be compiled templates, either of *string* or *fragment* type, or strings, or DOM nodes. Strings and nodes are first compiled using the default tags and prefix.

If the rendering template is a *fragment* template, then *fragment* partials are inserted seamlessly as collections of nodes. If the partial is a *string* template, it's inserted into the result as a text node.

On the other hand, if the template that's being rendered is a *string* template, a *string* partial is interpolated as specified by Mustache. But if it's a *fragment* template partial, the result is inserted after a serialization of the resulting `DocumentFragment` node.

## Browser support

Templz has been tested in the following environments:

* Google Chrome 35+ (probably working fine with previous versions too)
* Mozilla Firefox 30+ (see above)
* Internet Explorer 7+
* Opera 12.x, 15+
* node.js 0.10+

In general, as long as *string* templates are used, it should work in every Javascript environment. When dealing with *fragment* templates, every environment with a standard DOM implementation should work fine. Special workarounds are used for older versions of Internet Explorer (it's *always* about old IE...).

`HTMLTemplateElement` support is granted in Chrome 26+, Firefox 22+, Opera 15+ and Android 4.4+. For more details, check [CanIUse](http://caniuse.com/#feat=template).

## To-do

* Full JSDoc code commenting
* Overall code optimization
* Complete test cases and Mustache specs conformity
* Comparison benchmarks
* `Templz.render` for direct template rendering
* `Templz.serialize`, a utility to serialize nodes
* Complete XML support
* node.js support with some DOM implementation like [jsome](https://github.com/tmpvar/jsdom)
* Upload as `npm` module and `bower` package

### Under consideration

* Template caching - compiling templates allows the developer to handle his/her own caches
* `tpl-comment`: trying to find a point of template comments when you can use HTML comments
* Some directive to dynamically set node attributes
* Lambda functions as partials
* Interpolation of comment and CDATA nodes

## License

The MIT License (MIT)

Copyright (c) 2014 Massimo Artizzu (MaxArt2501)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.