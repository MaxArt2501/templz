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
"use strict";

var hasDOM = true;

if (typeof window === "undefined" && typeof exports === "object") {
    var jsdom = require("jsdom"), window;

    if (jsdom) {

        before(function(done) {
            jsdom.env("<html/>", function(errors, win) {
                // If there are errors, there's a problem with jsdom...
                Templz = new Templz.Context(window = win);
                done();
            });
        });
        after(function() { window && window.close(); });

    } else hasDOM = false;
}

hasDOM && describe("Fragment templates - interpolation", function() {
    it("No Interpolation - Templates without Templz directives should render as-is", function() {
        var data = {},
            template = Templz.compile(Templz.createFragment("Hello, <em>world</em>!"));
        expect(Templz.serialize(template.render(data))).to.be("Hello, <em>world</em>!");
    });

    it("Basic Interpolation - The 'name' directive should interpolate content into the template as a text node.", function() {
        var data = {
                subject: "world"
            },
            template = Templz.compile(Templz.createFragment("Hello, <em tpz-name='subject'></em>!"));
        expect(Templz.serialize(template.render(data))).to.be("Hello, <em>world</em>!");
    });

    it("HTML escaping - Basic interpolation should be HTML escaped.", function() {
        var data = {
                forbidden: "& \" < >"
            },
            template = Templz.compile(Templz.createFragment("These characters should be HTML escaped: <span tpz-name='forbidden'></span>"));
        expect(Templz.serialize(template.render(data))).to.be("These characters should be HTML escaped: <span>&amp; \" &lt; &gt;</span>");
    });

    it("Content Interpolation - The 'name' directive should interpolate content into the template as a HTML fragment.", function() {
        var data = {
                content: "a <b>new</b> &amp; <i>elegant</i> way!"
            },
            template = Templz.compile(Templz.createFragment("The following is a HTML structure: <span tpz-content='content'></span>"));
        expect(Templz.serialize(template.render(data))).to.be("The following is a HTML structure: <span>a <b>new</b> &amp; <i>elegant</i> way!</span>");
    });

    it("Basic Numeric Interpolation - Numbers should interpolate seamlessly with proper significance.", function() {
        var data = {
                power: 1.21
            },
            template = Templz.compile(Templz.createFragment("<span tpz-name='power'></span> jiggawatts!"));
        expect(Templz.serialize(template.render(data))).to.be("<span>1.21</span> jiggawatts!");
    });

    it("Content Numeric Interpolation - Numbers should interpolate seamlessly with proper significance.", function() {
        var data = {
                power: 1.21
            },
            template = Templz.compile(Templz.createFragment("<span tpz-content='power'></span> jiggawatts!"));
        expect(Templz.serialize(template.render(data))).to.be("<span>1.21</span> jiggawatts!");
    });

    it("Basic Context Miss Interpolation - Failed context lookups should not render the node.", function() {
        var data = {},
            template = Templz.compile(Templz.createFragment("I <span tpz-name='cannot'></span> be seen!"));
        expect(Templz.serialize(template.render(data))).to.be("I  be seen!");
    });

    it("Content Context Miss Interpolation - Failed context lookups should not render the node.", function() {
        var data = {},
            template = Templz.compile(Templz.createFragment("I <span tpz-content='cannot'></span> be seen!"));
        expect(Templz.serialize(template.render(data))).to.be("I  be seen!");
    });

    it("Dotted Names - Basic Interpolation - Dotted names should be considered a form of shorthand for sections.", function() {
        var data = {
                person: {
                    name: "Joe"
                }
            },
            template = Templz.compile(Templz.createFragment("<span tpz-name='person.name'></span> == <span tpz-section='person'>{{name}}</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>Joe</span> == <span>Joe</span>");
    });

    it("Dotted Names - Content Interpolation - Dotted names should be considered a form of shorthand for sections.", function() {
        var data = {
                person: {
                    name: "Joe"
                }
            },
            template = Templz.compile(Templz.createFragment("<span tpz-content='person.name'></span> == <span tpz-section='person'>{{name}}</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>Joe</span> == <span>Joe</span>");
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
            template = Templz.compile(Templz.createFragment("<em tpz-name='a.b.c.d.e.name'></em> == <em>Phil</em>"));
        expect(Templz.serialize(template.render(data))).to.be("<em>Phil</em> == <em>Phil</em>");
    });

    it("Dotted Names - Broken Chains - Any falsey value prior to the last part of the name should not render the node.", function() {
        var data = {
                a: {}
            },
            template = Templz.compile(Templz.createFragment("\"<span tpz-name='a.b.c'></span>\" == \"\""));
        expect(Templz.serialize(template.render(data))).to.be("\"\" == \"\"");
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
            template = Templz.compile(Templz.createFragment("\"<span tpz-name='a.b.c.name'></span>\" == \"\""));
        expect(Templz.serialize(template.render(data))).to.be("\"\" == \"\"");
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
            template = Templz.compile(Templz.createFragment("{{#a}}<span tpz-name='b.c.d.e.name'></span>{{/a}} == <span>Phil</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>Phil</span> == <span>Phil</span>");
    });

    it("Interpolation - Surrounding Whitespace - Interpolation should not alter surrounding whitespace.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile(Templz.createFragment("| <span tpz-name='string'></span> |"));
        expect(Templz.serialize(template.render(data))).to.be("| <span>---</span> |");
    });

    it("Content Interpolation - Surrounding Whitespace - Interpolation should not alter surrounding whitespace.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile(Templz.createFragment("| <span tpz-content='string'></span> |"));
        expect(Templz.serialize(template.render(data))).to.be("| <span>---</span> |");
    });

    it("Interpolation With Padding - Superfluous in-directive whitespace should be ignored.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile(Templz.createFragment("|<span tpz-name=' string '></span>|"));
        expect(Templz.serialize(template.render(data))).to.be("|<span>---</span>|");
    });

    it("Content Interpolation With Padding - Superfluous in-directive whitespace should be ignored.", function() {
        var data = {
                string: "---"
            },
            template = Templz.compile(Templz.createFragment("|<span tpz-content=' string '></span>|"));
        expect(Templz.serialize(template.render(data))).to.be("|<span>---</span>|");
    });
});

describe("Fragment templates - sections", function() {
    it("Truthy - Truthy sections should have their contents rendered.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile(Templz.createFragment("<span tpz-section='boolean'>This should be rendered.</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>This should be rendered.</span>");
    });

    it("Falsey - Falsey sections should have their contents omitted.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile(Templz.createFragment("<span tpz-section='boolean'>This should not be rendered.</span>"));
        expect(Templz.serialize(template.render(data))).to.be("");
    });

    it("Context - Objects and hashes should be pushed onto the context stack.", function() {
        var data = {
                context: {
                    name: "Joe"
                }
            },
            template = Templz.compile(Templz.createFragment("<span tpz-section='context'>Hi <em tpz-name='name'></em>.</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>Hi <em>Joe</em>.</span>");
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
            template = Templz.compile(Templz.createFragment("<span tpz-section='a'> <em tpz-name='one'></em> <span tpz-section='b'> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='one'></em> <span tpz-section='c'> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> <span tpz-section='d'> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='four'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> <span tpz-section='e'> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='four'></em><em tpz-name='five'></em><em tpz-name='four'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> </span> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='four'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> </span> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='three'></em><em tpz-name='two'></em><em tpz-name='one'></em> </span> <em tpz-name='one'></em><em tpz-name='two'></em><em tpz-name='one'></em> </span> <em tpz-name='one'></em> </span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span> <em>1</em> <span> <em>1</em><em>2</em><em>1</em> <span> <em>1</em><em>2</em><em>3</em><em>2</em><em>1</em> <span> <em>1</em><em>2</em><em>3</em><em>4</em><em>3</em><em>2</em><em>1</em> <span> <em>1</em><em>2</em><em>3</em><em>4</em><em>5</em><em>4</em><em>3</em><em>2</em><em>1</em> </span> <em>1</em><em>2</em><em>3</em><em>4</em><em>3</em><em>2</em><em>1</em> </span> <em>1</em><em>2</em><em>3</em><em>2</em><em>1</em> </span> <em>1</em><em>2</em><em>1</em> </span> <em>1</em> </span>");
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
            template = Templz.compile(Templz.createFragment("<ol><li tpz-section='list'>{{item}}</li></ol>"));
        expect(Templz.serialize(template.render(data))).to.be("<ol><li>1</li><li>2</li><li>3</li></ol>");
    });

    it("Empty List - Empty lists should behave like falsey values.", function() {
        var data = {
                list: []
            },
            template = Templz.compile(Templz.createFragment("<ol><li tpz-section='list'>Yay lists!</li></ol>"));
        expect(Templz.serialize(template.render(data))).to.be("<ol></ol>");
    });

    it("Doubled - Multiple sections per template should be permitted.", function() {
        var data = {
                two: "Second",
                bool: true
            },
            template = Templz.compile(Templz.createFragment("<h3 tpz-section='bool'>First</h3><h3 tpz-name='two'></h3><h3 tpz-section='bool'>Third</h3>"));
        expect(Templz.serialize(template.render(data))).to.be("<h3>First</h3><h3>Second</h3><h3>Third</h3>");
    });

    it("Nested (Truthy) - Nested truthy sections should have their contents rendered.", function() {
        var data = {
                bool: true
            },
            template = Templz.compile(Templz.createFragment("A <span tpz-section='bool'>B <span tpz-section='bool'>C</span> D</span> E"));
        expect(Templz.serialize(template.render(data))).to.be("A <span>B <span>C</span> D</span> E");
    });

    it("Nested (Falsey) - Nested falsey sections should be omitted.", function() {
        var data = {
                bool: false
            },
            template = Templz.compile(Templz.createFragment("A <span tpz-section='bool'>B <span tpz-section='bool'>C</span> D</span> E"));
        expect(Templz.serialize(template.render(data))).to.be("A  E");
    });

    it("Context Misses - Failed context lookups should be considered falsey.", function() {
        var data = {},
            template = Templz.compile(Templz.createFragment("[<span tpz-section='missing'>Found key 'missing'!</span>]"));
        expect(Templz.serialize(template.render(data))).to.be("[]");
    });

    it("Implicit Iterator - String - Implicit iterators should directly interpolate strings.", function() {
        var data = {
                list: ["a", "b", "c"]
            },
            template = Templz.compile(Templz.createFragment("<ol><li tpz-section='list'><span tpz-name='.'></span></li></ol>"));
        expect(Templz.serialize(template.render(data))).to.be("<ol><li><span>a</span></li><li><span>b</span></li><li><span>c</span></li></ol>");
    });

    it("Implicit Iterator - Numeric - Implicit iterators should cast numbers to strings and interpolate.", function() {
        var data = {
                list: [1.1, 2.2, 3.3]
            },
            template = Templz.compile(Templz.createFragment("<ol><li tpz-section='list'><span tpz-name='.'></span></li></ol>"));
        expect(Templz.serialize(template.render(data))).to.be("<ol><li><span>1.1</span></li><li><span>2.2</span></li><li><span>3.3</span></li></ol>");
    });

    it("Dotted Names - Truthy - Dotted names should be valid for Section directives.", function() {
        var data = {
                a: {
                    b: {
                        c: true
                    }
                }
            },
            template = Templz.compile(Templz.createFragment("<span tpz-section='a.b.c'>Here</span> == <span>Here</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>Here</span> == <span>Here</span>");
    });

    it("Dotted Names - Falsey - Dotted names should be valid for Section directives.", function() {
        var data = {
                a: {
                    b: {
                        c: false
                    }
                }
            },
            template = Templz.compile(Templz.createFragment("\"<span tpz-section='a.b.c'>Here</span>\" == \"\""));
        expect(Templz.serialize(template.render(data))).to.be("\"\" == \"\"");
    });

    it("Dotted Names - Broken Chains - Dotted names that cannot be resolved should be considered falsey.", function() {
        var data = {
                a: {}
            },
            template = Templz.compile(Templz.createFragment("\"<span tpz-section='a.b.c'>Here</span>\" == \"\""));
        expect(Templz.serialize(template.render(data))).to.be("\"\" == \"\"");
    });

    it("Surrounding Whitespace - Sections should not alter surrounding whitespace.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile(Templz.createFragment(" | <span tpz-section='boolean'>\t|\t</span> | "));
        expect(Templz.serialize(template.render(data))).to.be(" | <span>\t|\t</span> | ");
    });

    it("Internal Whitespace - Sections should not alter internal whitespace.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile(Templz.createFragment(" | <span tpz-section='boolean'>  Some text\n </span> | \n"));
        expect(Templz.serialize(template.render(data))).to.be(" | <span>  Some text\n </span> | \n");
    });

    it("Padding - Superfluous in-directive whitespace should be ignored.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile(Templz.createFragment("|<span tpz-section=' boolean '>=</span>|"));
        expect(Templz.serialize(template.render(data))).to.be("|<span>=</span>|");
    });
});

describe("Fragment templates - inverted sections", function() {
    it("Falsey - Falsey sections should have their contents rendered.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile(Templz.createFragment("<span tpz-empty='boolean'>This should be rendered.</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>This should be rendered.</span>");
    });

    it("Truthy - Truthy sections should have their contents omitted.", function() {
        var data = {
                "boolean": true
            },
            template = Templz.compile(Templz.createFragment("<span tpz-empty='boolean'>This should not be rendered.</span>"));
        expect(Templz.serialize(template.render(data))).to.be("");
    });

    it("Context - Objects and hashes should behave like truthy values", function() {
        var data = {
                context: {
                    name: "Joe"
                }
            },
            template = Templz.compile(Templz.createFragment("<span tpz-empty='context'>Hi <em tpz-name='name'></em>.</span>"));
        expect(Templz.serialize(template.render(data))).to.be("");
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
            template = Templz.compile(Templz.createFragment("<ol><li tpz-empty='list'>{{n}}</li></ol>"));
        expect(Templz.serialize(template.render(data))).to.be("<ol></ol>");
    });

    it("Empty List - Empty lists should behave like falsey values.", function() {
        var data = {
                list: []
            },
            template = Templz.compile(Templz.createFragment("<ol><li tpz-empty='list'>Yay lists!</li></ol>"));
        expect(Templz.serialize(template.render(data))).to.be("<ol><li>Yay lists!</li></ol>");
    });

    it("Doubled - Multiple inverted sections per template should be permitted.", function() {
        var data = {
                two: "Second",
                bool: false
            },
            template = Templz.compile(Templz.createFragment("<h3 tpz-empty='bool'>First</h3><h3 tpz-name='two'></h3><h3 tpz-empty='bool'>Third</h3>"));
        expect(Templz.serialize(template.render(data))).to.be("<h3>First</h3><h3>Second</h3><h3>Third</h3>");
    });

    it("Nested (Falsey) - Nested falsey sections should have their contents rendered.", function() {
        var data = {
                bool: false
            },
            template = Templz.compile(Templz.createFragment("A <span tpz-empty='bool'>B <span tpz-empty='bool'>C</span> D</span> E"));
        expect(Templz.serialize(template.render(data))).to.be("A <span>B <span>C</span> D</span> E");
    });

    it("Nested (Truthy) - Nested truthy sections should be omitted.", function() {
        var data = {
                bool: true
            },
            template = Templz.compile(Templz.createFragment("A <span tpz-empty='bool'>B <span tpz-empty='bool'>C</span> D</span> E"));
        expect(Templz.serialize(template.render(data))).to.be("A  E");
    });

    it("Context Misses - Failed context lookups should be considered falsey.", function() {
        var data = {},
            template = Templz.compile(Templz.createFragment("[<span tpz-empty='missing'>Found key 'missing'!</span>]"));
        expect(Templz.serialize(template.render(data))).to.be("[<span>Found key 'missing'!</span>]");
    });

    it("Dotted Names - Truthy - Dotted names should be valid for Inverted Section directives.", function() {
        var data = {
                a: {
                    b: {
                        c: true
                    }
                }
            },
            template = Templz.compile(Templz.createFragment("\"<span tpz-empty='a.b.c'>Not Here</span>\" == \"\""));
        expect(Templz.serialize(template.render(data))).to.be("\"\" == \"\"");
    });

    it("Dotted Names - Falsey - Dotted names should be valid for Inverted Section directives.", function() {
        var data = {
                a: {
                    b: {
                        c: false
                    }
                }
            },
            template = Templz.compile(Templz.createFragment("<span tpz-empty='a.b.c'>Not Here</span> == <span>Not Here</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>Not Here</span> == <span>Not Here</span>");
    });

    it("Dotted Names - Broken Chains - Dotted names that cannot be resolved should be considered falsey.", function() {
        var data = {
                a: {}
            },
            template = Templz.compile(Templz.createFragment("<span tpz-empty='a.b.c'>Not Here</span> == <span>Not Here</span>"));
        expect(Templz.serialize(template.render(data))).to.be("<span>Not Here</span> == <span>Not Here</span>");
    });

    it("Surrounding Whitespace - Inverted sections should not alter surrounding whitespace.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile(Templz.createFragment(" | <span tpz-empty='boolean'>\t|\t</span> | "));
        expect(Templz.serialize(template.render(data))).to.be(" | <span>\t|\t</span> | ");
    });

    it("Internal Whitespace - Inverted sections should not alter internal whitespace.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile(Templz.createFragment(" | <span tpz-empty='boolean'>  Some text\n </span> | \n"));
        expect(Templz.serialize(template.render(data))).to.be(" | <span>  Some text\n </span> | \n");
    });

    it("Padding - Superfluous in-directive whitespace should be ignored.", function() {
        var data = {
                "boolean": false
            },
            template = Templz.compile(Templz.createFragment("|<span tpz-empty=' boolean '>=</span>|"));
        expect(Templz.serialize(template.render(data))).to.be("|<span>=</span>|");
    });
});

describe("Fragment templates - Mustache mixin", function() {
    it("Basic Interpolation - Mustache interpolation tags in text nodes should be rendered as text nodes.", function() {
        var data = {
                message: "Not a line break",
                linebr: "<br>"
            },
            template = Templz.compile(Templz.createFragment("{{message}}: <b>* {{linebr}} *</b>"));
        expect(Templz.serialize(template.render(data))).to.be("Not a line break: <b>* &lt;br&gt; *</b>");
    });

    it("Content Interpolation - Mustache unescaped interpolation tags in text nodes should be rendered as HTML fragments.", function() {
        var data = {
                bold: "<b>new</b>",
                italic: "<i>elegant</i>"
            },
            template = Templz.compile(Templz.createFragment("A {{{bold}}} and {{&italic}} way!"));
        expect(Templz.serialize(template.render(data))).to.be("A <b>new</b> and <i>elegant</i> way!");
    });

    it("Sections and Inverted Sections - Mustache sections in text nodes should be rendered as HTML fragments.", function() {
        var data = {
                list: [ "foo", "bar", "baz" ],
                success: false
            },
            template = Templz.compile(Templz.createFragment("This is my list: <div>{{#list}}{{.}} {{/list}}</div><br>{{^success}}This is a warning!{{/success}}"));
        expect(Templz.serialize(template.render(data))).to.be("This is my list: <div>foo bar baz </div><br>This is a warning!");
    });

    it("Sections embracing elements - Mustache sections can include DOM elements, provided that the opening and the closing tags belong to text nodes with the same parent node.", function() {
        var data = {
                users: [
                    { username: "johnny123", status: "online" },
                    { username: "madsklz", status: "offline" }
                ]
            },
            template = Templz.compile(Templz.createFragment("Users: {{#users}}<div><span tpz-name='username'></span> {{status}}</div>{{/users}}"));
        expect(Templz.serialize(template.render(data))).to.be("Users: <div><span>johnny123</span> online</div><div><span>madsklz</span> offline</div>");
    });

    it("Node attributes - Node attributes are rendered as Mustache templates.", function() {
        var data = {
                classes: [ "foo", "bar" ],
                entry: "baz"
            },
            template = Templz.compile(Templz.createFragment("<div class=\"box{{#classes}} {{.}}{{/classes}}\" data-entry=\"test-{{entry}}\">A complex thing.</div>"));
        expect(Templz.serialize(template.render(data))).to.be("<div class=\"box foo bar\" data-entry=\"test-baz\">A complex thing.</div>");
    });
});

});