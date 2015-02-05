/*!
 * Templz.js - Logic-less <template>s with a sense
 */

/**
 * Token type definition
 * @typedef {Object} Token
 * @property {String} type
 * @property {*} value
 * @property {Token[]} [children]
 * @property {String} [indent]     In string templates only
 * @property {Element} [node]      In fragment templates only
 * @property {Object<String, StringTemplate>} [attributes]  In fragment templates only
 */
/**
 * Bundle of utility functions that rely on the context
 * @typedef {Object} Utils
 * @property {Function} isNode
 * @property {Function} isFragment
 * @property {Function} newText
 * @property {Function} newFrag
 * @property {Function} getFrag
 * @property {Function} serializeFragment
 * @property {Function} compile
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Templz = factory();
    }
})(this, function() {
    "use strict";

    /**
     * @class
     * @classdesc Dummy parent class for StringTemplate and FragmentTemplate
     */
    function ParsedTemplate() {};

    ParsedTemplate.prototype = {
        // Prevents direct instantiations
        constructor: function() { throw new TypeError("Illegal constructor"); }
    };

        /**
         * Determines if Function.prototype.bind is supported
         * @type {Boolean}
         */
    var hasBind = "bind" in function(){},

        /**
         * Trims the whitespaces at the beginning and the end of a given string
         * @see http://jsperf.com/native-trim-vs-regex
         * @param {String} string
         * @returns {String}
         */
        trim = "".trim ? function(string) { return string.trim(); }
                : (function(trimRE) {
                    return function(string) { return string.replace(trimRE, ""); }
                })(/^\s+|\s+$/g),

        /**
         * Checks if the argument is an Array object. Polyfills Array.isArray.
         * @function isArray
         * @param {?*} object
         * @returns {Boolean}
         */
        isArray = Array.isArray || (function(toString) {
            return function (object) { return toString.call(object) === "[object Array]"; };
        })(Object.prototype.toString),

        /**
         * Returns the index of an item in a collection, or -1 if not found.
         * Uses Array.prototype.indexOf is available.
         * @function inArray
         * @param {*} pivot           Item to look for
         * @param {Array} array
         * @param {Number} [start=0]  Index to start from
         * @returns {Number}
         */
        inArray = Array.prototype.indexOf ? function(pivot, array, start) {
            return array.indexOf(pivot, start);
        } : function(pivot, array, start) {
            for (var i = start || 0; i < array.length; i++)
                if (array[i] === pivot)
                    return i;
            return -1;
        },

        /**
         * String escaping for HTML/XML
         * @param {String} string
         * @returns {String}
         */
        escapeString = (function(map, re) {
            return function(string) {
                return (string + "").replace(re, function(c) { return map[c]; });
            };
        })({
            "&": "&#38;",
            "<": "&#60;",
            ">": "&#62;",
            '"': "&#34;",
            "'": "&#39;",
            "/": "&#47;"
        }, /[&<>"'\/]/g);

    /**
     * Returns an array of two strings containing the tags
     * @param {String|String[]}
     * @returns {String[]}
     */
    function getTags(tags) {
        return typeof tags === "string" ? trim(tags).split(/\s+/, 2) : isArray(tags) && tags;
    }

    /**
     * Returns the list of additional closing tags and the list of sections left open
     * @param {Token[]} parsed
     * @throws {Error}
     * @returns {Token[][]}
     */
    function getLoneSections(parsed) {
        var opened = [],
            closed = [],
            i = 0, token;
        for (; i < parsed.length;) {
            token = parsed[i++];
            if (token.type === "#" || token.type === "^")
                opened.push(token.value);
            else if (token.type === "/") {
                if (opened.length) {
                    if (opened.pop() !== token.value)
                        // It shouldn't happen at this point
                        throw new Error("Unclosed section \"" + openSection[1] + "\"");
                } else closed.push(token.value);
            }
        }
        return [closed, opened];
    }

    /**
     * Checks if the gives set of tokens is compatible with a given list of
     * opened sections, and returns the tokens
     * @param {Token[]} parsed
     * @param {String[]} sections
     * @throws {Error}
     * @returns {String[]}
     */
    function checkParsedString(parsed, sections) {
        if (parsed.length) {
            var lone = getLoneSections(parsed),
                section, i = 0;

            for (; i < lone[0].length; i++) {
                section = sections.pop();
                if (!section)
                    throw new Error("Unopened section \"" + lone[0][i] + "\"");
                if (section !== lone[0][i])
                    throw new Error("Unclosed section \"" + section + "\"");
            }

            if (lone[1].length)
                sections.push.apply(sections, lone[1]);
        }
        return parsed;
    }

    /**
     * Assembles a list of tokens in a token tree, defining the chilren property
     * in parent tokens.
     * @param {Token[]} tokens
     * @return {Token[]}
     */
    function buildTree(tokens) {
        var tree = [], stack = tree,
            sections = [], token;

        for (var i = 0; i < tokens.length;) {
            token = tokens[i++];
            if ((token.type === "#" || token.type === "^") && !token.children) {
                stack.push(token);
                sections.push(token);
                token.children = stack = [];
            } else if (token.type === "/") {
                sections.pop();
                stack = sections.length ? sections[sections.length - 1].children : tree;
            } else stack.push(token);
        }

        return tree;
    }

    /**
     * Checks a node's attributes to turn into templates when template tags are
     * present, and returns a hashmap of string templates with attribute names
     * as the keys.
     * @param {Node} node
     * @param {String[]} tags
     * @returns {?Object<String, Token[]>}
     */
    function parseAttributes(node, tags) {
        var attribs = node.attributes,
            attr, parsed,
            attrset = null, j = 0;

        for (; j < attribs.length; j++) {
            attr = attribs[j].value;
            if (attr && attr.indexOf(tags[0]) >= 0) {
                parsed = parseString(attr, tags);
                if (!parsed.length || parsed.length === 1 && parsed[0].type === "text") continue;

                // Checking tags closure
                parsed = buildTree(checkParsedString(parsed, []));

                if (!attrset) attrset = {};
                attrset[attribs[j].name] = parsed;
            }
        }

        return attrset;
    }

    /**
     * Parses a node and returns a list of tokens
     * @param {Utils} utils
     * @param {Node[]|NodeList|HTMLCollection} nodeList - can be the child nodes of a DocumentFragment
     * @param {String[]} tags
     * @param {String} prefix
     * @returns {Token[]}
     */
    function parseNode(utils, nodeList, tags, prefix) {
        var tokens = [], token, children,
            current,
            curText = "",
            curFrag = utils.newFrag(),
            node, attr,
            parsedAttributes,

            sections = [];

        /**
         * Elaborates the current text sequence and converts it into a string
         * template if it contains tags
         */
        function processText() {
            if (curText.indexOf(tags[0]) >= 0) {
                var parts = checkParsedString(parseString(curText, tags), sections), i = 0, part;
                while (i < parts.length) {
                    part = parts[i++];
                    if (part.type === "text")
                        curFrag.appendChild(utils.newText(part.value));
                    else {
                        pushFragment();
                        tokens.push(part);
                    }
                }
            } else curFrag.appendChild(utils.newText(curText));
            curText = "";
        }

        /**
         * Creates a fragment token if the current fragment isn't empty
         */
        function pushFragment() {
            var l = curFrag.childNodes.length;
            if (!l) return;
            tokens.push({ type: Templz.FRAGMENT_TEMPLATE, value: l === 1 ? curFrag.firstChild : curFrag });
            curFrag = utils.newFrag();
        }

        for (var i = 0; i < nodeList.length;) {
            current = nodeList[i++];
            if (current.nodeType === 3) {
                // Text node: joining the content and go on.
                curText += current.nodeValue;
            } else if (current.nodeType === 1) {
                // Element node

                if (curText) processText();
                token = null;

                // Checking the attributes
                if (attr = current.getAttribute(prefix + "prefix"))
                    prefix = attr;
                if (attr = current.getAttribute(prefix + "tags"))
                    tags = getTags(attr);

                if (attr = current.getAttribute(prefix + "name")) {
                    token = { type: "name", value: trim(attr) };
                    token.node = current.cloneNode(false);
                    token.node.removeAttribute(prefix + "name");
                } else if (attr = current.getAttribute(prefix + "content")) {
                    token = { type: "&", value: trim(attr) };
                    token.node = current.cloneNode(false);
                    token.node.removeAttribute(prefix + "content");
                } else if (attr = current.getAttribute(prefix + "section")) {
                    token = { type: "#", value: trim(attr) };
                    node = current.cloneNode(true);
                    node.removeAttribute(prefix + "section");
                    token.children = parseNode(utils, [ node ], tags, prefix);
                } else if (attr = current.getAttribute(prefix + "empty")) {
                    token = { type: "^", value: trim(attr) };
                    node = current.cloneNode(true);
                    node.removeAttribute(prefix + "empty");
                    token.children = parseNode(utils, [ node ], tags, prefix);
                } else if (attr = current.getAttribute(prefix + "partial")) {
                    token = { type: ">", value: trim(attr) };
                    token.node = current.cloneNode(false);
                    token.node.removeAttribute(prefix + "partial");
                } else {
                    // No template attributes found

                    parsedAttributes = parseAttributes(current, tags);
                    children = current.childNodes.length ? parseNode(utils, current.childNodes, tags, prefix) : [];
                    if (!parsedAttributes && (!children.length || children.length === 1 && children[0].type === "fragment")) {
                        // Just a common node without template tags
                        node = current.cloneNode(false);
                        if (children.length) node.appendChild(children[0].value);
                        curFrag.appendChild(node);
                    } else {
                        token = { type: "node" };
                        token.attributes = parsedAttributes;
                        if (children.length > 1 || children.length === 1 && children[0].type !== "fragment") {
                            token.children = buildTree(children);
                            token.node = current.cloneNode(false);
                        } else token.node = current.cloneNode(true);
                    }
                }

                if (token) {
                    if (token.node && !("attributes" in token))
                        token.attributes = parseAttributes(current, tags);

                    pushFragment();
                    tokens.push(token);
                }

            // Everything else is just not parsed (comments, etc.)
            } else {
                if (curText) processText();
                curFrag.appendChild(current);
            }

        }
        // Checking for trailing text
        if (curText) processText();

        if (sections.length)
            throw new Error("Unclosed section: \"" + sections.pop() + "\"");

        pushFragment();

        return tokens;
    }

    /**
     * Parses a string and returns a list of tokens
     * @param {String} string
     * @param {String[]} tags
     * @returns {Token[]}
     */
    function parseString(string, tags) {
        if (!string) return [];

        var tokens = [],
            tagLen = [ tags[0].length, tags[1].length ],
            value, name, token, last,

            sections = [],      // Stack to hold section tokens

            index = 0, endIndex = 0, length = string.length;

        /** Removes empty spaces around stand-alone tags. */
        function clearEmptyLines() {
            // Removing whitespaces from the last line of the last text token

            // If the previous token isn't a text token, we're out
            if (last && "text # ^ /".indexOf(last.type) === -1) return;

            if (last && last.type === "text") {
                // If the last token is a text token, but the last line contains
                // non-space characters, or it doesn't contain an EOL but it's not
                // entirely made of whitespace, we're out.
                var lastCR = last.value.lastIndexOf("\n") + 1;
                if (lastCR && /\S/.test(last.value.slice(lastCR))
                        || !lastCR && (tokens.length > 1 || /\S/.test(last.value)))
                    return;
            }

            var strIdx = endIndex + tagLen[1],
                nextCR = string.indexOf("\n", strIdx) + 1;
            if (nextCR && !/\S/.test(string.slice(strIdx, nextCR))
                    || (!nextCR && !/\S/.test(string.slice(strIdx)))) {
                // If the following text contains an EOL, and before that there are
                // only whitespaces, or the rest of the string it's entirely
                // whitespace, we're in a standalone line

                // Trimming the spaces since the last EOL
                if (lastCR) last.value = last.value.slice(0, lastCR);
                // Discarding the whitespace-only first token
                else if (last && last.type === "text")
                    tokens.length = last = 0;

                // Repositioning endIndex to trim the whitespaces to EOL or
                // the end of the string
                endIndex = nextCR ? nextCR - tagLen[1] : length;
            }
        }

        while (index < length) {
            index = string.indexOf(tags[0], index);
            if (index === -1) {
                // No more tags: add a text token and break the loop
                if (last && last.type === "text")
                    last.value += string.substring(endIndex);
                else tokens.push({ type: "text", value: string.substring(endIndex) });
                break;
            }
            if (index > endIndex) {
                // There's text before the tag
                if (last && last.type === "text")
                    last.value += string.substring(endIndex, index);
                else tokens.push(last = { type: "text", value: string.substring(endIndex, index) });
            }

            // Looking for closing delimiter
            endIndex = string.indexOf(tags[1], index += tagLen[0]);
            if (endIndex === -1)
                throw new Error("Unclosed tag: " + tags[0] + string.substr(index, 6) + "...");

            value = trim(string.substring(index, endIndex));
            switch (value.charAt(0)) {
                case "#": case "^": // New section, either normal or inverted
                    name = trim(value.substring(1));
                    sections.push(name);
                    clearEmptyLines();
                    tokens.push(last = { type: value.charAt(0), value: name });
                    last.index = endIndex + tagLen[1];
                    break;
                case "/": // Closing section
                    name = trim(value.substring(1));
                    if (sections.length && (value = sections.pop()) !== name)
                        throw new Error("Unclosed section \"" + value + "\"");
                    clearEmptyLines();
                    tokens.push(last = { type: "/", value: name });
                    last.index = index - tagLen[0];
                    break;
                case "{": // Binding value, unescaped
                    if (value.charAt(value.length - 1) === "}")
                        value = value.slice(0, -1);
                    else if (string.charAt(endIndex++) !== "}" || string.substr(endIndex, tagLen[1]) !== tags[1])
                        throw new Error("Unclosed tag at " + index);
                    // Fall-through!
                case "&": // Binding value, unescaped
                    name = trim(value.substring(1));
                    tokens.push(last = { type: "&", value: name });
                    break;
                case ">": // Partial
                    name = trim(value.substring(1));
                    token = { type: ">", value: name };
                    token.indent = "";
                    if (last && last.type === "text") {
                        value = last.value.lastIndexOf("\n") + 1;
                        if (value && !/\S/.test(value = last.value.slice(value)))
                            token.indent = value;
                        else if (tokens.length === 1 && !/\S/.test(last.value))
                            token.indent = last.value;
                    }
                    clearEmptyLines();
                    tokens.push(last = token);
                    break;
                case "!": // Comment
                    // It should just delete the whitespaces around...

                    // Removing standalone lines
                    clearEmptyLines();
                    break;
                case "=": // Changing delimiters
                    if (value.charAt(value.length - 1) === "=")
                        value = value.slice(0, -1);
                    else if (string.charAt(endIndex++) !== "=" || string.substr(endIndex, tagLen[1]) !== tags[1])
                        throw new Error("Unclosed tag at " + index);

                    clearEmptyLines()
                    tags = getTags(value.substring(1));
                    // Adjusting endIndex for later addition
                    endIndex += tagLen[1] - tags[1].length;

                    tagLen = [ tags[0].length, tags[1].length ];
                    break;
                default: // Binding value
                    tokens.push(last = { type: "name", value: value });
            }
            index = endIndex += tagLen[1];
        }
        return tokens;
    }

    /**
     * Finds the indexed value in the context stack
     * @param {Object[]} contextStack
     * @param {String} name            Value to look for. Can use dot notation
     * @return {?*}
     */
    function lookup(contextStack, name) {
        var split = name.split("."),
            i = contextStack.length,
            j, value;

        for (; i--;) {
            value = contextStack[i];
            for (j = 0; j < split.length && value; j++)
                if (value[split[j]])
                    value = value[split[j]];
                else break;

            if (j === split.length)
                return value;
        }
    }

    /**
     * Builds the string result from a set of tokens and a context stack.
     * Conceived as a recursively callable function.
     * @param {Utils} utils
     * @param {Object[]} tokens
     * @param {Object[]} contextStack  The stack of data to be used to
     *                                 retrieve data from
     * @param {String} indent          A string of whitespaces to indent the
     *                                 result with
     * @param {Object<String, *>} [partials]
     * @returns {String}
     */
    function renderStringTokens(utils, tokens, contextStack, indent, partials) {
        var i = 0, j, res = "",
            token, value;

        while (i < tokens.length) {
            token = tokens[i++];
            switch (token.type) {
                // Plain text
                case "text": res += token.value; break;

                // Escaped and unescaped interpolation
                case "name": case "&":
                    if (token.value === ".")
                        value = contextStack[contextStack.length - 1];
                    else value = lookup(contextStack, token.value);

                    if (value) {
                        if (typeof value === "function")
                            value = value(token.value);
                        res += token.type === "&" ? value : escapeString(value);
                    }
                    break;

                // Section
                case "#":
                    if (value = lookup(contextStack, token.value))
                        if (isArray(value))
                            for (j = 0; j < value.length; j++) {
                                if (value[j])
                                    res += renderStringTokens(utils, token.children, contextStack.concat([ value[j] ]), indent, partials);
                            }
                        else {
                            if (typeof value === "function")
                                value = value(token.value);
                            if (value)
                                res += renderStringTokens(utils, token.children, contextStack.concat([ value ]), indent, partials);
                        }
                    break;

                // Inverted section
                case "^":
                    value = lookup(contextStack, token.value);
                    if (!value || isArray(value) && !value.length)
                        res += renderStringTokens(utils, token.children, contextStack, indent, partials);
                    break;

                // Partial
                case ">":
                    if (!partials || typeof partials !== "object" || !partials[token.value]) break;
                    value = partials[token.value];
                    if (typeof value === "string" || typeof value === "object" && "nodeType" in value)
                        value = utils.compile(value);
                    if (value instanceof ParsedTemplate) {
                        if (value = value.render(contextStack[contextStack.length - 1], partials)) {
                            if (typeof value === "string" && token.indent)
                                value = token.indent + value.replace(/\n/g, "\n" + token.indent);
                            res += typeof value === "string" ? value : utils.serializeFragment(value)
                        }
                    }
                    break;
            }
        }
        return res;
    };

    /**
     * Builds the fragment result from a set of tokens and a context stack.
     * Conceived as a recursively callable function.
     * @param {Utils} utils
     * @param {Object[]} tokens
     * @param {Object[]} contextStack  The stack of data to be used to
     *                                 retrieve data from
     * @param {Object<String, *>} [partials]
     * @returns {String}
     */
    function renderFragmentTokens(utils, tokens, contextStack, partials) {
        var i = 0, j, res = utils.newFrag(),
            token, value;

        function copyNode(t, content, ctxstack) {
            var copy = t.node.cloneNode(content === null),
                attribs = t.attributes, name;

            // Filling the copy with the content, if provided
            if (content !== null)
                if (typeof content === "object" && "nodeType" in content)
                    copy.appendChild(content);
                else copy.innerHTML = content;

            // Rendering the attributes
            for (name in attribs)
                copy.setAttribute(name, renderStringTokens(utils, attribs[name], ctxstack, "", partials));

            res.appendChild(copy);
        }

        while (i < tokens.length) {
            token = tokens[i++];
            switch (token.type) {
                case "text":
                    res.appendChild(utils.newText(token.value));
                    break;
                case "fragment":
                    res.appendChild(token.value.cloneNode(true));
                    break;
                case "node":
                    copyNode(token, token.children ? renderFragmentTokens(utils, token.children, contextStack, partials) : null, contextStack);
                    break;
                case "name": case "&":
                    if (token.value === ".")
                        value = contextStack[contextStack.length - 1];
                    else value = lookup(contextStack, token.value);

                    if (value) {
                        if (typeof value === "function")
                            value = value(token.value);
                        if (token.node)
                            copyNode(token, token.type === "&" ? value : utils.newText(value), contextStack);
                        else res.appendChild(token.type === "&" ? utils.getFrag(value) : utils.newText(value));
                    }
                    break;
                case "#":
                    if (value = lookup(contextStack, token.value))
                        if (isArray(value)) {
                            for (j = 0; j < value.length; j++) {
                                if (value[j])
                                    res.appendChild(renderFragmentTokens(utils, token.children, contextStack.concat([ value[j] ]), partials));
                            }
                        } else {
                            if (typeof value === "function")
                                value = value(token.value);
                            if (value)
                                res.appendChild(renderFragmentTokens(utils, token.children, contextStack.concat([ value ]), partials));
                        }
                    break;
                case "^":
                    value = lookup(contextStack, token.value);
                    if (!value || isArray(value) && !value.length)
                        res.appendChild(renderFragmentTokens(utils, token.children, contextStack, partials));
                    break;
                case ">":
                    if (!partials || typeof partials !== "object" || !partials[token.value]) break;
                    value = partials[token.value];
                    if (typeof value === "string" || typeof value === "object" && "nodeType" in value)
                        value = utils.compile(value);
                    if (value instanceof ParsedTemplate) {
                        if (value = value.render(contextStack[contextStack.length - 1], partials)) {
                            if (typeof value === "string" && token.indent)
                                value = token.indent + value.replace(/\n/g, "\n" + token.indent);
                            copyNode(token, typeof value === "string" ? utils.newText(value) : value, contextStack);
                        }
                    }
                    break;
            }
        }
        return res;
    }

    /**
     * @class
     * @classdesc Context for Templz's template creation and internal functions.
     * @param {Object} window        A global object used as the root
     * @param {Document} [document]  Document object to create nodes and
     *                               fragments from. Defaults to window.document
     */
    function Context(window, document) {
        if (!document)
            document = window && typeof window.document !== "undefined" ? window.document : null;

        /**
         * @class
         * @param {String} source
         * @param {String|String[]} [tags]
         * @classdesc Class for templates of string type
         */
        function StringTemplate(utils, source, tags) {
            this.source = source;
            this.tokens = buildTree(checkParsedString(parseString(source, tags), []));
        }

        /**
         * @class
         * @param {Node[]|NodeList|HTMLCollection} source
         * @param {String|String[]} [tags]
         * @param {String} [prefix]
         * @classdesc Class for templates of fragment type
         */
        function FragmentTemplate(utils, source, tags, prefix) {
            this.source = source;
            this.tokens = buildTree(parseNode(utils, source, tags, prefix));
        }

        // Sets StringTemplate as a subclass of ParsedTemplate
        StringTemplate.prototype = new ParsedTemplate();
        /**
         * Build the result as a string using the provided data and partials
         * @param {Object} data
         * @param {Object<String, *>} [partials]
         * @returns {String}
         */
        StringTemplate.prototype.render = function(data, partials) {
            return renderStringTokens(utils, this.tokens, [ data ], "", partials);
        };

        // Sets StringTemplate as a subclass of ParsedTemplate
        FragmentTemplate.prototype = new ParsedTemplate();
        /**
         * Build the result as a fragment using the provided data and partials
         * @param {Object} data
         * @param {Object<String, *>} [partials]
         * @returns {DocumentFragment|Text}
         */
        FragmentTemplate.prototype.render = function(data, partials) {
            return renderFragmentTokens(utils, this.tokens, [ data ], partials);
        };

        StringTemplate.prototype.type = this.STRING_TEMPLATE;
        FragmentTemplate.prototype.type = this.FRAGMENT_TEMPLATE;

        var that = this,

            /**
             * ID of a DocumentFragment object. IE6-7 support DocumentFragment, but
             * the resulting nodeType is 9 (document) instead of 11.
             * @type {?Number}
             */
            docFragType = document && document.createDocumentFragment
                && document.createDocumentFragment().nodeType,

            /**
             * Defines if <template> elements are supported
             * @type {Boolean}
             */
            hasTemplates = !!window && typeof window.HTMLTemplateElement !== "undefined",

            /** @type Utils */
            utils = {

                /**
                 * Checks if the argument is a Node object. Uses duck typing if Node is
                 * not defined.
                 * @function isNode
                 * @param {?*} node
                 * @returns {Boolean}
                 */
                isNode: window && window.Node ? function(node) {
                    return !!node && node instanceof window.Node;
                } : function(node) {
                    // Duck typing
                    return node && typeof node === "object"
                            && typeof node.nodeType === "number"
                            && typeof node.nodeName === "string";
                },

                /**
                 * Checks if a node is actually a DocumentFragment object
                 * @param {Node} frag
                 * @returns {Boolean}
                 */
                isFragment: docFragType === 9
                        ? function(frag) { return frag.nodeType === 9 && frag.nodeName === "#document-fragment"; }
                        : function(frag) { return frag.nodeType === 11; },

                /**
                 * Creates a new DocumentFragment node
                 * @returns {DocumentFragment}
                 */
                newFrag: docFragType && (hasBind ? document.createDocumentFragment.bind(document)
                        : function() { return document.createDocumentFragment(); }),

                /**
                 * Shorthand for 
                 * @returns {DocumentFragment}
                 */
                newText: document && (hasBind ? document.createTextNode.bind(document)
                        : function(txt) { return document.createTextNode(txt); }),

                /**
                 * Creates a DocumentFragment out of raw HTML code
                 * @param {String} content
                 * @return {DocumentFragment}
                 */
                getFrag: document && (hasTemplates
                    ? (function(temp) {
                        return function(content) {
                            temp.innerHTML = content;
                            var frag = temp.content.cloneNode(true);
                            temp.innerHTML = "";
                            return frag;
                        };
                    })(document.createElement("template"))
                    : (function() {
                        var wrapperMap = {
                            td: "tr", th: "tr", tr: "tbody", thead: "table", tbody: "table", tfoot: "table", option: "select", optgroup: "select"
                        };
                        return function(content) {
                            var frag = utils.newFrag(),
                                tagMatch = (content + "").match(/<(t[hdr]|thead|tbody|tfoot|option|optgroup)\b/i),
                                wrapper = document.createElement(tagMatch && wrapperMap[tagMatch[1].toLowerCase()] || "div");
                            wrapper.innerHTML = content;
                            while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
                            return frag;
                        };
                    })()
                ),

                /**
                 * Serializes a DocumentFragment node
                 * @param {DocumentFragment} frag
                 * @returns {String}
                 */
                serializeFragment: document && ("outerHTML" in document.documentElement
                    ? function(frag) {
                        var i = 0, children = frag.childNodes, res = "", node;
                        while (i < children.length) {
                            var node = children[i++];
                            switch (node.nodeType) {
                                case 1: res += node.outerHTML; break;
                                case 3: res += node.nodeValue; break;
                                case 8: res += "<!--" + node.nodeValue + "-->"; break;
                            }
                        }
                        return res;
                    } : (function(div) {
                        return function(frag) {
                            div.innerHTML = "";
                            div.appendChild(frag.cloneNode(true));
                            return div.innerHTML;
                        };
                    })(document.createElement("div"))
                )
            },

            /**
             * Used for template instantiation
             * @type {Object}
             */
            classes = {
                string: StringTemplate,
                fragment: FragmentTemplate
            };

        /**
         * Serialize the children of a node. Specifically thought for DocumentFragment
         * nodes, it can be used with Element nodes too, and also every object with a
         * childNodes property.
         * @memberof Templz
         * @param {Node} fragment  Fragment to serialize
         * @returns {string}
         */
        this.serialize = utils.serializeFragment;

        /**
         * Creates a DocumentFragment out of a raw HTML string.
         * @memberof Templz
         * @param {string} html
         * @returns {DocumentFragment}
         */
        this.createFragment = utils.getFrag;

        /**
         * Compiles a template with the given tags delimiters and directive prefix.
         * @memberof Templz
         * @param {string|Node} template    It can be a string, a DocumentFragment or
         *                                  an Element node.
         * @param {string|String[]} [tags]  Tag delimiters. It can be either a string
         *                                  of delimiters separater by whitespace, or
         *                                  an array of two strings. Defaults to
         *                                  Templz.tags
         * @param {string} [prefix]         Directive attribute prefix. Defaults to
         *                                  Templz.prefix
         * @returns {ParsedTemplate}
         * @throws {Error}                  Throws a TypeError is a null template is
         *                                  passed; an Error for compiling errors.
         */
        this.compile = utils.compile = function(template, tags, prefix) {
            if (tags == null)
                tags = that.tags;
            if (prefix == null)
                prefix = that.prefix;

            var source, type;
            if (typeof template === "string") {
                // Should work exactly like mustache.
                source = template;
                type = that.STRING_TEMPLATE;
            } else if (template.nodeType === 3) {
                // Single text node
                source = [ template ];
                type = that.FRAGMENT_TEMPLATE;
            } else if (template.nodeType === 1 || utils.isFragment(template)) {
                // The real deal
                source = template.nodeName === "TEMPLATE" && hasTemplates
                        && template instanceof HTMLTemplateElement ? template.content.childNodes : template.childNodes;
                type = that.FRAGMENT_TEMPLATE;
            }

            if (!source)
                throw new TypeError("Invalid template");

            return new classes[type](utils, source, getTags(tags), prefix);
        };

        /* If Object.observe is present, it can be used for binding a template to
         * some data, allowing the result to update on the fly if the data changes.
         * Object.observe is natively supported by Chrome 36+, Opera 23+, io.js,
         * node.js 0.11.13+ plus other Blink-based browsers/environments.
         * Up to a certain degree it can be polyfilled:
         * https://github.com/MaxArt2501/object-observe
         * https://github.com/jdarling/Object.observe
         */
        if (Object.observe) {
            /**
             * Binds a template to the given data, returning a BoundTemplate object.
             * @param {Object} data
             * @param {Object} [partials]
             * @returns {BoundTemplate}
             */
            ParsedTemplate.prototype.bindToData = function(data, partials) {
                return new BoundTemplate(this, data, partials);
            };

            /**
             * Binds an element to the given data, returning the BoundTemplate object.
             * Immediately makes "live" a part of the DOM.
             * @param {Node} element
             * @param {Object} data
             * @param {Object} [partials]
             * @returns {BoundTemplate}
             */
            this.bindElementToData = function(element, data, tags, prefix, partials) {
                if (!utils.isNode(element))
                    throw new TypeError("Invalid node");

                var template = this.compile(element, tags, prefix),
                    bound = template.bindToData(data, partials);

                element.innerHTML = "";
                bound.appendTo(element);

                return bound;
            };

            /**
             * @class
             * @classdesc Defines a template that it's bound to some data.
             */
            var BoundTemplate = function(template, data, partials) {
                if (!(template instanceof ParsedTemplate))
                    throw new TypeError("Invalid template");

                var isAttached = false,
                    isStale,
                    result,
                    nodes = [],
                    observed = [],
                    objectAncestors = [];

                /**
                 * Attaches the live template before an element
                 * @memberof BoundTemplate
                 * @param {Node} node
                 * @throws {TypeError}       In case of invalid node
                 * @throws {ReferenceError}  If node has no parent
                 */
                this.insertBefore = function(node) {
                    if (!utils.isNode(node))
                        throw new TypeError("Invalid node");

                    var i, parent = node.parentNode;
                    if (!parent)
                        throw new ReferenceError("Cannot insert before a detached node");
                    
                    if (isAttached) {
                        for (var i = 0; i < nodes.length; i++)
                            parent.insertBefore(nodes[i], node);
                    } else {
                        putBefore(parent, node);
                        isAttached = true;
                    }
                };

                /**
                 * Appends the live template to an element
                 * @memberof BoundTemplate
                 * @param {Node} parent
                 * @throws {TypeError}       In case of invalid node
                 */
                this.appendTo = function(parent) {
                    if (!utils.isNode(parent))
                        throw new TypeError("Invalid node");

                    if (isAttached) {
                        for (var i = 0; i < nodes.length; i++)
                            parent.appendChild(nodes[i]);
                    } else {
                        putBefore(parent, null);
                        isAttached = true;
                    }
                };

                /**
                 * Returns the underlying template
                 * @returns {ParsedTemplate}
                 */
                this.getTemplate = function() { return template; };

                /**
                 * Returns the attachable DOM node obtained by rendering the
                 * template. Reuses the old result if it's not stale.
                 * @returns {DocumentFragment|Text}
                 */
                var getFragment = function() {
                    if (isStale) {
                        result = template.render(data, partials);
                        isStale = false;
                    }
                    return template.type === that.STRING_TEMPLATE
                            ? utils.newText(result) : result;
                };

                /**
                 * Binds the template to some data
                 * @param {Object} newData
                 * @throws {TypeError} If the data isn't an object
                */
                this.bind = function(newData, newPartials) {
                    if (typeof newData !== "object")
                        throw new TypeError("Data must be an object");

                    if (typeof newPartials === "object")
                        partials = newPartials;
                    if (newData !== observed[0]) {
                        if (observed.length) unobserveAll();
                        isStale = true;
                        data = newData;
                        deepObserve(newData, []);
                        if (isAttached) replaceResult();
                    }
                };

                /**
                 * Unbinds the template from the data, and consequentely ends its
                 * "live" behaviour
                 */
                this.unbind = function unobserveAll() {
                    for (var i = 0; i < observed.length;)
                        Object.unobserve(observed[i++], observer);
                    observed.length = objectAncestors.length = 0;
                };

                /**
                 * Observes an object and all of its descendant objects
                 * @function deepUnobserve
                 * @param {Object} object
                 */
                function deepObserve(object, parentChain) {
                    Object.observe(object, observer, [ "add", "update", "delete" ]);
                    observed.push(object);
                    objectAncestors.push(parentChain);

                    parentChain = parentChain.concat([ object ]);
                    for (var prop in object) {
                        var val = object[prop];
                        if (val && typeof val === "object")
                            deepObserve(val, parentChain);
                    }
                }

                /**
                 * Unobserves an object and all of its descendant objects
                 * @function deepUnobserve
                 * @param {Object} object
                 */
                function deepUnobserve(object) {
                    var newObserved = [],
                        newObjectAncestors = [],
                        i = 0;

                    for (; i < observed.length; i++)
                        if (object !== observed[i] && objectAncestors[i].indexOf(object) === -1) {
                            newObserved.push(observed[i]);
                            newObjectAncestors.push(objectAncestors[i]);
                        } else Object.unobserve(observed[i], observer);

                    // observed = newObserved;
                    observed.splice.apply(observed, [0, observed.length].concat(newObserved));
                    objectAncestors = newObjectAncestors;
                }

                /**
                 * Change handler for observed objects
                 * @param {ChangeRecord[]} changes
                 */
                function observer(changes) {
                    isStale = true;
                    if (isAttached) {
                        var i = 0, type, value;

                        replaceResult();

                        for (; i < changes.length; i++) {
                            type = changes[i].type;
                            if (type === "delete" || type === "update") {
                                value = changes[i].oldValue;
                                if (value && typeof value === "object" && observed.indexOf(value) >= 0)
                                    deepUnobserve(value);
                            }
                            if (type === "add" || type === "update") {
                                value = changes[i].object[changes[i].name];
                                if (value && typeof value === "object" && observed.indexOf(value) === -1) {
                                    var observedIndex = observed.indexOf(changes[i].object);
                                    deepObserve(value, objectAncestors[observedIndex] || []);
                                }
                            }
                        }
                    }
                }

                /**
                 * Attaches the result before a node
                 * @param {Node} parent
                 * @param {Node} node
                 */
                function putBefore(parent, node) {
                    var frag = getFragment();
                    if (frag.nodeType === 3)
                        nodes = [ frag ];
                    else if (!frag.childNodes.length) {
                        frag = document.createComment("Templz empty result");
                        nodes = [ frag ];
                    } else nodes = [].slice.call(frag.childNodes);
                    parent.insertBefore(frag, node);
                }

                /**
                 * Replaces the current attached result with an (allegedly) new one
                 */
                function replaceResult() {
                    var oldNodes = nodes.slice(),
                        parent = nodes[0].parentNode,
                        i = 0;

                    putBefore(parent, nodes[0]);
                    while (i < oldNodes.length)
                        parent.removeChild(oldNodes[i++]);
                }

                this.bind(data);
            };

            BoundTemplate.prototype.constructor = function BoundTemplate() {
                throw new TypeError("Illegal constructor");
            };
        }
    }

    Context.prototype = {
        constructor: Context,
        Context: Context,

        /**
         * Current version
         * @memberof Templz
         * @type {string}
         * @const
         */
        version: "0.2.0",

        /**
         * String template type.
         * @memberof Templz
         * @type {string}
         * @const
         */
        STRING_TEMPLATE: "string",
        /**
         * Fragment template type.
         * @memberof Templz
         * @type {string}
         * @const
         */
        FRAGMENT_TEMPLATE: "fragment",

        /**
         * Mustache tag delimiters.
         * @memberof Templz
         * @type {string|string[]}
         */
        tags: [ "{{", "}}" ],

        /**
         * Templz directive attribute prefix.
         * @memberof Templz
         * @type {string}
         */
        prefix: "tpz-"
    };

    var Templz = new Context(this || (typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : null)));

    return Templz;
});