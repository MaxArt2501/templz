Templz
======

Logic-less `<template>`s with a sense.

A Mustache-inspired template engine that can work with string and DOM elements. Even together!

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
var template = Templz.compile("This is {{city}}!");

console.log(template.render({ city: "Atheeeens" });
// "This is Atheeeens!"
```

The resulting template object a *string* template (`template.type === Templz.STRING_TEMPLATE`).

When an element is passed to the `Templz.compile` function, it *also* uses the directives represented as specially named attributes to define Mustache-like constructs:

```html
<template id="myTemplate">
    This is one of the following {{kind}}:
    <ul>
        <li tpz-section="items">{{type}} (<span tpz-name="quantity"></span>);</li>
    </ul>
    {{#warning}}
    You <em class="{{chanceClass}}">may</em> expect some issues.
    {{/warning}}
</template>
```

```js
var template = Templz.compile(document.getElementById("myTemplate"));

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

In this case, `template.type === Templz.FRAGMENT_TEMPLATE`.

Although Templz has been developed with the `<template>` element in mind, it can work with any `Element` or `DocumentFragment` nodes, so you can use `<template>` to define your DOM templates in browsers that doesn't support it (of course, be sure to make them invisible using `display: none` or other method, and keep in mind that they won't be *inert*, i.e. elements like `<img>`, `<script>` and `<link>` may perform HTTP requests and run scripts).

**Note**: when mixing Mustache tags with DOM elements, keep in mind that you can create sections and inverted sections encompassing DOM elements, but *only if* the opening and closing tags of the sections belong to text nodes with *the same parent node*. This, for example, is not a valid template:

```html
<div>
    Some text.
    <br>
    {{#section}}
    Section start.
</div>
<div>
    Section end.
    {{/section}}
    <br>
    Final text.
</div>
```

## Directives

As you can see from the preliminary examples, Templz' directives are defined as attributes with names beginning with `tpz-`. This prefix is defined in the `Templz.prefix` property, so you can change it to your needs (for example, setting it to `data-tpl` to make it HTML5 compliant).

All the directive attributes will be removed in the final result.

* `tpz-name`

  This is the equivalent of the usual value interpolation of Mustache. The node is filled with the respective value from the data passed to the `render` function, with troublesome HTML entities escaped, and the existing content is discarded.
  
  ```html
  <span tpz-name="value">This text will be removed in the rendered result.</span>
  ```

* `tpz-content`

  This behaves like `tpz-name`, but the interpolated value isn't escaped. This is the equivalent of `{{{...}}}` or `{{&...}}` tags in Mustache.
  
  ```html
  The content in the following element will <em>not</em> be escaped:
  <div tpz-content="html"></div>
  ```

* `tpz-section`

  Templz' sections are sort of like Mustache's sections. The element is kept or discarded in the rendered result if the respective value in the data is *truthy* or *falsy* (according to the Javascript definitions). But if the value is an array, the element is repeated for each item of the array, and rendered using the data contaned in the item.
  
  ```html
  <div class="user-box" tpz-section="users">
      {{username}} <span tpz-name="role"></span>
  </div>
  ```

* `tpz-empty`

  Templz also supports inverted sections, i.e. elements that are rendered if and only if the respective data is *falsy*, similarly to `{{^...}}` tags in Mustache.
  
  ```html
  Operation complete.
  <div tpz-empty="items" clas="warning-message">
      Warning: no item has been found.
  </div>
  ```

* `tpz-partial`

  Elements defined as partial wrappers are filled with the rendered result of the respective partial template passed to the `render` method. If no corresponding partial is found, the node is discarded from the final result.
  
  ```html
  Upload your photo here:
  <div data-upload-type="photo" tpz-partial="upload"></div>
  
  Upload your document here:
  <div data-upload-type="document" tpz-partial="upload"></div>
  ```

* `tpz-prefix`

  This changes the directive prefix for the subsequent compilation of the template. Keep in mind that different user agents handle attributes in different ways, so using lowercase prefixes is recommended.
  
  ```html
  This uses the default prefix: <span tpz-name="value"></span>
  <div tpz-prefix="hello-">
      A new way: <span hello-name="world"></span>.
      This tag will not be filled: <span tpz-name="world">exactly</span>,
      and will keel the <code>tpz-name</code> attribute.
  </div>
  Restoring the default prefix: <span hello-prefix="tpz-" tpz-name="confirm"></span>.
  ```
  
  Unlike the previous directives, which are mutually exclusive, `tpz-prefix` can be used together with other directives.

* `tpz-tags`

  This changes the delimiters of text tags, similarly to `{{=...}}` tags in Mustache. Just as in Mustache, the opening and closing tags should be separated by whitespaces.
  
  ```html
  <div tpz-tags="(% %)" class="(% theClass %)">
      A list: (%#list%) (%.%), (%/list%) and nothing else matters.
  </div>
  ```
  
  This one can be used with other directives, like `tpz-prefix`. The default tag delimiters are set in `Templz.tags` as an array of two strings.

## Partials

Partials can be defined in the key/value pairs argument passed after the data object in the `render` method. Partials can be compiled templates, either of *string* or *fragment* type, or strings, or DOM nodes. Strings and nodes are first compiled using the default tags and prefix.

If the rendering template is a *fragment* template, then *fragment* partials are inserted seamlessly as collections of nodes. If the partial is a *string* template, it's inserted into the result as a text node.

On the other hand, if the template that's being rendered is a *string* template, a *string* partial is interpolated as specified by Mustache. But if it's a *fragment* template partial, the result is inserted after a serialization of the resulting `DocumentFragment` node.

## API

These are the methods and properties defined on the `Templz` object.

* `Templz.compile(template[, tags[, prefix]])`

  This is the entry point of Templz. You pass a string or a node, and you get a compiled template back.
  
  The `tags` argument is to define the Mustache tag delimiters used for parsing the template, and it can be either a string consisting on the opening and closing delimiters separated by whitespace (e.g. `"(% %)"`) or an array of two strings (e.g. `[ "(%", "%)" ]`). If omitted, `Templz.tags` is used.
  
  The `prefix` argument is to define the Templz directive prefix. If omitted, `Templz.prefix` is used.

* `Templz.serialize(fragment)`

  Serializes the children of a `Node` object into a string. Developed with `DocumentFragment` nodes in mind, it can work with `Element` nodes too.

* `Templz.createFragment(html)`

  Creates a `DocumentFragment` node, initialized with the given content passed as raw HTML.

* `Templz.tags`

  Opening and closing delimiters for Mustache tags. See `Templz.compile` for details. It's normally set to `[ "{{", "}}" ]`.

* `Templz.prefix`

  Templz own directive attribute prefix. It defines the prefix of the node attributes the Templz looks for when parsing *fragment* templates. Initially set to `"tpz-"`.

* `Templz.STRING_TEMPLATE`, `Templz.FRAGMENT_TEMPLATE`

  Constants to check the `type` property of compiled templates. Currently set to `"string"` and `"fragment"`, respectively.

* `ParsedTemplate.render([data, [partials]])`

  Renders a compiled template, returning a string (if it's a *string* template) or a `DocumentFragment` node (if it's a *fragment* template).
  
  `data` is an object containing the data used to build the result, just as in Mustache.
  
  Similarly, `partials` is a key/value map that provides the partials for rendering. The given partials can be `ParsedTemplate` objects of either types, or strings or nodes. In these two last cases, they're compiled using `Templz.compile`.

* `ParsedTemplate.type`

  The type of the compiled template. It may equal `Templz.STRING_TEMPLATE` or `Templz.FRAGMENT_TEMPLATE`.

## Browser support

Templz has been tested in the following environments:

* Google Chrome 35+ (probably working fine with previous versions too)
* Mozilla Firefox 30+ (see above)
* Internet Explorer 7+
* Opera 12.15, 22+ (probably fine with 15-21 too)
* node.js 0.10+

In general, as long as *string* templates are used, it should work in every Javascript environment that's not horribly outdated. When dealing with *fragment* templates, every environment with a standard DOM implementation should work fine. Special workarounds are used for older versions of Internet Explorer (it's *always* about old IE...), but they don't cover things like element serialization or text node normalization, so expect some quirky behaviours.

`HTMLTemplateElement` support is granted in Chrome 26+, Firefox 22+, Opera 15+ and Android 4.4+. For more details, check [CanIUse](http://caniuse.com/#feat=template).

## Known issues

[Mustache conformity](https://github.com/mustache/spec/tree/master/specs) for *string* templates isn't perfect. But compared to the two main alternatives, Twitter's Hogan and janl's Mustache implementation, Templz behaves *better*, failing only 7 tests out of 122 (compared to 8 for Hogan and 16 for Mustache).

The main source of problems is the conformity with lambda functions. Namely, Templz doesn't parse the result of the lambda call, and doesn't call the function for sections (it just considers it as a truthy value). Something similar happens for Hogan and janl's Mustache, too.

Moreover, Templz indents all the lines of an indented partial. This is correct, *except* when the new lines come from an *unescaped* interpolation (triple mustache or ampersand tag).
  
## To-do

* Full JSDoc code commenting
* Overall code optimization
* Complete test cases and Mustache specs conformity
* More examples
* Comparison benchmarks
* `Templz.serialize`, a utility to serialize nodes
* node.js support with some DOM implementation like [jsdom](https://github.com/tmpvar/jsdom)
* Upload as `npm` module and `bower` package

### Under consideration

* `Templz.render` for direct template rendering
* Template caching: compiling templates allows the developer to handle his/her own caches
* `tpz-comment`: trying to find a point in template comments when you can use HTML comments
* Some directive to dynamically set node attributes
* Lambda functions as sections
* Complete XML support
* Rendering comment and CDATA nodes

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