/*!
 * Templz test units
 * 
 * Open index.html in a browser to test Templz in a user agent environment
 * 
 * To test Templz in node.js, just type
 * 
 *     mocha
 */
(function(root, tests) {
    if (typeof define === "function" && define.amd)
        define(["expect", "templz"], tests);
    else if (typeof exports === "object")
        tests(require("../util/expect.js"), require("../templz.js"));
    else tests(root.expect, root.Templz);
})(this, function(expect, Templz) {
// Strict mode interferes with some tests
// "use strict";

describe("String templates - interpolation", function() {
    it("No Interpolation - Tag-free templates should render as-is.", function() {
        var data = {},
            template = Templz.compile("Hello from {Templz}!\n");
        expect(template.render(data)).to.be("Hello from {Templz}!\n");
    });

    it("Basic Interpolation - Unadorned tags should interpolate content into the template.", function() {
        var data = {
                subject: "world"
            },
            template = Templz.compile("Hello, {{subject}}!\n");
        expect(template.render(data)).to.be("Hello, world!\n");
    });

    it("HTML Escaping - Basic interpolation should be HTML escaped.", function() {
        var data = {
                forbidden: "& \" < >"
            },
            template = Templz.compile("These characters should be HTML escaped: {{forbidden}}\n");
        expect(template.render(data)).to.be("These characters should be HTML escaped: &#38; &#34; &#60; &#62;\n");
    });

    it("Triple curly braces - Triple curly braces should interpolate without HTML escaping.", function() {
        var data = {
                forbidden: "& \" < >"
            },
            template = Templz.compile("These characters should not be HTML escaped: {{{forbidden}}}\n");
        expect(template.render(data)).to.be("These characters should not be HTML escaped: & \" < >\n");
    });

    it("Ampersand - Ampersand should interpolate without HTML escaping.", function() {
        var data = {
                forbidden: "& \" < >"
            },
            template = Templz.compile("These characters should not be HTML escaped: {{&forbidden}}\n");
        expect(template.render(data)).to.be("These characters should not be HTML escaped: & \" < >\n");
    });

    it("Basic Integer Interpolation - Integers should interpolate seamlessly.", function() {
        var data = {
                mph: 85
            },
            template = Templz.compile("\"{{mph}} miles an hour!\"");
        expect(template.render(data)).to.be("\"85 miles an hour!\"");
    });

    it("Triple curly braces Integer Interpolation - Integers should interpolate seamlessly.", function() {
        var data = {
                mph: 85
            },
            template = Templz.compile("\"{{{mph}}} miles an hour!\"");
        expect(template.render(data)).to.be("\"85 miles an hour!\"");
    });

    it("Ampersand Integer Interpolation - Integers should interpolate seamlessly.", function() {
        var data = {
                mph: 85
            },
            template = Templz.compile("\"{{&mph}} miles an hour!\"");
        expect(template.render(data)).to.be("\"85 miles an hour!\"");
    });

    it("Basic Decimal Interpolation - Decimals should interpolate seamlessly with proper significance.", function() {
        var data = {
                power: 1.21
            },
            template = Templz.compile("\"{{power}} jiggawatts!\"");
        expect(template.render(data)).to.be("\"1.21 jiggawatts!\"");
    });

    it("Triple curly braces Decimal Interpolation - Decimals should interpolate seamlessly with proper significance.", function() {
        var data = {
                power: 1.21
            },
            template = Templz.compile("\"{{{power}}} jiggawatts!\"");
        expect(template.render(data)).to.be("\"1.21 jiggawatts!\"");
    });

    it("Ampersand Decimal Interpolation - Decimals should interpolate seamlessly with proper significance.", function() {
        var data = {
                power: 1.21
            },
            template = Templz.compile("\"{{&power}} jiggawatts!\"");
        expect(template.render(data)).to.be("\"1.21 jiggawatts!\"");
    });

    it("Basic Context Miss Interpolation - Failed context lookups should default to empty strings.", function() {
        var data = {},
            template = Templz.compile("I ({{cannot}}) be seen!");
        expect(template.render(data)).to.be("I () be seen!");
    });

    it("Triple curly braces Context Miss Interpolation - Failed context lookups should default to empty strings.", function() {
        var data = {},
            template = Templz.compile("I ({{{cannot}}}) be seen!");
        expect(template.render(data)).to.be("I () be seen!");
    });

    it("Ampersand Context Miss Interpolation - Failed context lookups should default to empty strings.", function() {
        var data = {},
            template = Templz.compile("I ({{&cannot}}) be seen!");
        expect(template.render(data)).to.be("I () be seen!");
    });

    it("Dotted Names - Basic Interpolation - Dotted names should be considered a form of shorthand for sections.", function() {
        var data = {
                person: {
                    name: "Joe"
                }
            },
            template = Templz.compile("\"{{person.name}}\" == \"{{#person}}{{name}}{{/person}}\"");
        expect(template.render(data)).to.be("\"Joe\" == \"Joe\"");
    });

    it("Dotted Names - Triple curly braces Interpolation - Dotted names should be considered a form of shorthand for sections.", function() {
        var data = {
                person: {
                    name: "Joe"
                }
            },
            template = Templz.compile("\"{{{person.name}}}\" == \"{{#person}}{{{name}}}{{/person}}\"");
        expect(template.render(data)).to.be("\"Joe\" == \"Joe\"");
    });

    it("Dotted Names - Ampersand Interpolation - Dotted names should be considered a form of shorthand for sections.", function() {
        var data = {
                person: {
                    name: "Joe"
                }
            },
            template = Templz.compile("\"{{&person.name}}\" == \"{{#person}}{{&name}}{{/person}}\"");
        expect(template.render(data)).to.be("\"Joe\" == \"Joe\"");
    });

    it("Dotted Names - Arbitrary Depth - Dotted names should be functional to any level of nesting.", function() {
        var data = {
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
            template = Templz.compile("\"{{a.b.c.d.e.name}}\" == \"Phil\"");
        expect(template.render(data)).to.be("\"Phil\" == \"Phil\"");
    });

    it("Dotted Names - Broken Chains - Any falsey value prior to the last part of the name should yield ''.", function() {
        var data = {
                a: {}

            },
            template = Templz.compile("\"{{a.b.c}}\" == \"\"");
        expect(template.render(data)).to.be("\"\" == \"\"");
    });

    it("Dotted Names - Broken Chain Resolution - Each part of a dotted name should resolve only against its parent.", function() {
        var data = {
                a: {
                    b: {}
                },
                c: {
                    name: "Jim"
                }
            },
            template = Templz.compile("\"{{a.b.c.name}}\" == \"\"");
        expect(template.render(data)).to.be("\"\" == \"\"");
    });

    it("Dotted Names - Initial Resolution - The first part of a dotted name should resolve as any other name.", function() {
        var data = {
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
            template = Templz.compile("\"{{#a}}{{b.c.d.e.name}}{{/a}}\" == \"Phil\"");
        expect(template.render(data)).to.be("\"Phil\" == \"Phil\"");
    });

    it("Interpolation - Surrounding Whitespace - Interpolation should not alter surrounding whitespace.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("| {{string}} |");
        expect(template.render(data)).to.be("| --- |");
    });

    it("Triple curly braces - Surrounding Whitespace - Interpolation should not alter surrounding whitespace.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("| {{{string}}} |");
        expect(template.render(data)).to.be("| --- |");
    });

    it("Ampersand - Surrounding Whitespace - Interpolation should not alter surrounding whitespace.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("| {{&string}} |");
        expect(template.render(data)).to.be("| --- |");
    });

    it("Interpolation - Standalone - Standalone interpolation should not alter surrounding whitespace.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("  {{string}}\n");
        expect(template.render(data)).to.be("  ---\n");
    });

    it("Triple curly braces - Standalone - Standalone interpolation should not alter surrounding whitespace.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("  {{{string}}}\n");
        expect(template.render(data)).to.be("  ---\n");
    });

    it("Ampersand - Standalone - Standalone interpolation should not alter surrounding whitespace.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("  {{&string}}\n");
        expect(template.render(data)).to.be("  ---\n");
    });

    it("Interpolation With Padding - Superfluous in-tag whitespace should be ignored.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("|{{ string }}|");
        expect(template.render(data)).to.be("|---|");
    });

    it("Triple curly braces With Padding - Superfluous in-tag whitespace should be ignored.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("|{{{ string }}}|");
        expect(template.render(data)).to.be("|---|");
    });

    it("Ampersand With Padding - Superfluous in-tag whitespace should be ignored.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile("|{{& string }}|");
        expect(template.render(data)).to.be("|---|");
    });
});

describe("String templates - comments", function() {
    it("Inline - Comment blocks should be removed from the template.", function() {
        var data = {},
            template = Templz.compile("12345{{! Comment Block! }}67890");
        expect(template.render(data)).to.be("1234567890");
    });

    it("Multiline - Multiline comments should be permitted.", function() {
        var data = {},
            template = Templz.compile("12345{{!\n  This is a\n  multi-line comment...\n}}67890\n");
        expect(template.render(data)).to.be("1234567890\n");
    });

    it("Standalone - All standalone comment lines should be removed.", function() {
        var data = {},
            template = Templz.compile("Begin.\n{{! Comment Block! }}\nEnd.\n");
        expect(template.render(data)).to.be("Begin.\nEnd.\n");
    });

    it("Indented Standalone - All standalone comment lines should be removed.", function() {
        var data = {},
            template = Templz.compile("Begin.\n  {{! Indented Comment Block! }}\nEnd.\n");
        expect(template.render(data)).to.be("Begin.\nEnd.\n");
    });

    it("Standalone Line Endings - \"\\r\\n\" should be considered a newline for standalone tags.", function() {
        var data = {},
            template = Templz.compile("|\r\n{{! Standalone Comment }}\r\n|");
        expect(template.render(data)).to.be("|\r\n|");
    });

    it("Standalone Without Previous Line - Standalone tags should not require a newline to precede them.", function() {
        var data = {},
            template = Templz.compile("  {{! I'm Still Standalone }}\n!");
        expect(template.render(data)).to.be("!");
    });

    it("Standalone Without Newline - Standalone tags should not require a newline to follow them.", function() {
        var data = {},
            template = Templz.compile("!\n  {{! I'm Still Standalone }}");
        expect(template.render(data)).to.be("!\n");
    });

    it("Multiline Standalone - All standalone comment lines should be removed.", function() {
        var data = {},
            template = Templz.compile("Begin.\n{{!\nSomething's going on here...\n}}\nEnd.\n");
        expect(template.render(data)).to.be("Begin.\nEnd.\n");
    });

    it("Indented Multiline Standalone - All standalone comment lines should be removed.", function() {
        var data = {},
            template = Templz.compile("Begin.\n  {{!\n    Something's going on here...\n  }}\nEnd.\n");
        expect(template.render(data)).to.be("Begin.\nEnd.\n");
    });

    it("Indented Inline - Inline comments should not strip whitespace", function() {
        var data = {},
            template = Templz.compile("  12 {{! 34 }}\n");
        expect(template.render(data)).to.be("  12 \n");
    });

    it("Surrounding Whitespace - Comment removal should preserve surrounding whitespace.", function() {
        var data = {},
            template = Templz.compile("12345 {{! Comment Block! }} 67890");
        expect(template.render(data)).to.be("12345  67890");
    });
});

describe("String templates - sections", function() {
    it("Truthy - Truthy sections should have their contents rendered.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("\"{{#boolean}}This should be rendered.{{/boolean}}\"");
        expect(template.render(data)).to.be("\"This should be rendered.\"");
    });

    it("Falsey - Falsey sections should have their contents omitted.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile("\"{{#boolean}}This should not be rendered.{{/boolean}}\"");
        expect(template.render(data)).to.be("\"\"");
    });

    it("Context - Objects and hashes should be pushed onto the context stack.", function() {
        var data = {
                context: {
                    name: "Joe"
                }
            },
            template = Templz.compile("\"{{#context}}Hi {{name}}.{{/context}}\"");
        expect(template.render(data)).to.be("\"Hi Joe.\"");
    });

    it("Deeply Nested Contexts - All elements on the context stack should be accessible.", function() {
        var data = {
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
            template = Templz.compile("{{#a}}\n{{one}}\n{{#b}}\n{{one}}{{two}}{{one}}\n{{#c}}\n{{one}}{{two}}{{three}}{{two}}{{one}}\n{{#d}}\n{{one}}{{two}}{{three}}{{four}}{{three}}{{two}}{{one}}\n{{#e}}\n{{one}}{{two}}{{three}}{{four}}{{five}}{{four}}{{three}}{{two}}{{one}}\n{{/e}}\n{{one}}{{two}}{{three}}{{four}}{{three}}{{two}}{{one}}\n{{/d}}\n{{one}}{{two}}{{three}}{{two}}{{one}}\n{{/c}}\n{{one}}{{two}}{{one}}\n{{/b}}\n{{one}}\n{{/a}}\n");
        expect(template.render(data)).to.be("1\n121\n12321\n1234321\n123454321\n1234321\n12321\n121\n1\n");
    });

    it("List - Lists should be iterated; list items should visit the context stack.", function() {
        var data = {
                list: [{
                        item: 1
                    },
                    {
                        item: 2
                    },
                    {
                        item: 3
                    }
                ]
            },
            template = Templz.compile("\"{{#list}}{{item}}{{/list}}\"");
        expect(template.render(data)).to.be("\"123\"");
    });

    it("Empty List - Empty lists should behave like falsey values.", function() {
        var data = {
                list: []
            },
            template = Templz.compile("\"{{#list}}Yay lists!{{/list}}\"");
        expect(template.render(data)).to.be("\"\"");
    });

    it("Doubled - Multiple sections per template should be permitted.", function() {
        var data = {
                two: "second",
                bool: true
            },
            template = Templz.compile("{{#bool}}\n* first\n{{/bool}}\n* {{two}}\n{{#bool}}\n* third\n{{/bool}}\n");
        expect(template.render(data)).to.be("* first\n* second\n* third\n");
    });

    it("Nested (Truthy) - Nested truthy sections should have their contents rendered.", function() {
        var data = {
                bool: true
            },
            template = Templz.compile("| A {{#bool}}B {{#bool}}C{{/bool}} D{{/bool}} E |");
        expect(template.render(data)).to.be("| A B C D E |");
    });

    it("Nested (Falsey) - Nested falsey sections should be omitted.", function() {
        var data = {
                bool: false
            },
            template = Templz.compile("| A {{#bool}}B {{#bool}}C{{/bool}} D{{/bool}} E |");
        expect(template.render(data)).to.be("| A  E |");
    });

    it("Context Misses - Failed context lookups should be considered falsey.", function() {
        var data = {},
            template = Templz.compile("[{{#missing}}Found key 'missing'!{{/missing}}]");
        expect(template.render(data)).to.be("[]");
    });

    it("Implicit Iterator - String - Implicit iterators should directly interpolate strings.", function() {
        var data = {
                list: ["a", "b", "c", "d", "e"]
            },
            template = Templz.compile("\"{{#list}}({{.}}){{/list}}\"");
        expect(template.render(data)).to.be("\"(a)(b)(c)(d)(e)\"");
    });

    it("Implicit Iterator - Integer - Implicit iterators should cast integers to strings and interpolate.", function() {
        var data = {
                list: [1, 2, 3, 4, 5]
            },
            template = Templz.compile("\"{{#list}}({{.}}){{/list}}\"");
        expect(template.render(data)).to.be("\"(1)(2)(3)(4)(5)\"");
    });

    it("Implicit Iterator - Decimal - Implicit iterators should cast decimals to strings and interpolate.", function() {
        var data = {
                list: [1.1, 2.2, 3.3, 4.4, 5.5]
            },
            template = Templz.compile("\"{{#list}}({{.}}){{/list}}\"");
        expect(template.render(data)).to.be("\"(1.1)(2.2)(3.3)(4.4)(5.5)\"");
    });

    it("Dotted Names - Truthy - Dotted names should be valid for Section tags.", function() {
        var data = {
                a: {
                    b: {
                        c: true
                    }
                }
            },
            template = Templz.compile("\"{{#a.b.c}}Here{{/a.b.c}}\" == \"Here\"");
        expect(template.render(data)).to.be("\"Here\" == \"Here\"");
    });

    it("Dotted Names - Falsey - Dotted names should be valid for Section tags.", function() {
        var data = {
                a: {
                    b: {
                        c: false
                    }
                }
            },
            template = Templz.compile("\"{{#a.b.c}}Here{{/a.b.c}}\" == \"\"");
        expect(template.render(data)).to.be("\"\" == \"\"");
    });

    it("Dotted Names - Broken Chains - Dotted names that cannot be resolved should be considered falsey.", function() {
        var data = {
                a: {}

            },
            template = Templz.compile("\"{{#a.b.c}}Here{{/a.b.c}}\" == \"\"");
        expect(template.render(data)).to.be("\"\" == \"\"");
    });

    it("Surrounding Whitespace - Sections should not alter surrounding whitespace.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile(" | {{#boolean}}\t|\t{{/boolean}} | \n");
        expect(template.render(data)).to.be(" | \t|\t | \n");
    });

    it("Internal Whitespace - Sections should not alter internal whitespace.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile(" | {{#boolean}} {{! Important Whitespace }}\n {{/boolean}} | \n");
        expect(template.render(data)).to.be(" |  \n  | \n");
    });

    it("Indented Inline Sections - Single-line sections should not alter surrounding whitespace.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile(" {{#boolean}}YES{{/boolean}}\n {{#boolean}}GOOD{{/boolean}}\n");
        expect(template.render(data)).to.be(" YES\n GOOD\n");
    });

    it("Standalone Lines - Standalone lines should be removed from the template.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("| This Is\n{{#boolean}}\n|\n{{/boolean}}\n| A Line\n");
        expect(template.render(data)).to.be("| This Is\n|\n| A Line\n");
    });

    it("Indented Standalone Lines - Indented standalone lines should be removed from the template.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("| This Is\n  {{#boolean}}\n|\n  {{/boolean}}\n| A Line\n");
        expect(template.render(data)).to.be("| This Is\n|\n| A Line\n");
    });

    it("Standalone Line Endings - \"\\r\\n\" should be considered a newline for standalone tags.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("|\r\n{{#boolean}}\r\n{{/boolean}}\r\n|");
        expect(template.render(data)).to.be("|\r\n|");
    });

    it("Standalone Without Previous Line - Standalone tags should not require a newline to precede them.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("  {{#boolean}}\n#{{/boolean}}\n/");
        expect(template.render(data)).to.be("#\n/");
    });

    it("Standalone Without Newline - Standalone tags should not require a newline to follow them.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("#{{#boolean}}\n/\n  {{/boolean}}");
        expect(template.render(data)).to.be("#\n/\n");
    });

    it("Padding - Superfluous in-tag whitespace should be ignored.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("|{{# boolean }}={{/ boolean }}|");
        expect(template.render(data)).to.be("|=|");
    });
});

describe("String templates - inverted sections", function() {
    it("Falsey - Falsey sections should have their contents rendered.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile("\"{{^boolean}}This should be rendered.{{/boolean}}\"");
        expect(template.render(data)).to.be("\"This should be rendered.\"");
    });

    it("Truthy - Truthy sections should have their contents omitted.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("\"{{^boolean}}This should not be rendered.{{/boolean}}\"");
        expect(template.render(data)).to.be("\"\"");
    });

    it("Context - Objects and hashes should behave like truthy values.", function() {
        var data = {
                context: {
                    name: "Joe"
                }
            },
            template = Templz.compile("\"{{^context}}Hi {{name}}.{{/context}}\"");
        expect(template.render(data)).to.be("\"\"");
    });

    it("List - Lists should behave like truthy values.", function() {
        var data = {
                list: [{
                        n: 1
                    },
                    {
                        n: 2
                    },
                    {
                        n: 3
                    }
                ]
            },
            template = Templz.compile("\"{{^list}}{{n}}{{/list}}\"");
        expect(template.render(data)).to.be("\"\"");
    });

    it("Empty List - Empty lists should behave like falsey values.", function() {
        var data = {
                list: []
            },
            template = Templz.compile("\"{{^list}}Yay lists!{{/list}}\"");
        expect(template.render(data)).to.be("\"Yay lists!\"");
    });

    it("Doubled - Multiple inverted sections per template should be permitted.", function() {
        var data = {
                two: "second",
                bool: false
            },
            template = Templz.compile("{{^bool}}\n* first\n{{/bool}}\n* {{two}}\n{{^bool}}\n* third\n{{/bool}}\n");
        expect(template.render(data)).to.be("* first\n* second\n* third\n");
    });

    it("Nested (Falsey) - Nested falsey sections should have their contents rendered.", function() {
        var data = {
                bool: false
            },
            template = Templz.compile("| A {{^bool}}B {{^bool}}C{{/bool}} D{{/bool}} E |");
        expect(template.render(data)).to.be("| A B C D E |");
    });

    it("Nested (Truthy) - Nested truthy sections should be omitted.", function() {
        var data = {
                bool: true
            },
            template = Templz.compile("| A {{^bool}}B {{^bool}}C{{/bool}} D{{/bool}} E |");
        expect(template.render(data)).to.be("| A  E |");
    });

    it("Context Misses - Failed context lookups should be considered falsey.", function() {
        var data = {},
            template = Templz.compile("[{{^missing}}Cannot find key 'missing'!{{/missing}}]");
        expect(template.render(data)).to.be("[Cannot find key 'missing'!]");
    });

    it("Dotted Names - Truthy - Dotted names should be valid for Inverted Section tags.", function() {
        var data = {
                a: {
                    b: {
                        c: true
                    }
                }
            },
            template = Templz.compile("\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"\"");
        expect(template.render(data)).to.be("\"\" == \"\"");
    });

    it("Dotted Names - Falsey - Dotted names should be valid for Inverted Section tags.", function() {
        var data = {
                a: {
                    b: {
                        c: false
                    }
                }
            },
            template = Templz.compile("\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"Not Here\"");
        expect(template.render(data)).to.be("\"Not Here\" == \"Not Here\"");
    });

    it("Dotted Names - Broken Chains - Dotted names that cannot be resolved should be considered falsey.", function() {
        var data = {
                a: {}
            },
            template = Templz.compile("\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"Not Here\"");
        expect(template.render(data)).to.be("\"Not Here\" == \"Not Here\"");
    });

    it("Surrounding Whitespace - Inverted sections should not alter surrounding whitespace.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile(" | {{^boolean}}\t|\t{{/boolean}} | \n");
        expect(template.render(data)).to.be(" | \t|\t | \n");
    });

    it("Internal Whitespace - Inverted should not alter internal whitespace.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile(" | {{^boolean}} {{! Important Whitespace }}\n {{/boolean}} | \n");
        expect(template.render(data)).to.be(" |  \n  | \n");
    });

    it("Indented Inline Sections - Single-line sections should not alter surrounding whitespace.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile(" {{^boolean}}NO{{/boolean}}\n {{^boolean}}WAY{{/boolean}}\n");
        expect(template.render(data)).to.be(" NO\n WAY\n");
    });

    it("Standalone Lines - Standalone lines should be removed from the template.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile("| This Is\n{{^boolean}}\n|\n{{/boolean}}\n| A Line\n");
        expect(template.render(data)).to.be("| This Is\n|\n| A Line\n");
    });

    it("Standalone Indented Lines - Standalone indented lines should be removed from the template.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile("| This Is\n  {{^boolean}}\n|\n  {{/boolean}}\n| A Line\n");
        expect(template.render(data)).to.be("| This Is\n|\n| A Line\n");
    });

    it("Standalone Line Endings - \"\\r\\n\" should be considered a newline for standalone tags.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile("|\r\n{{^boolean}}\r\n{{/boolean}}\r\n|");
        expect(template.render(data)).to.be("|\r\n|");
    });

    it("Standalone Without Previous Line - Standalone tags should not require a newline to precede them.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile("  {{^boolean}}\n^{{/boolean}}\n/");
        expect(template.render(data)).to.be("^\n/");
    });

    it("Standalone Without Newline - Standalone tags should not require a newline to follow them.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile("^{{^boolean}}\n/\n  {{/boolean}}");
        expect(template.render(data)).to.be("^\n/\n");
    });

    it("Padding - Superfluous in-tag whitespace should be ignored.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile("|{{^ boolean }}={{/ boolean }}|");
        expect(template.render(data)).to.be("|=|");
    });
});

describe("String templates - partials", function() {
    it("Basic Behavior - The greater-than operator should expand to the named partial.", function() {
        var data = {},
            template = Templz.compile("\"{{>text}}\""),
            partials = {
                text: "from partial"
            };
        expect(template.render(data, partials)).to.be("\"from partial\"");
    });

    it("Failed Lookup - The empty string should be used when the named partial is not found.", function() {
        var data = {},
            template = Templz.compile("\"{{>text}}\""),
            partials = {};
        expect(template.render(data, partials)).to.be("\"\"");
    });

    it("Context - The greater-than operator should operate within the current context.", function() {
        var data = {
                text: "content"
            },
            template = Templz.compile("\"{{>partial}}\""),
            partials = {
                partial: "*{{text}}*"
            };
        expect(template.render(data, partials)).to.be("\"*content*\"");
    });

    it("Recursion - The greater-than operator should properly recurse.", function() {
        var data = {
                content: "X",
                nodes: [{
                        content: "Y",
                        nodes: []
                    }
                ]
            },
            template = Templz.compile("{{>node}}"),
            partials = {
                node: "{{content}}<{{#nodes}}{{>node}}{{/nodes}}>"
            };
        expect(template.render(data, partials)).to.be("X<Y<>>");
    });

    it("Surrounding Whitespace - The greater-than operator should not alter surrounding whitespace.", function() {
        var data = {},
            template = Templz.compile("| {{>partial}} |"),
            partials = {
                partial: "\t|\t"
            };
        expect(template.render(data, partials)).to.be("| \t|\t |");
    });

    it("Inline Indentation - Whitespace should be left untouched.", function() {
        var data = {
                data: "|"
            },
            template = Templz.compile("  {{data}}  {{> partial}}\n"),
            partials = {
                partial: ">\n>"
            };
        expect(template.render(data, partials)).to.be("  |  >\n>\n");
    });

    it("Standalone Line Endings - \"\\r\\n\" should be considered a newline for standalone tags.", function() {
        var data = {},
            template = Templz.compile("|\r\n{{>partial}}\r\n|"),
            partials = {
                partial: ">"
            };
        expect(template.render(data, partials)).to.be("|\r\n>|");
    });

    it("Standalone Without Previous Line - Standalone tags should not require a newline to precede them.", function() {
        var data = {},
            template = Templz.compile("  {{>partial}}\n>"),
            partials = {
                partial: ">\n>"
            };
        expect(template.render(data, partials)).to.be("  >\n  >>");
    });

    it("Standalone Without Newline - Standalone tags should not require a newline to follow them.", function() {
        var data = {},
            template = Templz.compile(">\n  {{>partial}}"),
            partials = {
                partial: ">\n>"
            };
        expect(template.render(data, partials)).to.be(">\n  >\n  >");
    });

    it("Standalone Indentation - Each line of the partial should be indented before rendering.", function() {
        var data = {
                content: "<\n->"
            },
            template = Templz.compile("\\\n {{>partial}}\n/\n"),
            partials = {
                partial: "|\n{{{content}}}\n|\n"
            };
        expect(template.render(data, partials)).to.be("\\\n |\n <\n->\n |\n/\n");
    });

    it("Padding Whitespace - Superfluous in-tag whitespace should be ignored.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile("|{{> partial }}|"),
            partials = {
                partial: "[]"
            };
        expect(template.render(data, partials)).to.be("|[]|");
    });
});

describe("String templates - changing delimiters", function() {
    it("Pair Behavior - The equals sign (used on both sides) should permit delimiter changes.", function() {
        var data = {
                text: "Hey!"
            },
            template = Templz.compile("{{=<% %>=}}(<%text%>)");
        expect(template.render(data)).to.be("(Hey!)");
    });

    it("Special Characters - Characters with special meaning regexen should be valid delimiters.", function() {
        var data = {
                text: "It worked!"
            },
            template = Templz.compile("({{=[ ]=}}[text])");
        expect(template.render(data)).to.be("(It worked!)");
    });

    it("Sections - Delimiters set outside sections should persist.", function() {
        var data = {
                section: true,
                data: "I got interpolated."
            },
            template = Templz.compile("[\n{{#section}}\n  {{data}}\n  |data|\n{{/section}}\n\n{{= | | =}}\n|#section|\n  {{data}}\n  |data|\n|/section|\n]\n");
        expect(template.render(data)).to.be("[\n  I got interpolated.\n  |data|\n\n  {{data}}\n  I got interpolated.\n]\n");
    });

    it("Inverted Sections - Delimiters set outside inverted sections should persist.", function() {
        var data = {
                section: false,
                data: "I got interpolated."
            },
            template = Templz.compile("[\n{{^section}}\n  {{data}}\n  |data|\n{{/section}}\n\n{{= | | =}}\n|^section|\n  {{data}}\n  |data|\n|/section|\n]\n");
        expect(template.render(data)).to.be("[\n  I got interpolated.\n  |data|\n\n  {{data}}\n  I got interpolated.\n]\n");
    });

    it("Partial Inheritence - Delimiters set in a parent template should not affect a partial.", function() {
        var data = {
                value: "yes"
            },
            template = Templz.compile("[ {{>include}} ]\n{{= | | =}}\n[ |>include| ]\n"),
            partials = {
                include: ".{{value}}."
            };
        expect(template.render(data, partials)).to.be("[ .yes. ]\n[ .yes. ]\n");
    });

    it("Post-Partial Behavior - Delimiters set in a partial should not affect the parent template.", function() {
        var data = {
                value: "yes"
            },
            template = Templz.compile("[ {{>include}} ]\n[ .{{value}}.  .|value|. ]\n"),
            partials = {
                include: ".{{value}}. {{= | | =}} .|value|."
            };
        expect(template.render(data, partials)).to.be("[ .yes.  .yes. ]\n[ .yes.  .|value|. ]\n");
    });

    it("Surrounding Whitespace - Surrounding whitespace should be left untouched.", function() {
        var data = {},
            template = Templz.compile("| {{=@ @=}} |");
        expect(template.render(data)).to.be("|  |");
    });

    it("Outlying Whitespace (Inline) - Whitespace should be left untouched.", function() {
        var data = {},
            template = Templz.compile(" | {{=@ @=}}\n");
        expect(template.render(data)).to.be(" | \n");
    });

    it("Standalone Tag - Standalone lines should be removed from the template.", function() {
        var data = {},
            template = Templz.compile("Begin.\n{{=@ @=}}\nEnd.\n");
        expect(template.render(data)).to.be("Begin.\nEnd.\n");
    });

    it("Indented Standalone Tag - Indented standalone lines should be removed from the template.", function() {
        var data = {},
            template = Templz.compile("Begin.\n  {{=@ @=}}\nEnd.\n");
        expect(template.render(data)).to.be("Begin.\nEnd.\n");
    });

    it("Standalone Line Endings - \"\\r\\n\" should be considered a newline for standalone tags.", function() {
        var data = {},
            template = Templz.compile("|\r\n{{= @ @ =}}\r\n|");
        expect(template.render(data)).to.be("|\r\n|");
    });

    it("Standalone Without Previous Line - Standalone tags should not require a newline to precede them.", function() {
        var data = {},
            template = Templz.compile("  {{=@ @=}}\n=");
        expect(template.render(data)).to.be("=");
    });

    it("Standalone Without Newline - Standalone tags should not require a newline to follow them.", function() {
        var data = {},
            template = Templz.compile("=\n  {{=@ @=}}");
        expect(template.render(data)).to.be("=\n");
    });

    it("Pair with Padding - Superfluous in-tag whitespace should be ignored.", function() {
        var data = {},
            template = Templz.compile("|{{= @   @ =}}|");
        expect(template.render(data)).to.be("||");
    });
});

describe("String templates - lambda functions", function() {
    it("Interpolation - A lambda's return value should be interpolated.", function() {
        var data = {
                lambda: function() { return "world" }
            },
            template = Templz.compile("Hello, {{lambda}}!");
        expect(template.render(data)).to.be("Hello, world!");
    });

    it("Interpolation - Expansion - A lambda's return value should be parsed.", function() {
        var data = {
                planet: "world",
                lambda: function() { return "{{planet}}" }
            },
            template = Templz.compile("Hello, {{lambda}}!");
        expect(template.render(data)).to.be("Hello, world!");
    });

    it("Interpolation - Alternate Delimiters - A lambda's return value should parse with the default delimiters.", function() {
        var data = {
                planet: "world",
                lambda: function() { return "|planet| => {{planet}}" }
            },
            template = Templz.compile("{{= | | =}}\nHello, (|&lambda|)!");
        expect(template.render(data)).to.be("Hello, (|planet| => world)!");
    });

    it("Interpolation - Multiple Calls - Interpolated lambdas should not be cached.", function() {
        var data = {
                lambda: function() { return (g=(function(){return this})()).calls=(g.calls||0)+1 }
            },
            template = Templz.compile("{{lambda}} == {{{lambda}}} == {{lambda}}");
        expect(template.render(data)).to.be("1 == 2 == 3");
    });

    it("Escaping - Lambda results should be appropriately escaped.", function() {
        var data = {
                lambda: function() { return ">" }
            },
            template = Templz.compile("<{{lambda}}{{{lambda}}}");
        expect(template.render(data)).to.be("<&#62;>");
    });

    it("Section - Lambdas used for sections should receive the raw section string.", function() {
        var data = {
                x: "Error!",
                lambda: function(txt) { return (txt == "{{x}}" ? "yes" : "no") }
            },
            template = Templz.compile("<{{#lambda}}{{x}}{{/lambda}}>");
        expect(template.render(data)).to.be("<yes>");
    });

    it("Section - Expansion - Lambdas used for sections should have their results parsed.", function() {
        var data = {
                planet: "Earth",
                lambda: function(txt) { return txt + "{{planet}}" + txt }
            },
            template = Templz.compile("<{{#lambda}}-{{/lambda}}>");
        expect(template.render(data)).to.be("<-Earth->");
    });

    it("Section - Alternate Delimiters - Lambdas used for sections should parse with the current delimiters.", function() {
        var data = {
                planet: "Earth",
                lambda: function(txt) { return txt + "{{planet}} => |planet|" + txt }
            },
            template = Templz.compile("{{= | | =}}<|#lambda|-|/lambda|>");
        expect(template.render(data)).to.be("<-{{planet}} => Earth->");
    });

    it("Section - Multiple Calls - Lambdas used for sections should not be cached.", function() {
        var data = {
                lambda: function(txt) { return "__" + txt + "__" }
            },
            template = Templz.compile("{{#lambda}}FILE{{/lambda}} != {{#lambda}}LINE{{/lambda}}");
        expect(template.render(data)).to.be("__FILE__ != __LINE__");
    });

    it("Inverted Section - Lambdas used for inverted sections should be considered truthy.", function() {
        var data = {
                "static": "static",
                lambda: function(txt) { return false }
            },
            template = Templz.compile("<{{^lambda}}{{static}}{{/lambda}}>");
        expect(template.render(data)).to.be("<>");
    });
});

});