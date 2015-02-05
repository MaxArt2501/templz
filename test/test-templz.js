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

var hasDOM = true, win, doc, jsdom;

if (typeof window === "undefined") {
    if (typeof exports === "object" && (jsdom = require("jsdom"))) {

        before(function(done) {
            jsdom.env("<html/>", function(errors, window) {
                // If there are errors, there's a problem with jsdom...
                Templz = new Templz.Context(win = window);
                doc = window.document;
                done();
            });
        });
        after(function() { win.close(); });

    } else hasDOM = false;
} else {
    win = window;
    doc = win.document;
}

describe("Templz.compile", function() {
    it("should create string templates out of strings", function() {
        var template = Templz.compile("Simple template, {{name}}.");
        expect(template.type).to.be(Templz.STRING_TEMPLATE);
    });

    if (doc) {
        doc.createDocumentFragment && it("should create fragment templates out of fragments", function() {
            var frag = doc.createDocumentFragment(),
                div = doc.createElement("div"),
                template;
            
            div.innerHTML = "Hello, <span tpz-name='entity'><span>!";
            frag.appendChild(div);
            template = Templz.compile(frag);
            expect(template.type).to.be(Templz.FRAGMENT_TEMPLATE);
        });

        it("should create fragment templates out of element nodes", function() {
            var div = doc.createElement("div"),
                template;
            
            div.innerHTML = "Hello, <span tpz-name='entity'><span>!";
            template = Templz.compile(div);
            expect(template.type).to.be(Templz.FRAGMENT_TEMPLATE);
        });

        it("should create fragment templates out of text nodes", function() {
            var div = doc.createTextNode("Hello, {{entity}}!"),
                template = Templz.compile(div);
            expect(template.type).to.be(Templz.FRAGMENT_TEMPLATE);
        });
    }

    it("should throw an error with other input types", function() {
        expect(Templz.compile).to.throw(TypeError);
        expect(Templz.compile).withArgs(null).to.throw(TypeError);
        expect(Templz.compile).withArgs(42).to.throw(TypeError);
    });
});

});