/*!
 * Templz test units
 * 
 * Open test-templz.html in a browser to test Templz in a user agent environment
 * 
 * To test Templz in node.js, just type
 * 
 *     node test-templz.js
 * 
 * Fragment templates won't be tested, though (will add support for node.js DOM
 * implementations in the future).
 */
(function(ready) {
	if (typeof window !== "undefined")
		window.onload = function() { ready(true); };
	else if (typeof exports === "object")
		ready(false);
})(function(isBrowser) {

		// Simple function to fix IE8- that converts HTML tag names to uppercase
	var fixIETags = isBrowser && document.createElement("b").outerHTML === "<B></B>" ? function(html) {
			return html.replace(/<\/?\w+/g, function(m) { return m.toLowerCase(); });
		} : function(html) { return html; },

		// Return a <div> element with the HTML content set
		makeDiv = isBrowser ? function(html) {
			var div = document.createElement("div");
			div.innerHTML = html;
			return div;
		} : function() {},

		// Serializes the outcome fragment and fixes the tags
		fragToString = function(outcome) {
			return fixIETags(Templz.serialize(outcome));
		};

	var tests = [
		{
			desc: "String templates - interpolation",
			tests : [
				{
					name: "No Interpolation",
					data: {},
					expected: "Hello from {Templz}!\n",
					template: "Hello from {Templz}!\n",
					desc: "Tag-free templates should render as-is."
				}, {
					name: "Basic Interpolation",
					data: {
						subject: "world"
					},
					expected: "Hello, world!\n",
					template: "Hello, {{subject}}!\n",
					desc: "Unadorned tags should interpolate content into the template."
				}, {
					name: "HTML Escaping",
					data: {
						forbidden: "& \" < >"
					},
					expected: "These characters should be HTML escaped: &#38; &#34; &#60; &#62;\n",
					template: "These characters should be HTML escaped: {{forbidden}}\n",
					desc: "Basic interpolation should be HTML escaped."
				}, {
					name: "Triple curly braces",
					data: {
						forbidden: "& \" < >"
					},
					expected: "These characters should not be HTML escaped: & \" < >\n",
					template: "These characters should not be HTML escaped: {{{forbidden}}}\n",
					desc: "Triple curly braces should interpolate without HTML escaping."
				}, {
					name: "Ampersand",
					data: {
						forbidden: "& \" < >"
					},
					expected: "These characters should not be HTML escaped: & \" < >\n",
					template: "These characters should not be HTML escaped: {{&forbidden}}\n",
					desc: "Ampersand should interpolate without HTML escaping."
				}, {
					name: "Basic Integer Interpolation",
					data: {
						mph: 85
					},
					expected: "\"85 miles an hour!\"",
					template: "\"{{mph}} miles an hour!\"",
					desc: "Integers should interpolate seamlessly."
				}, {
					name: "Triple curly braces Integer Interpolation",
					data: {
						mph: 85
					},
					expected: "\"85 miles an hour!\"",
					template: "\"{{{mph}}} miles an hour!\"",
					desc: "Integers should interpolate seamlessly."
				}, {
					name: "Ampersand Integer Interpolation",
					data: {
						mph: 85
					},
					expected: "\"85 miles an hour!\"",
					template: "\"{{&mph}} miles an hour!\"",
					desc: "Integers should interpolate seamlessly."
				}, {
					name: "Basic Decimal Interpolation",
					data: {
						power: 1.21
					},
					expected: "\"1.21 jiggawatts!\"",
					template: "\"{{power}} jiggawatts!\"",
					desc: "Decimals should interpolate seamlessly with proper significance."
				}, {
					name: "Triple curly braces Decimal Interpolation",
					data: {
						power: 1.21
					},
					expected: "\"1.21 jiggawatts!\"",
					template: "\"{{{power}}} jiggawatts!\"",
					desc: "Decimals should interpolate seamlessly with proper significance."
				}, {
					name: "Ampersand Decimal Interpolation",
					data: {
						power: 1.21
					},
					expected: "\"1.21 jiggawatts!\"",
					template: "\"{{&power}} jiggawatts!\"",
					desc: "Decimals should interpolate seamlessly with proper significance."
				}, {
					name: "Basic Context Miss Interpolation",
					data: {},
					expected: "I () be seen!",
					template: "I ({{cannot}}) be seen!",
					desc: "Failed context lookups should default to empty strings."
				}, {
					name: "Triple curly braces Context Miss Interpolation",
					data: {},
					expected: "I () be seen!",
					template: "I ({{{cannot}}}) be seen!",
					desc: "Failed context lookups should default to empty strings."
				}, {
					name: "Ampersand Context Miss Interpolation",
					data: {},
					expected: "I () be seen!",
					template: "I ({{&cannot}}) be seen!",
					desc: "Failed context lookups should default to empty strings."
				}, {
					name: "Dotted Names - Basic Interpolation",
					data: {
						person: {
							name: "Joe"
						}
					},
					expected: "\"Joe\" == \"Joe\"",
					template: "\"{{person.name}}\" == \"{{#person}}{{name}}{{/person}}\"",
					desc: "Dotted names should be considered a form of shorthand for sections."
				}, {
					name: "Dotted Names - Triple curly braces Interpolation",
					data: {
						person: {
							name: "Joe"
						}
					},
					expected: "\"Joe\" == \"Joe\"",
					template: "\"{{{person.name}}}\" == \"{{#person}}{{{name}}}{{/person}}\"",
					desc: "Dotted names should be considered a form of shorthand for sections."
				}, {
					name: "Dotted Names - Ampersand Interpolation",
					data: {
						person: {
							name: "Joe"
						}
					},
					expected: "\"Joe\" == \"Joe\"",
					template: "\"{{&person.name}}\" == \"{{#person}}{{&name}}{{/person}}\"",
					desc: "Dotted names should be considered a form of shorthand for sections."
				}, {
					name: "Dotted Names - Arbitrary Depth",
					data: {
						a: {
							b: {
								c: {
									d: {
										e: {
											name: "Phil"
										}
									}
								}
							}
						}
					},
					expected: "\"Phil\" == \"Phil\"",
					template: "\"{{a.b.c.d.e.name}}\" == \"Phil\"",
					desc: "Dotted names should be functional to any level of nesting."
				}, {
					name: "Dotted Names - Broken Chains",
					data: {
						a: {}

					},
					expected: "\"\" == \"\"",
					template: "\"{{a.b.c}}\" == \"\"",
					desc: "Any falsey value prior to the last part of the name should yield ''."
				}, {
					name: "Dotted Names - Broken Chain Resolution",
					data: {
						a: {
							b: {}

						},
						c: {
							name: "Jim"
						}
					},
					expected: "\"\" == \"\"",
					template: "\"{{a.b.c.name}}\" == \"\"",
					desc: "Each part of a dotted name should resolve only against its parent."
				}, {
					name: "Dotted Names - Initial Resolution",
					data: {
						a: {
							b: {
								c: {
									d: {
										e: {
											name: "Phil"
										}
									}
								}
							}
						},
						b: {
							c: {
								d: {
									e: {
										name: "Wrong"
									}
								}
							}
						}
					},
					expected: "\"Phil\" == \"Phil\"",
					template: "\"{{#a}}{{b.c.d.e.name}}{{/a}}\" == \"Phil\"",
					desc: "The first part of a dotted name should resolve as any other name."
				}, {
					name: "Interpolation - Surrounding Whitespace",
					data: {
						string: "---"
					},
					expected: "| --- |",
					template: "| {{string}} |",
					desc: "Interpolation should not alter surrounding whitespace."
				}, {
					name: "Triple curly braces - Surrounding Whitespace",
					data: {
						string: "---"
					},
					expected: "| --- |",
					template: "| {{{string}}} |",
					desc: "Interpolation should not alter surrounding whitespace."
				}, {
					name: "Ampersand - Surrounding Whitespace",
					data: {
						string: "---"
					},
					expected: "| --- |",
					template: "| {{&string}} |",
					desc: "Interpolation should not alter surrounding whitespace."
				}, {
					name: "Interpolation - Standalone",
					data: {
						string: "---"
					},
					expected: "  ---\n",
					template: "  {{string}}\n",
					desc: "Standalone interpolation should not alter surrounding whitespace."
				}, {
					name: "Triple curly braces - Standalone",
					data: {
						string: "---"
					},
					expected: "  ---\n",
					template: "  {{{string}}}\n",
					desc: "Standalone interpolation should not alter surrounding whitespace."
				}, {
					name: "Ampersand - Standalone",
					data: {
						string: "---"
					},
					expected: "  ---\n",
					template: "  {{&string}}\n",
					desc: "Standalone interpolation should not alter surrounding whitespace."
				}, {
					name: "Interpolation With Padding",
					data: {
						string: "---"
					},
					expected: "|---|",
					template: "|{{ string }}|",
					desc: "Superfluous in-tag whitespace should be ignored."
				}, {
					name: "Triple curly braces With Padding",
					data: {
						string: "---"
					},
					expected: "|---|",
					template: "|{{{ string }}}|",
					desc: "Superfluous in-tag whitespace should be ignored."
				}, {
					name: "Ampersand With Padding",
					data: {
						string: "---"
					},
					expected: "|---|",
					template: "|{{& string }}|",
					desc: "Superfluous in-tag whitespace should be ignored."
				}
			]
		},
		//*/
		{
			desc: "String templates - comments",
			tests: [
				{
					name: "Inline",
					data: {},
					expected: "1234567890",
					template: "12345{{! Comment Block! }}67890",
					desc: "Comment blocks should be removed from the template."
				}, {
					name: "Multiline",
					data: {},
					expected: "1234567890\n",
					template: "12345{{!\n  This is a\n  multi-line comment...\n}}67890\n",
					desc: "Multiline comments should be permitted."
				}, {
					name: "Standalone",
					data: {},
					expected: "Begin.\nEnd.\n",
					template: "Begin.\n{{! Comment Block! }}\nEnd.\n",
					desc: "All standalone comment lines should be removed."
				}, {
					name: "Indented Standalone",
					data: {},
					expected: "Begin.\nEnd.\n",
					template: "Begin.\n  {{! Indented Comment Block! }}\nEnd.\n",
					desc: "All standalone comment lines should be removed."
				}, {
					name: "Standalone Line Endings",
					data: {},
					expected: "|\r\n|",
					template: "|\r\n{{! Standalone Comment }}\r\n|",
					desc: "\"\\r\\n\" should be considered a newline for standalone tags."
				}, {
					name: "Standalone Without Previous Line",
					data: {},
					expected: "!",
					template: "  {{! I'm Still Standalone }}\n!",
					desc: "Standalone tags should not require a newline to precede them."
				}, {
					name: "Standalone Without Newline",
					data: {},
					expected: "!\n",
					template: "!\n  {{! I'm Still Standalone }}",
					desc: "Standalone tags should not require a newline to follow them."
				}, {
					name: "Multiline Standalone",
					data: {},
					expected: "Begin.\nEnd.\n",
					template: "Begin.\n{{!\nSomething's going on here...\n}}\nEnd.\n",
					desc: "All standalone comment lines should be removed."
				}, {
					name: "Indented Multiline Standalone",
					data: {},
					expected: "Begin.\nEnd.\n",
					template: "Begin.\n  {{!\n    Something's going on here...\n  }}\nEnd.\n",
					desc: "All standalone comment lines should be removed."
				}, {
					name: "Indented Inline",
					data: {},
					expected: "  12 \n",
					template: "  12 {{! 34 }}\n",
					desc: "Inline comments should not strip whitespace"
				}, {
					name: "Surrounding Whitespace",
					data: {},
					expected: "12345  67890",
					template: "12345 {{! Comment Block! }} 67890",
					desc: "Comment removal should preserve surrounding whitespace."
				}
			]
		},
		//*/
		{
			desc: "String templates - sections",
			tests: [
				{
					name: "Truthy",
					data: {
						"boolean": true
					},
					expected: "\"This should be rendered.\"",
					template: "\"{{#boolean}}This should be rendered.{{/boolean}}\"",
					desc: "Truthy sections should have their contents rendered."
				}, {
					name: "Falsey",
					data: {
						"boolean": false
					},
					expected: "\"\"",
					template: "\"{{#boolean}}This should not be rendered.{{/boolean}}\"",
					desc: "Falsey sections should have their contents omitted."
				}, {
					name: "Context",
					data: {
						context: {
							name: "Joe"
						}
					},
					expected: "\"Hi Joe.\"",
					template: "\"{{#context}}Hi {{name}}.{{/context}}\"",
					desc: "Objects and hashes should be pushed onto the context stack."
				}, {
					name: "Deeply Nested Contexts",
					data: {
						a: {
							one: 1
						},
						b: {
							two: 2
						},
						c: {
							three: 3
						},
						d: {
							four: 4
						},
						e: {
							five: 5
						}
					},
					expected: "1\n121\n12321\n1234321\n123454321\n1234321\n12321\n121\n1\n",
					template: "{{#a}}\n{{one}}\n{{#b}}\n{{one}}{{two}}{{one}}\n{{#c}}\n{{one}}{{two}}{{three}}{{two}}{{one}}\n{{#d}}\n{{one}}{{two}}{{three}}{{four}}{{three}}{{two}}{{one}}\n{{#e}}\n{{one}}{{two}}{{three}}{{four}}{{five}}{{four}}{{three}}{{two}}{{one}}\n{{/e}}\n{{one}}{{two}}{{three}}{{four}}{{three}}{{two}}{{one}}\n{{/d}}\n{{one}}{{two}}{{three}}{{two}}{{one}}\n{{/c}}\n{{one}}{{two}}{{one}}\n{{/b}}\n{{one}}\n{{/a}}\n",
					desc: "All elements on the context stack should be accessible."
				}, {
					name: "List",
					data: {
						list: [{
								item: 1
							}, {
								item: 2
							}, {
								item: 3
							}
						]
					},
					expected: "\"123\"",
					template: "\"{{#list}}{{item}}{{/list}}\"",
					desc: "Lists should be iterated; list items should visit the context stack."
				}, {
					name: "Empty List",
					data: {
						list: []
					},
					expected: "\"\"",
					template: "\"{{#list}}Yay lists!{{/list}}\"",
					desc: "Empty lists should behave like falsey values."
				}, {
					name: "Doubled",
					data: {
						two: "second",
						bool: true
					},
					expected: "* first\n* second\n* third\n",
					template: "{{#bool}}\n* first\n{{/bool}}\n* {{two}}\n{{#bool}}\n* third\n{{/bool}}\n",
					desc: "Multiple sections per template should be permitted."
				}, {
					name: "Nested (Truthy)",
					data: {
						bool: true
					},
					expected: "| A B C D E |",
					template: "| A {{#bool}}B {{#bool}}C{{/bool}} D{{/bool}} E |",
					desc: "Nested truthy sections should have their contents rendered."
				}, {
					name: "Nested (Falsey)",
					data: {
						bool: false
					},
					expected: "| A  E |",
					template: "| A {{#bool}}B {{#bool}}C{{/bool}} D{{/bool}} E |",
					desc: "Nested falsey sections should be omitted."
				}, {
					name: "Context Misses",
					data: {},
					expected: "[]",
					template: "[{{#missing}}Found key 'missing'!{{/missing}}]",
					desc: "Failed context lookups should be considered falsey."
				}, {
					name: "Implicit Iterator - String",
					data: {
						list: ["a", "b", "c", "d", "e"]
					},
					expected: "\"(a)(b)(c)(d)(e)\"",
					template: "\"{{#list}}({{.}}){{/list}}\"",
					desc: "Implicit iterators should directly interpolate strings."
				}, {
					name: "Implicit Iterator - Integer",
					data: {
						list: [1, 2, 3, 4, 5]
					},
					expected: "\"(1)(2)(3)(4)(5)\"",
					template: "\"{{#list}}({{.}}){{/list}}\"",
					desc: "Implicit iterators should cast integers to strings and interpolate."
				}, {
					name: "Implicit Iterator - Decimal",
					data: {
						list: [1.1, 2.2, 3.3, 4.4, 5.5]
					},
					expected: "\"(1.1)(2.2)(3.3)(4.4)(5.5)\"",
					template: "\"{{#list}}({{.}}){{/list}}\"",
					desc: "Implicit iterators should cast decimals to strings and interpolate."
				}, {
					name: "Dotted Names - Truthy",
					data: {
						a: {
							b: {
								c: true
							}
						}
					},
					expected: "\"Here\" == \"Here\"",
					template: "\"{{#a.b.c}}Here{{/a.b.c}}\" == \"Here\"",
					desc: "Dotted names should be valid for Section tags."
				}, {
					name: "Dotted Names - Falsey",
					data: {
						a: {
							b: {
								c: false
							}
						}
					},
					expected: "\"\" == \"\"",
					template: "\"{{#a.b.c}}Here{{/a.b.c}}\" == \"\"",
					desc: "Dotted names should be valid for Section tags."
				}, {
					name: "Dotted Names - Broken Chains",
					data: {
						a: {}

					},
					expected: "\"\" == \"\"",
					template: "\"{{#a.b.c}}Here{{/a.b.c}}\" == \"\"",
					desc: "Dotted names that cannot be resolved should be considered falsey."
				}, {
					name: "Surrounding Whitespace",
					data: {
						"boolean": true
					},
					expected: " | \t|\t | \n",
					template: " | {{#boolean}}\t|\t{{/boolean}} | \n",
					desc: "Sections should not alter surrounding whitespace."
				}, {
					name: "Internal Whitespace",
					data: {
						"boolean": true
					},
					expected: " |  \n  | \n",
					template: " | {{#boolean}} {{! Important Whitespace }}\n {{/boolean}} | \n",
					desc: "Sections should not alter internal whitespace."
				}, {
					name: "Indented Inline Sections",
					data: {
						"boolean": true
					},
					expected: " YES\n GOOD\n",
					template: " {{#boolean}}YES{{/boolean}}\n {{#boolean}}GOOD{{/boolean}}\n",
					desc: "Single-line sections should not alter surrounding whitespace."
				}, {
					name: "Standalone Lines",
					data: {
						"boolean": true
					},
					expected: "| This Is\n|\n| A Line\n",
					template: "| This Is\n{{#boolean}}\n|\n{{/boolean}}\n| A Line\n",
					desc: "Standalone lines should be removed from the template."
				}, {
					name: "Indented Standalone Lines",
					data: {
						"boolean": true
					},
					expected: "| This Is\n|\n| A Line\n",
					template: "| This Is\n  {{#boolean}}\n|\n  {{/boolean}}\n| A Line\n",
					desc: "Indented standalone lines should be removed from the template."
				}, {
					name: "Standalone Line Endings",
					data: {
						"boolean": true
					},
					expected: "|\r\n|",
					template: "|\r\n{{#boolean}}\r\n{{/boolean}}\r\n|",
					desc: "\"\\r\\n\" should be considered a newline for standalone tags."
				}, {
					name: "Standalone Without Previous Line",
					data: {
						"boolean": true
					},
					expected: "#\n/",
					template: "  {{#boolean}}\n#{{/boolean}}\n/",
					desc: "Standalone tags should not require a newline to precede them."
				}, {
					name: "Standalone Without Newline",
					data: {
						"boolean": true
					},
					expected: "#\n/\n",
					template: "#{{#boolean}}\n/\n  {{/boolean}}",
					desc: "Standalone tags should not require a newline to follow them."
				}, {
					name: "Padding",
					data: {
						"boolean": true
					},
					expected: "|=|",
					template: "|{{# boolean }}={{/ boolean }}|",
					desc: "Superfluous in-tag whitespace should be ignored."
				}
			]
		},
		//*/
		{
			desc: "String templates - inverted sections",
			tests: [
				{
					name: "Falsey",
					data: {
						"boolean": false
					},
					expected: "\"This should be rendered.\"",
					template: "\"{{^boolean}}This should be rendered.{{/boolean}}\"",
					desc: "Falsey sections should have their contents rendered."
				}, {
					name: "Truthy",
					data: {
						"boolean": true
					},
					expected: "\"\"",
					template: "\"{{^boolean}}This should not be rendered.{{/boolean}}\"",
					desc: "Truthy sections should have their contents omitted."
				}, {
					name: "Context",
					data: {
						context: {
							name: "Joe"
						}
					},
					expected: "\"\"",
					template: "\"{{^context}}Hi {{name}}.{{/context}}\"",
					desc: "Objects and hashes should behave like truthy values."
				}, {
					name: "List",
					data: {
						list: [{
								n: 1
							}, {
								n: 2
							}, {
								n: 3
							}
						]
					},
					expected: "\"\"",
					template: "\"{{^list}}{{n}}{{/list}}\"",
					desc: "Lists should behave like truthy values."
				}, {
					name: "Empty List",
					data: {
						list: []
					},
					expected: "\"Yay lists!\"",
					template: "\"{{^list}}Yay lists!{{/list}}\"",
					desc: "Empty lists should behave like falsey values."
				}, {
					name: "Doubled",
					data: {
						two: "second",
						bool: false
					},
					expected: "* first\n* second\n* third\n",
					template: "{{^bool}}\n* first\n{{/bool}}\n* {{two}}\n{{^bool}}\n* third\n{{/bool}}\n",
					desc: "Multiple inverted sections per template should be permitted."
				}, {
					name: "Nested (Falsey)",
					data: {
						bool: false
					},
					expected: "| A B C D E |",
					template: "| A {{^bool}}B {{^bool}}C{{/bool}} D{{/bool}} E |",
					desc: "Nested falsey sections should have their contents rendered."
				}, {
					name: "Nested (Truthy)",
					data: {
						bool: true
					},
					expected: "| A  E |",
					template: "| A {{^bool}}B {{^bool}}C{{/bool}} D{{/bool}} E |",
					desc: "Nested truthy sections should be omitted."
				}, {
					name: "Context Misses",
					data: {},
					expected: "[Cannot find key 'missing'!]",
					template: "[{{^missing}}Cannot find key 'missing'!{{/missing}}]",
					desc: "Failed context lookups should be considered falsey."
				}, {
					name: "Dotted Names - Truthy",
					data: {
						a: {
							b: {
								c: true
							}
						}
					},
					expected: "\"\" == \"\"",
					template: "\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"\"",
					desc: "Dotted names should be valid for Inverted Section tags."
				}, {
					name: "Dotted Names - Falsey",
					data: {
						a: {
							b: {
								c: false
							}
						}
					},
					expected: "\"Not Here\" == \"Not Here\"",
					template: "\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"Not Here\"",
					desc: "Dotted names should be valid for Inverted Section tags."
				}, {
					name: "Dotted Names - Broken Chains",
					data: {
						a: {}
					},
					expected: "\"Not Here\" == \"Not Here\"",
					template: "\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"Not Here\"",
					desc: "Dotted names that cannot be resolved should be considered falsey."
				}, {
					name: "Surrounding Whitespace",
					data: {
						"boolean": false
					},
					expected: " | \t|\t | \n",
					template: " | {{^boolean}}\t|\t{{/boolean}} | \n",
					desc: "Inverted sections should not alter surrounding whitespace."
				}, {
					name: "Internal Whitespace",
					data: {
						"boolean": false
					},
					expected: " |  \n  | \n",
					template: " | {{^boolean}} {{! Important Whitespace }}\n {{/boolean}} | \n",
					desc: "Inverted should not alter internal whitespace."
				}, {
					name: "Indented Inline Sections",
					data: {
						"boolean": false
					},
					expected: " NO\n WAY\n",
					template: " {{^boolean}}NO{{/boolean}}\n {{^boolean}}WAY{{/boolean}}\n",
					desc: "Single-line sections should not alter surrounding whitespace."
				}, {
					name: "Standalone Lines",
					data: {
						"boolean": false
					},
					expected: "| This Is\n|\n| A Line\n",
					template: "| This Is\n{{^boolean}}\n|\n{{/boolean}}\n| A Line\n",
					desc: "Standalone lines should be removed from the template."
				}, {
					name: "Standalone Indented Lines",
					data: {
						"boolean": false
					},
					expected: "| This Is\n|\n| A Line\n",
					template: "| This Is\n  {{^boolean}}\n|\n  {{/boolean}}\n| A Line\n",
					desc: "Standalone indented lines should be removed from the template."
				}, {
					name: "Standalone Line Endings",
					data: {
						"boolean": false
					},
					expected: "|\r\n|",
					template: "|\r\n{{^boolean}}\r\n{{/boolean}}\r\n|",
					desc: "\"\\r\\n\" should be considered a newline for standalone tags."
				}, {
					name: "Standalone Without Previous Line",
					data: {
						"boolean": false
					},
					expected: "^\n/",
					template: "  {{^boolean}}\n^{{/boolean}}\n/",
					desc: "Standalone tags should not require a newline to precede them."
				}, {
					name: "Standalone Without Newline",
					data: {
						"boolean": false
					},
					expected: "^\n/\n",
					template: "^{{^boolean}}\n/\n  {{/boolean}}",
					desc: "Standalone tags should not require a newline to follow them."
				}, {
					name: "Padding",
					data: {
						"boolean": false
					},
					expected: "|=|",
					template: "|{{^ boolean }}={{/ boolean }}|",
					desc: "Superfluous in-tag whitespace should be ignored."
				}
			]
		},
		//*/
		{
			desc: "String templates - partials",
			tests: [
				{
					name: "Basic Behavior",
					data: {},
					expected: "\"from partial\"",
					template: "\"{{>text}}\"",
					desc: "The greater-than operator should expand to the named partial.",
					partials: {
						text: "from partial"
					}
				}, {
					name: "Failed Lookup",
					data: {},
					expected: "\"\"",
					template: "\"{{>text}}\"",
					desc: "The empty string should be used when the named partial is not found.",
					partials: {}

				}, {
					name: "Context",
					data: {
						text: "content"
					},
					expected: "\"*content*\"",
					template: "\"{{>partial}}\"",
					desc: "The greater-than operator should operate within the current context.",
					partials: {
						partial: "*{{text}}*"
					}
				}, {
					name: "Recursion",
					data: {
						content: "X",
						nodes: [{
								content: "Y",
								nodes: []
							}
						]
					},
					expected: "X<Y<>>",
					template: "{{>node}}",
					desc: "The greater-than operator should properly recurse.",
					partials: {
						node: "{{content}}<{{#nodes}}{{>node}}{{/nodes}}>"
					}
				}, {
					name: "Surrounding Whitespace",
					data: {},
					expected: "| \t|\t |",
					template: "| {{>partial}} |",
					desc: "The greater-than operator should not alter surrounding whitespace.",
					partials: {
						partial: "\t|\t"
					}
				}, {
					name: "Inline Indentation",
					data: {
						data: "|"
					},
					expected: "  |  >\n>\n",
					template: "  {{data}}  {{> partial}}\n",
					desc: "Whitespace should be left untouched.",
					partials: {
						partial: ">\n>"
					}
				}, {
					name: "Standalone Line Endings",
					data: {},
					expected: "|\r\n>|",
					template: "|\r\n{{>partial}}\r\n|",
					desc: "\"\\r\\n\" should be considered a newline for standalone tags.",
					partials: {
						partial: ">"
					}
				}, {
					name: "Standalone Without Previous Line",
					data: {},
					expected: "  >\n  >>",
					template: "  {{>partial}}\n>",
					desc: "Standalone tags should not require a newline to precede them.",
					partials: {
						partial: ">\n>"
					}
				}, {
					name: "Standalone Without Newline",
					data: {},
					expected: ">\n  >\n  >",
					template: ">\n  {{>partial}}",
					desc: "Standalone tags should not require a newline to follow them.",
					partials: {
						partial: ">\n>"
					}
				}, {
					name: "Standalone Indentation",
					data: {
						content: "<\n->"
					},
					expected: "\\\n |\n <\n->\n |\n/\n",
					template: "\\\n {{>partial}}\n/\n",
					desc: "Each line of the partial should be indented before rendering.",
					partials: {
						partial: "|\n{{{content}}}\n|\n"
					}
				}, {
					name: "Padding Whitespace",
					data: {
						"boolean": true
					},
					expected: "|[]|",
					template: "|{{> partial }}|",
					desc: "Superfluous in-tag whitespace should be ignored.",
					partials: {
						partial: "[]"
					}
				}
			]
		},
		//*/
		{
			desc: "String templates - changing delimiters",
			tests: [
				{
					name: "Pair Behavior",
					data: {
						text: "Hey!"
					},
					expected: "(Hey!)",
					template: "{{=<% %>=}}(<%text%>)",
					desc: "The equals sign (used on both sides) should permit delimiter changes."
				}, {
					name: "Special Characters",
					data: {
						text: "It worked!"
					},
					expected: "(It worked!)",
					template: "({{=[ ]=}}[text])",
					desc: "Characters with special meaning regexen should be valid delimiters."
				}, {
					name: "Sections",
					data: {
						section: true,
						data: "I got interpolated."
					},
					expected: "[\n  I got interpolated.\n  |data|\n\n  {{data}}\n  I got interpolated.\n]\n",
					template: "[\n{{#section}}\n  {{data}}\n  |data|\n{{/section}}\n\n{{= | | =}}\n|#section|\n  {{data}}\n  |data|\n|/section|\n]\n",
					desc: "Delimiters set outside sections should persist."
				}, {
					name: "Inverted Sections",
					data: {
						section: false,
						data: "I got interpolated."
					},
					expected: "[\n  I got interpolated.\n  |data|\n\n  {{data}}\n  I got interpolated.\n]\n",
					template: "[\n{{^section}}\n  {{data}}\n  |data|\n{{/section}}\n\n{{= | | =}}\n|^section|\n  {{data}}\n  |data|\n|/section|\n]\n",
					desc: "Delimiters set outside inverted sections should persist."
				}, {
					name: "Partial Inheritence",
					data: {
						value: "yes"
					},
					expected: "[ .yes. ]\n[ .yes. ]\n",
					template: "[ {{>include}} ]\n{{= | | =}}\n[ |>include| ]\n",
					desc: "Delimiters set in a parent template should not affect a partial.",
					partials: {
						include: ".{{value}}."
					}
				}, {
					name: "Post-Partial Behavior",
					data: {
						value: "yes"
					},
					expected: "[ .yes.  .yes. ]\n[ .yes.  .|value|. ]\n",
					template: "[ {{>include}} ]\n[ .{{value}}.  .|value|. ]\n",
					desc: "Delimiters set in a partial should not affect the parent template.",
					partials: {
						include: ".{{value}}. {{= | | =}} .|value|."
					}
				}, {
					name: "Surrounding Whitespace",
					data: {},
					expected: "|  |",
					template: "| {{=@ @=}} |",
					desc: "Surrounding whitespace should be left untouched."
				}, {
					name: "Outlying Whitespace (Inline)",
					data: {},
					expected: " | \n",
					template: " | {{=@ @=}}\n",
					desc: "Whitespace should be left untouched."
				}, {
					name: "Standalone Tag",
					data: {},
					expected: "Begin.\nEnd.\n",
					template: "Begin.\n{{=@ @=}}\nEnd.\n",
					desc: "Standalone lines should be removed from the template."
				}, {
					name: "Indented Standalone Tag",
					data: {},
					expected: "Begin.\nEnd.\n",
					template: "Begin.\n  {{=@ @=}}\nEnd.\n",
					desc: "Indented standalone lines should be removed from the template."
				}, {
					name: "Standalone Line Endings",
					data: {},
					expected: "|\r\n|",
					template: "|\r\n{{= @ @ =}}\r\n|",
					desc: "\"\\r\\n\" should be considered a newline for standalone tags."
				}, {
					name: "Standalone Without Previous Line",
					data: {},
					expected: "=",
					template: "  {{=@ @=}}\n=",
					desc: "Standalone tags should not require a newline to precede them."
				}, {
					name: "Standalone Without Newline",
					data: {},
					expected: "=\n",
					template: "=\n  {{=@ @=}}",
					desc: "Standalone tags should not require a newline to follow them."
				}, {
					name: "Pair with Padding",
					data: {},
					expected: "||",
					template: "|{{= @   @ =}}|",
					desc: "Superfluous in-tag whitespace should be ignored."
				}
			]
		},
		//*/
		{
			desc: "String templates - lambda functions",
			tests: [
				{
					name: "Interpolation",
					data: {
						lambda: function() { return "world" }
					},
					expected: "Hello, world!",
					template: "Hello, {{lambda}}!",
					desc: "A lambda's return value should be interpolated."
				}, {
					name: "Interpolation - Expansion",
					data: {
						planet: "world",
						lambda: function() { return "{{planet}}" }
					},
					expected: "Hello, world!",
					template: "Hello, {{lambda}}!",
					desc: "A lambda's return value should be parsed."
				}, {
					name: "Interpolation - Alternate Delimiters",
					data: {
						planet: "world",
						lambda: function() { return "|planet| => {{planet}}" }
					},
					expected: "Hello, (|planet| => world)!",
					template: "{{= | | =}}\nHello, (|&lambda|)!",
					desc: "A lambda's return value should parse with the default delimiters."
				}, {
					name: "Interpolation - Multiple Calls",
					data: {
						lambda: function() { return (g=(function(){return this})()).calls=(g.calls||0)+1 }
					},
					expected: "1 == 2 == 3",
					template: "{{lambda}} == {{{lambda}}} == {{lambda}}",
					desc: "Interpolated lambdas should not be cached."
				}, {
					name: "Escaping",
					data: {
						lambda: function() { return ">" }
					},
					expected: "<&#62;>",
					template: "<{{lambda}}{{{lambda}}}",
					desc: "Lambda results should be appropriately escaped."
				}, {
					name: "Section",
					data: {
						x: "Error!",
						lambda: function(txt) { return (txt == "{{x}}" ? "yes" : "no") }
					},
					expected: "<yes>",
					template: "<{{#lambda}}{{x}}{{/lambda}}>",
					desc: "Lambdas used for sections should receive the raw section string."
				}, {
					name: "Section - Expansion",
					data: {
						planet: "Earth",
						lambda: function(txt) { return txt + "{{planet}}" + txt }
					},
					expected: "<-Earth->",
					template: "<{{#lambda}}-{{/lambda}}>",
					desc: "Lambdas used for sections should have their results parsed."
				}, {
					name: "Section - Alternate Delimiters",
					data: {
						planet: "Earth",
						lambda: function(txt) { return txt + "{{planet}} => |planet|" + txt }
					},
					expected: "<-{{planet}} => Earth->",
					template: "{{= | | =}}<|#lambda|-|/lambda|>",
					desc: "Lambdas used for sections should parse with the current delimiters."
				}, {
					name: "Section - Multiple Calls",
					data: {
						lambda: function(txt) { return "__" + txt + "__" }
					},
					expected: "__FILE__ != __LINE__",
					template: "{{#lambda}}FILE{{/lambda}} != {{#lambda}}LINE{{/lambda}}",
					desc: "Lambdas used for sections should not be cached."
				}, {
					name: "Inverted Section",
					data: {
						"static": "static",
						lambda: function(txt) { return false }
					},
					expected: "<>",
					template: "<{{^lambda}}{{static}}{{/lambda}}>",
					desc: "Lambdas used for inverted sections should be considered truthy."
				}
			]
		},
		//*/
		{
			desc: "Fragment templates - interpolation",
			fragment: true,
			tests: [
				{
					name: "No Interpolation",
					desc: "Templates without Templz directives should render as-is",
					data: {},
					expected: "Hello, <em>world</em>!",
					template: makeDiv("Hello, <em>world</em>!"),
					check: fragToString
				}, {
					name: "Basic Interpolation",
					desc: "The 'name' directive should interpolate content into the template as a text node.",
					data: {
						subject: "world"
					},
					expected: "Hello, <em>world</em>!",
					template: makeDiv("Hello, <em tpz-name='subject'></em>!"),
					check: fragToString
				}, {
					name: "HTML escaping",
					desc: "Basic interpolation should be HTML escaped.",
					data: {
						forbidden: "& \" < >"
					},
					expected: "These characters should be HTML escaped: <span>&amp; \" &lt; &gt;</span>",
					template: makeDiv("These characters should be HTML escaped: <span tpz-name='forbidden'></span>"),
					check: fragToString
				}, {
					name: "Content Interpolation",
					desc: "The 'name' directive should interpolate content into the template as a HTML fragment.",
					data: {
						content: "a <b>new</b> &amp; <i>elegant</i> way!"
					},
					expected: "The following is a HTML structure: <span>a <b>new</b> &amp; <i>elegant</i> way!</span>",
					template: makeDiv("The following is a HTML structure: <span tpz-content='content'></span>"),
					check: fragToString
				}, {
					name: "Basic Numeric Interpolation",
					data: {
						power: 1.21
					},
					expected: "<span>1.21</span> jiggawatts!",
					template: makeDiv("<span tpz-name='power'></span> jiggawatts!"),
					desc: "Numbers should interpolate seamlessly with proper significance.",
					check: fragToString
				}, {
					name: "Content Numeric Interpolation",
					data: {
						power: 1.21
					},
					expected: "<span>1.21</span> jiggawatts!",
					template: makeDiv("<span tpz-content='power'></span> jiggawatts!"),
					desc: "Numbers should interpolate seamlessly with proper significance.",
					check: fragToString
				}, {
					name: "Basic Context Miss Interpolation",
					data: {},
					expected: "I  be seen!",
					template: makeDiv("I <span tpz-name='cannot'></span> be seen!"),
					desc: "Failed context lookups should not render the node.",
					check: fragToString
				}, {
					name: "Content Context Miss Interpolation",
					data: {},
					expected: "I  be seen!",
					template: makeDiv("I <span tpz-content='cannot'></span> be seen!"),
					desc: "Failed context lookups should not render the node.",
					check: fragToString
				}, {
					name: "Dotted Names - Basic Interpolation",
					data: {
						person: {
							name: "Joe"
						}
					},
					expected: "<span>Joe</span> == <span>Joe</span>",
					template: makeDiv("<span tpz-name='person.name'></span> == <span tpz-section='person'>{{name}}</span>"),
					desc: "Dotted names should be considered a form of shorthand for sections.",
					check: fragToString
				}, {
					name: "Dotted Names - Content Interpolation",
					data: {
						person: {
							name: "Joe"
						}
					},
					expected: "<span>Joe</span> == <span>Joe</span>",
					template: makeDiv("<span tpz-content='person.name'></span> == <span tpz-section='person'>{{name}}</span>"),
					desc: "Dotted names should be considered a form of shorthand for sections.",
					check: fragToString
				}, {
					name: "Dotted Names - Arbitrary Depth",
					data: {
						a: {
							b: {
								c: {
									d: {
										e: {
											name: "Phil"
										}
									}
								}
							}
						}
					},
					expected: "<em>Phil</em> == <em>Phil</em>",
					template: makeDiv("<em tpz-name='a.b.c.d.e.name'></em> == <em>Phil</em>"),
					desc: "Dotted names should be functional to any level of nesting.",
					check: fragToString
				}, {
					name: "Dotted Names - Broken Chains",
					data: {
						a: {}
					},
					expected: "\"\" == \"\"",
					template: makeDiv("\"<span tpz-name='a.b.c'></span>\" == \"\""),
					desc: "Any falsey value prior to the last part of the name should not render the node.",
					check: fragToString
				}, {
					name: "Dotted Names - Broken Chain Resolution",
					data: {
						a: {
							b: {}
						},
						c: {
							name: "Jim"
						}
					},
					expected: "\"\" == \"\"",
					template: makeDiv("\"<span tpz-name='a.b.c.name'></span>\" == \"\""),
					desc: "Each part of a dotted name should resolve only against its parent.",
					check: fragToString
				}, {
					name: "Dotted Names - Initial Resolution",
					data: {
						a: {
							b: {
								c: {
									d: {
										e: {
											name: "Phil"
										}
									}
								}
							}
						},
						b: {
							c: {
								d: {
									e: {
										name: "Wrong"
									}
								}
							}
						}
					},
					expected: "<span>Phil</span> == <span>Phil</span>",
					template: makeDiv("{{#a}}<span tpz-name='b.c.d.e.name'></span>{{/a}} == <span>Phil</span>"),
					desc: "The first part of a dotted name should resolve as any other name.",
					check: fragToString
				}, {
					name: "Interpolation - Surrounding Whitespace",
					data: {
						string: "---"
					},
					expected: "| <span>---</span> |",
					template: makeDiv("| <span tpz-name='string'></span> |"),
					desc: "Interpolation should not alter surrounding whitespace.",
					check: fragToString
				}, {
					name: "Content Interpolation - Surrounding Whitespace",
					data: {
						string: "---"
					},
					expected: "| <span>---</span> |",
					template: makeDiv("| <span tpz-content='string'></span> |"),
					desc: "Interpolation should not alter surrounding whitespace.",
					check: fragToString
				}, {
					name: "Interpolation With Padding",
					data: {
						string: "---"
					},
					expected: "|<span>---</span>|",
					template: makeDiv("|<span tpz-name=' string '></span>|"),
					desc: "Superfluous in-directive whitespace should be ignored.",
					check: fragToString
				}, {
					name: "Content Interpolation With Padding",
					data: {
						string: "---"
					},
					expected: "|<span>---</span>|",
					template: makeDiv("|<span tpz-content=' string '></span>|"),
					desc: "Superfluous in-directive whitespace should be ignored.",
					check: fragToString
				}
			]
		},
		//*/
		{
			desc: "Fragment templates - sections",
			fragment: true,
			tests: [
				{
					name: "Truthy",
					data: {
						"boolean": true
					},
					expected: "<span>This should be rendered.</span>",
					template: makeDiv("<span tpz-section='boolean'>This should be rendered.</span>"),
					desc: "Truthy sections should have their contents rendered.",
					check: fragToString
				}, {
					name: "Falsey",
					data: {
						"boolean": false
					},
					expected: "",
					template: makeDiv("<span tpz-section='boolean'>This should not be rendered.</span>"),
					desc: "Falsey sections should have their contents omitted.",
					check: fragToString
				}, {
					name: "Context",
					data: {
						context: {
							name: "Joe"
						}
					},
					expected: "<span>Hi <em>Joe</em>.</span>",
					template: makeDiv("<span tpz-section='context'>Hi <em tpz-name='name'></em>.</span>"),
					desc: "Objects and hashes should be pushed onto the context stack.",
					check: fragToString
				}, {
					name: "Deeply Nested Contexts",
					data: {
						a: {
							one: 1
						},
						b: {
							two: 2
						},
						c: {
							three: 3
						},
						d: {
							four: 4
						},
						e: {
							five: 5
						}
					},
					expected: "<span> <em>1</em> <span> <em>1</em><em>2</em><em>1</em> <span> <em>1</em><em>2</em><em>3</em><em>2</em><em>1</em> <span> <em>1</em><em>2</em><em>3</em><em>4</em><em>3</em><em>2</em><em>1</em> <span> <em>1</em><em>2</em><em>3</em><em>4</em><em>5</em><em>4</em><em>3</em><em>2</em><em>1</em> </span> <em>1</em><em>2</em><em>3</em><em>4</em><em>3</em><em>2</em><em>1</em> </span> <em>1</em><em>2</em><em>3</em><em>2</em><em>1</em> </span> <em>1</em><em>2</em><em>1</em> </span> <em>1</em> </span>",
					template: makeDiv("<span tpz-section='a'> <em tpz-name='one'></em> <span tpz-section='b'> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='one'></em> <span tpz-section='c'> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> <span tpz-section='d'> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='four'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> <span tpz-section='e'> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='four'></em><em tpz-name='five'></em><em tpz-name='four'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> </span> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='four'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> </span> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> </span> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='one'></em> </span> <em tpz-name='one'></em> </span>"),
					desc: "All elements on the context stack should be accessible.",
					check: fragToString
				}, {
					name: "List",
					data: {
						list: [{
								item: 1
							}, {
								item: 2
							}, {
								item: 3
							}
						]
					},
					expected: "<ol><li>1</li><li>2</li><li>3</li></ol>",
					template: makeDiv("<ol><li tpz-section='list'>{{item}}</li></ol>"),
					desc: "Lists should be iterated; list items should visit the context stack.",
					check: fragToString
				}, {
					name: "Empty List",
					data: {
						list: []
					},
					expected: "<ol></ol>",
					template: makeDiv("<ol><li tpz-section='list'>Yay lists!</li></ol>"),
					desc: "Empty lists should behave like falsey values.",
					check: fragToString
				}, {
					name: "Doubled",
					data: {
						two: "Second",
						bool: true
					},
					expected: "<h3>First</h3><h3>Second</h3><h3>Third</h3>",
					template: makeDiv("<h3 tpz-section='bool'>First</h3><h3 tpz-name='two'></h3><h3 tpz-section='bool'>Third</h3>"),
					desc: "Multiple sections per template should be permitted.",
					check: fragToString
				}, {
					name: "Nested (Truthy)",
					data: {
						bool: true
					},
					expected: "A <span>B <span>C</span> D</span> E",
					template: makeDiv("A <span tpz-section='bool'>B <span tpz-section='bool'>C</span> D</span> E"),
					desc: "Nested truthy sections should have their contents rendered.",
					check: fragToString
				}, {
					name: "Nested (Falsey)",
					data: {
						bool: false
					},
					expected: "A  E",
					template: makeDiv("A <span tpz-section='bool'>B <span tpz-section='bool'>C</span> D</span> E"),
					desc: "Nested falsey sections should be omitted.",
					check: fragToString
				}, {
					name: "Context Misses",
					data: {},
					expected: "[]",
					template: makeDiv("[<span tpz-section='missing'>Found key 'missing'!</span>]"),
					desc: "Failed context lookups should be considered falsey.",
					check: fragToString
				}, {
					name: "Implicit Iterator - String",
					data: {
						list: ["a", "b", "c"]
					},
					expected: "<ol><li><span>a</span></li><li><span>b</span></li><li><span>c</span></li></ol>",
					template: makeDiv("<ol><li tpz-section='list'><span tpz-name='.'></span></li></ol>"),
					desc: "Implicit iterators should directly interpolate strings.",
					check: fragToString
				}, {
					name: "Implicit Iterator - Numeric",
					data: {
						list: [1.1, 2.2, 3.3]
					},
					expected: "<ol><li><span>1.1</span></li><li><span>2.2</span></li><li><span>3.3</span></li></ol>",
					template: makeDiv("<ol><li tpz-section='list'><span tpz-name='.'></span></li></ol>"),
					desc: "Implicit iterators should cast numbers to strings and interpolate.",
					check: fragToString
				}, {
					name: "Dotted Names - Truthy",
					data: {
						a: {
							b: {
								c: true
							}
						}
					},
					expected: "<span>Here</span> == <span>Here</span>",
					template: makeDiv("<span tpz-section='a.b.c'>Here</span> == <span>Here</span>"),
					desc: "Dotted names should be valid for Section directives.",
					check: fragToString
				}, {
					name: "Dotted Names - Falsey",
					data: {
						a: {
							b: {
								c: false
							}
						}
					},
					expected: "\"\" == \"\"",
					template: makeDiv("\"<span tpz-section='a.b.c'>Here</span>\" == \"\""),
					desc: "Dotted names should be valid for Section directives.",
					check: fragToString
				}, {
					name: "Dotted Names - Broken Chains",
					data: {
						a: {}
					},
					expected: "\"\" == \"\"",
					template: makeDiv("\"<span tpz-section='a.b.c'>Here</span>\" == \"\""),
					desc: "Dotted names that cannot be resolved should be considered falsey.",
					check: fragToString
				}, {
					name: "Surrounding Whitespace",
					data: {
						"boolean": true
					},
					expected: " | <span>\t|\t</span> | ",
					template: makeDiv(" | <span tpz-section='boolean'>\t|\t</span> | "),
					desc: "Sections should not alter surrounding whitespace.",
					check: fragToString
				}, {
					name: "Internal Whitespace",
					data: {
						"boolean": true
					},
					expected: " | <span>  Some text\n </span> | \n",
					template: makeDiv(" | <span tpz-section='boolean'>  Some text\n </span> | \n"),
					desc: "Sections should not alter internal whitespace.",
					check: fragToString
				}, {
					name: "Padding",
					data: {
						"boolean": true
					},
					expected: "|<span>=</span>|",
					template: makeDiv("|<span tpz-section=' boolean '>=</span>|"),
					desc: "Superfluous in-directive whitespace should be ignored.",
					check: fragToString
				}
			]
		},
		//*/
		{
			desc: "Fragment templates - inverted sections",
			fragment: true,
			tests: [
				{
					name: "Falsey",
					data: {
						"boolean": false
					},
					expected: "<span>This should be rendered.</span>",
					template: makeDiv("<span tpz-empty='boolean'>This should be rendered.</span>"),
					desc: "Falsey sections should have their contents rendered.",
					check: fragToString
				}, {
					name: "Truthy",
					data: {
						"boolean": true
					},
					expected: "",
					template: makeDiv("<span tpz-empty='boolean'>This should not be rendered.</span>"),
					desc: "Truthy sections should have their contents omitted.",
					check: fragToString
				}, {
					name: "Context",
					data: {
						context: {
							name: "Joe"
						}
					},
					expected: "",
					template: makeDiv("<span tpz-empty='context'>Hi <em tpz-name='name'></em>.</span>"),
					desc: "Objects and hashes should behave like truthy values.",
					check: fragToString
				}, {
					name: "List",
					data: {
						list: [{
								n: 1
							}, {
								n: 2
							}, {
								n: 3
							}
						]
					},
					expected: "<ol></ol>",
					template: makeDiv("<ol><li tpz-empty='list'>{{n}}</li></ol>"),
					desc: "Lists should behave like truthy values.",
					check: fragToString
				}, {
					name: "Empty List",
					data: {
						list: []
					},
					expected: "<ol><li>Yay lists!</li></ol>",
					template: makeDiv("<ol><li tpz-empty='list'>Yay lists!</li></ol>"),
					desc: "Empty lists should behave like falsey values.",
					check: fragToString
				}, {
					name: "Doubled",
					data: {
						two: "Second",
						bool: false
					},
					expected: "<h3>First</h3><h3>Second</h3><h3>Third</h3>",
					template: makeDiv("<h3 tpz-empty='bool'>First</h3><h3 tpz-name='two'></h3><h3 tpz-empty='bool'>Third</h3>"),
					desc: "Multiple inverted sections per template should be permitted.",
					check: fragToString
				}, {
					name: "Nested (Falsey)",
					data: {
						bool: false
					},
					expected: "A <span>B <span>C</span> D</span> E",
					template: makeDiv("A <span tpz-empty='bool'>B <span tpz-empty='bool'>C</span> D</span> E"),
					desc: "Nested falsey sections should have their contents rendered.",
					check: fragToString
				}, {
					name: "Nested (Truthy)",
					data: {
						bool: true
					},
					expected: "A  E",
					template: makeDiv("A <span tpz-empty='bool'>B <span tpz-empty='bool'>C</span> D</span> E"),
					desc: "Nested truthy sections should be omitted.",
					check: fragToString
				}, {
					name: "Context Misses",
					data: {},
					expected: "[<span>Found key 'missing'!</span>]",
					template: makeDiv("[<span tpz-empty='missing'>Found key 'missing'!</span>]"),
					desc: "Failed context lookups should be considered falsey.",
					check: fragToString
				}, {
					name: "Dotted Names - Truthy",
					data: {
						a: {
							b: {
								c: true
							}
						}
					},
					expected: "\"\" == \"\"",
					template: makeDiv("\"<span tpz-empty='a.b.c'>Not Here</span>\" == \"\""),
					desc: "Dotted names should be valid for Inverted Section directives.",
					check: fragToString
				}, {
					name: "Dotted Names - Falsey",
					data: {
						a: {
							b: {
								c: false
							}
						}
					},
					expected: "<span>Not Here</span> == <span>Not Here</span>",
					template: makeDiv("<span tpz-empty='a.b.c'>Not Here</span> == <span>Not Here</span>"),
					desc: "Dotted names should be valid for Inverted Section directives.",
					check: fragToString
				}, {
					name: "Dotted Names - Broken Chains",
					data: {
						a: {}
					},
					expected: "<span>Not Here</span> == <span>Not Here</span>",
					template: makeDiv("<span tpz-empty='a.b.c'>Not Here</span> == <span>Not Here</span>"),
					desc: "Dotted names that cannot be resolved should be considered falsey.",
					check: fragToString
				}, {
					name: "Surrounding Whitespace",
					data: {
						"boolean": false
					},
					expected: " | <span>\t|\t</span> | ",
					template: makeDiv(" | <span tpz-empty='boolean'>\t|\t</span> | "),
					desc: "Inverted sections should not alter surrounding whitespace.",
					check: fragToString
				}, {
					name: "Internal Whitespace",
					data: {
						"boolean": false
					},
					expected: " | <span>  Some text\n </span> | \n",
					template: makeDiv(" | <span tpz-empty='boolean'>  Some text\n </span> | \n"),
					desc: "Inverted sections should not alter internal whitespace.",
					check: fragToString
				}, {
					name: "Padding",
					data: {
						"boolean": false
					},
					expected: "|<span>=</span>|",
					template: makeDiv("|<span tpz-empty=' boolean '>=</span>|"),
					desc: "Superfluous in-directive whitespace should be ignored.",
					check: fragToString
				}
			]
		},
		//*/
		{
			desc: "Fragment templates - Mustache mixin",
			fragment: true,
			tests: [
				{
					name: "Basic Interpolation",
					data: {
						message: "Not a line break",
						linebr: "<br>"
					},
					expected: "Not a line break: <b>* &lt;br&gt; *</b>",
					template: makeDiv("{{message}}: <b>* {{linebr}} *</b>"),
					desc: "Mustache interpolation tags in text nodes should be rendered as text nodes.",
					check: fragToString
				}, {
					name: "Content Interpolation",
					data: {
						bold: "<b>new</b>",
						italic: "<i>elegant</i>"
					},
					expected: "A <b>new</b> and <i>elegant</i> way!",
					template: makeDiv("A {{{bold}}} and {{&italic}} way!"),
					desc: "Mustache unescaped interpolation tags in text nodes should be rendered as HTML fragments.",
					check: fragToString
				}, {
					name: "Sections and Inverted Sections",
					data: {
						list: [ "foo", "bar", "baz" ],
						success: false
					},
					expected: "This is my list: <div>foo bar baz </div><br>This is a warning!",
					template: makeDiv("This is my list: <div>{{#list}}{{.}} {{/list}}</div><br>{{^success}}This is a warning!{{/success}}"),
					desc: "Mustache sections in text nodes should be rendered as HTML fragments.",
					check: fragToString
				}, {
					name: "Sections embracing elements",
					data: {
						users: [
							{ username: "johnny123", status: "online" },
							{ username: "madsklz", status: "offline" }
						]
					},
					expected: "Users: <div><span>johnny123</span> online</div><div><span>madsklz</span> offline</div>",
					template: makeDiv("Users: {{#users}}<div><span tpz-name='username'></span> {{status}}</div>{{/users}}"),
					desc: "Mustache sections can include DOM elements, provided that the opening and the closing tags belong to text nodes with the same parent node.",
					check: fragToString
				}, {
					name: "Node attributes",
					data: {
						classes: [ "foo", "bar" ],
						entry: "baz"
					},
					expected: "<div class=\"box foo bar\" data-entry=\"test-baz\">A complex thing.</div>",
					template: makeDiv("<div class=\"box{{#classes}} {{.}}{{/classes}}\" data-entry=\"test-{{entry}}\">A complex thing.</div>"),
					desc: "Node attributes are rendered as Mustache templates.",
					check: fragToString
				}
			]
		}
		//*/
	];

	var total = 0, totalSuccess = 0,
		i = 0, j,
		num, success;

	var buildHead = isBrowser ? function(block) {
			var head = document.createElement("h3");
			head.appendChild(document.createTextNode(block.desc + " - " + block.tests.length + " tests"));
			document.body.appendChild(head);
		} : function(block) {
			console.log("\x1b[37;1m" + block.desc + " - " + block.tests.length + " tests\x1b[39m");
		},
		buildTest = isBrowser ? function(test) {
			var box = document.createElement("div"), head, div;
			box.className = "result";
			head = document.createElement("h4");
			head.appendChild(document.createTextNode(test.name));
			box.appendChild(head);

			div = document.createElement("div");
			div.className = "description";
			div.appendChild(document.createTextNode(test.desc));
			box.appendChild(div);

			div = document.createElement("div");
			div.className = "outcome";
			div.appendChild(document.createTextNode("Testing..."));
			box.appendChild(div);
			document.body.appendChild(box);

			var outcome = doTest(test);
			if (outcome) {
				box.className += " fail";
				div.replaceChild(document.createTextNode("FAIL - " + outcome), div.firstChild);
			} else {
				box.className += " success";
				div.replaceChild(document.createTextNode("Success!"), div.firstChild);
			}
			return !outcome;
		} : function(test) {
			var outcome = doTest(test), color = outcome ? 31 : 32;
			console.log("\x1b[37;0m________________________________________\n\x1b[37;1m" + test.name + "\n\x1b[37;0m"
					+ test.desc + "\n\x1b[" + color + ";1m" + (outcome ? "FAIL - " + outcome : "Success!") + "\n");
			return !outcome;
		},
		doTest = function(test) {
			try {
				var templ = Templz.compile(test.template);
				// templ = Hogan.compile(test.template);
				// templ = Mustache.parse(test.template);
				try {
					var outcome = templ.render(test.data, test.partials);
					// var outcome = Mustache.render(test.template, test.data, test.partials);

					if (typeof test.check === "function")
						outcome = test.check.call(test, outcome);

					return outcome === test.expected ? null
							: "Rendering outcome. Expected: \"" + test.expected + "\", result: \"" + outcome + "\"";
				} catch (e) {
					return "Rendering exception: " + e.message;
				}
			} catch (e) {
				return "Compiling exception: " + e.message;
			}
		},
		writeResult = isBrowser ? function(success, fail) {
			document.body.appendChild(document.createTextNode(success + " tests successfully completed, "
					+ fail + " failed (" + (success * 100 / (success + fail)).toFixed(2) + "%)"));
		} : function(success, fail) {
			console.log("\x1b[37;0m" + success + " tests successfully completed, "
					+ fail + " failed (" + (success * 100 / (success + fail)).toFixed(2) + "%)\n");
		},
		writeTotalResult = isBrowser ? function(total, success) {
			document.body.appendChild(document.createElement("br"));
			var line = document.createElement("strong");
			line.appendChild(document.createTextNode(total + " tests total, " + totalSuccess
					+ " successfully completed, " + (total - success) + " failed ("
					+ (success * 100 / total).toFixed(2) + "%)."));
			document.body.appendChild(line);
		} : function(total, success) {
			console.log("\x1b[37;1m" + total + " tests total, " + totalSuccess
					+ " successfully completed, " + (total - success) + " failed ("
					+ (success * 100 / total).toFixed(2) + "%).\x1b[39m");
		};

	var Templz = isBrowser ? window.Templz : require("../js/templz.js");

	for (var i = 0; i < tests.length; i++) {
		buildHead(tests[i]);
		if (tests[i].fragment && !isBrowser) {
			console.log("Not applicable\n");
			continue;
		}

		num = tests[i].tests.length;
		success = 0;

		for (j = 0; j < num; j++)
			if (buildTest(tests[i].tests[j])) success++;

		writeResult(success, num - success);
		total += num;
		totalSuccess += success;
	}

	writeTotalResult(total, totalSuccess);

});