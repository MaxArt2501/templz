/*!
 * Templz.js - Logic-less <template>s with a sense
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

		// Checks if <template> elements are supported
	var hasTemplates = typeof HTMLTemplateElement !== "undefined",

		// If loaded as a node.js/CommonJS extension, or in a WebWorker,
		// document may be undefined
		doc = typeof document !== "undefined" ? document : null,

		// IE6-7 support DocumentFragment, but the resulting nodeType is 9
		// (document) instead of 11
		docFragType = doc && doc.createDocumentFragment
				&& doc.createDocumentFragment().nodeType,
		isFragment = docFragType === 9
				? function(frag) { return frag.nodeType === 9 && frag.nodeName === "#document-fragment"; }
				: function(frag) { return frag.nodeType === 11; },

		hasBind = "bind" in function(){},

		newFrag = docFragType && (hasBind ? doc.createDocumentFragment.bind(doc) : function() { return doc.createDocumentFragment(); }),
		newText = doc && (hasBind ? doc.createTextNode.bind(doc) : function(txt) { return doc.createTextNode(txt); }),

		getFrag = hasTemplates
			? (function(temp) {
				return function(content) {
					temp.innerHTML = content;
					return temp.content;
				};
			})(doc.createElement("template"))
			: (function() {
				var wrapperMap = {
					td: "tr", th: "tr", tr: "tbody", thead: "table", tbody: "table", tfoot: "table", option: "select", optgroup: "select"
				};
				return function(content) {
					var frag = newFrag(),
						tagMatch = (content + "").match(/<(t[hdr]|thead|tbody|tfoot|option|optgroup)\b/i),
						wrapper = doc.createElement(tagMatch && wrapperMap[tagMatch[1].toLowerCase()] || "div");
					wrapper.innerHTML = content;
					while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
					return frag;
				};
			})(),

		serializeFragment = doc && ("outerHTML" in doc.documentElement ? function(frag) {
			for (var i = 0, children = frag.childNodes, res = ""; i < children.length;) {
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
		})(doc.createElement("div"))),

		// See http://jsperf.com/native-trim-vs-regex
		trim = "".trim ? function(string) { return string.trim(); }
				: (function(trimRE) {
					return function(string) { return string.replace(trimRE, ""); }
				})(/^\s+|\s+$/g),

		isArray = Array.isArray || (function(toString) {
			return function (object) { return toString.call(object) === "[object Array]"; };
		})(Object.prototype.toString),

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

	function getTags(tags) {
		return typeof tags === "string" ? trim(tags).split(/\s+/, 2) : isArray(tags) && tags;
	}

	/*
	 * Returns the list of additional closing tags and the list of sections left open
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

	function checkParsedText(parsed, sections) {
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

	function buildTree(parsed) {
		var tree = [], stack = tree,
			sections = [], token;

		for (var i = 0; i < parsed.length;) {
			token = parsed[i++];
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

	function parseAttributes(node, tags) {
		var attribs = node.attributes,
			attr, lone, parsed,
			attrset = null, j = 0;

		for (; j < attribs.length; j++) {
			attr = attribs[j].value;
			if (attr && attr.indexOf(tags[0]) >= 0) {
				parsed = parseString(attr, tags);
				if (!parsed.length || parsed.length === 1 && parsed[0].type === "text") continue;

				// Checking tags closure
				parsed = buildTree(checkParsedText(parsed, []));

				if (!attrset) attrset = {};
				attrset[attribs[j].name] = parsed;
			}
		}

		return attrset;
	}

	// node can be a DocumentFragment
	function parseNode(nodeList, tags, prefix) {
		var tokens = [], token, children,
			current,
			curText = "",
			curFrag = newFrag(),
			attribs, attr,
			node,
			parsed, parsedAttributes,

			sections = [];

		function processText() {
			if (curText.indexOf(tags[0]) >= 0) {
				var parts = checkParsedText(parseString(curText, tags), sections), i = 0, part;
				for (; i < parts.length;) {
					part = parts[i++];
					if (part.type === "text")
						curFrag.appendChild(newText(part.value));
					else {
						pushFragment();
						tokens.push(part);
					}
				}
				
			} else curFrag.appendChild(newText(curText));
			curText = "";
		}
		function pushFragment() {
			var l = curFrag.childNodes.length;
			if (!l) return;
			tokens.push(new Token(Templz.FRAGMENT_TEMPLATE, l === 1 ? curFrag.firstChild : curFrag));
			curFrag = newFrag();
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
					token = new Token("name", trim(attr));
					token.node = current.cloneNode(false);
					token.node.removeAttribute(prefix + "name");
				} else if (attr = current.getAttribute(prefix + "content")) {
					token = new Token("&", trim(attr));
					token.node = current.cloneNode(false);
					token.node.removeAttribute(prefix + "content");
				} else if (attr = current.getAttribute(prefix + "section")) {
					token = new Token("#", trim(attr));
					node = current.cloneNode(true);
					node.removeAttribute(prefix + "section");
					token.children = parseNode([ node ], tags, prefix);
				} else if (attr = current.getAttribute(prefix + "empty")) {
					token = new Token("^", trim(attr));
					node = current.cloneNode(true);
					node.removeAttribute(prefix + "empty");
					token.children = parseNode([ node ], tags, prefix);
				} else if (attr = current.getAttribute(prefix + "partial")) {
					token = new Token(">", trim(attr));
					token.node = current.cloneNode(false);
					token.node.removeAttribute(prefix + "partial");
				} else {
					// No template attributes found

					parsedAttributes = parseAttributes(current, tags);
					children = current.childNodes.length ? parseNode(current.childNodes, tags, prefix) : [];
					if (!parsedAttributes && (!children.length || children.length === 1 && children[0].type === "fragment")) {
						// Just a common node without template tags
						node = current.cloneNode(false);
						if (children.length) node.appendChild(children[0].value);
						curFrag.appendChild(node);
					} else {
						token = new Token("node");
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
			} else curFrag.appendChild(current);

		}
		// Checking for trailing text
		if (curText) processText();

		if (sections.length)
			throw new Error("Unclosed section: \"" + sections.pop() + "\"");

		pushFragment();

		return tokens;
	}

	// Should work like mustache.
	function parseString(string, tags) {
		if (!string) return [];

		var tokens = [],
			tagLen = [ tags[0].length, tags[1].length ],
			value, type, name, token, last,

			sections = [];      // Stack to hold section tokens

		var index = 0, endIndex = 0, length = string.length;

		// Removes empty spaces around stand-alone tags.
		function clearEmptyLines() { //return;
			// debugger;
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
				// No more tags: add a text token and breaking the loop
				if (last && last.type === "text")
					last.value += string.substring(endIndex);
				else tokens.push(new Token("text", string.substring(endIndex)));
				break;
			}
			if (index > endIndex) {
				// There's text before the tag
				if (last && last.type === "text")
					last.value += string.substring(endIndex, index);
				else tokens.push(last = new Token("text", string.substring(endIndex, index)));
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
					tokens.push(last = new Token(value.charAt(0), name));
					last.index = endIndex + tagLen[1];
					break;
				case "/": // Closing section
					name = trim(value.substring(1));
					if (sections.length && (value = sections.pop()) !== name)
						throw new Error("Unclosed section \"" + value + "\"");
					clearEmptyLines();
					tokens.push(last = new Token("/", name));
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
					tokens.push(last = new Token("&", name));
					break;
				case ">": // Partial
					name = trim(value.substring(1));
					token = new Token(">", name);
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
					tokens.push(last = new Token("name", value));
			}
			index = endIndex += tagLen[1];
		}
		return tokens;
	}

	// Finds the indexed value in the context stack
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

	// Build the result from a set of tokens and a context stack
	function renderTokens(tokens, type, contextStack, partials, indent) {
		var i = 0, isString = type === Templz.STRING_TEMPLATE,
			res = isString ? "" : newFrag(),
			token, value, node, subres;

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
				copy.setAttribute(name, renderTokens(attribs[name], Templz.STRING_TEMPLATE, ctxstack));

			res.appendChild(copy);
		}
		function renderAttributes(node, attribs, context) {
			for (var name in attribs)
				node.setAttribute(name, renderTokens(attribs[name], Templz.STRING_TEMPLATE, contextStack.concat([ context ])));
		}

		for (; i < tokens.length;) {
			token = tokens[i++];
			switch (token.type) {
				case "text":
					if (isString) res += token.value;
					else res.appendChild(newText(token.value));
					break;
				case "fragment":
					res.appendChild(token.value.cloneNode(true));
					break;
				case "node":
					copyNode(token, token.children ? renderTokens(token.children, type, contextStack) : null, contextStack);
					break;
				case "name": case "&":
					if (token.value === ".")
						value = contextStack[contextStack.length - 1];
					else value = lookup(contextStack, token.value);

					if (value) {
						if (typeof value === "function")
							value = value(token.value);
						if (isString) res += token.type === "&" ? value : escapeString(value);
						else {
							if (token.node)
								copyNode(token, token.type === "&" ? value : newText(value), contextStack);
							else res.appendChild(token.type === "&" ? getFrag(value) : newText(value));
						}
					}
					break;
				case "#":
					if (value = lookup(contextStack, token.value))
						if (isArray(value)) {
							for (j = 0; j < value.length; j++) {
								if (value[j]) {
									var ctxStack = contextStack.concat([ value[j] ]);
									subres = renderTokens(token.children, type, ctxStack, partials);
									if (isString) res += subres;
									else res.appendChild(subres);
								}
							}
						} else {
							if (typeof value === "function") {
								value = value(token.value);
							}
							if (value) {
								subres = renderTokens(token.children, type, contextStack.concat([ value ]), partials);
								if (isString) res += subres;
								else res.appendChild(subres);
							}
						}
					break;
				case "^":
					value = lookup(contextStack, token.value);
					if (!value || isArray(value) && !value.length) {
						subres = renderTokens(token.children, type, contextStack);
						if (isString) res += subres;
						else res.appendChild(subres);
					}
					break;
				case ">":
					if (!partials || typeof partials !== "object" || !partials[token.value]) break;
					value = partials[token.value];
					if (typeof value === "string" || typeof value === "object" && "nodeType" in value)
						value = Templz.compile(value);
					if (value instanceof ParsedTemplate) {
						if (value = value.render(contextStack[contextStack.length - 1], partials)) {
							if (typeof value === "string" && token.indent)
								value = token.indent + value.replace(/\n/g, "\n" + token.indent);
							if (isString)
								res += typeof value === "string" ? value : serializeFragment(value)
							else copyNode(token, typeof value === "string" ? newText(value) : value, contextStack);
						}
					}
					break;
			}
		}
		return res;
	}

	var ParsedTemplate = function(root) {
		this.root = root;
		this.tokens = [];

		this.type = typeof root === "string" ? Templz.STRING_TEMPLATE : Templz.FRAGMENT_TEMPLATE;
	};

	ParsedTemplate.prototype = {
		constructor: ParsedTemplate,
		render: function(data, partials) {
			return renderTokens(this.tokens, this.type, [ data ], partials);
		}
	};

	var Token = function(type, value) {
		this.type = type;
		this.value = value;
	};

	/**
	 * @namespace Templz
	 */
	var Templz = {
		/**
		 * Current version
		 * @memberof Templz
		 * @type {string}
		 * @const
		 */
		version: "0.1.0",

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
		prefix: "tpz-",

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
		compile: function(template, tags, prefix) {
			if (arguments.length < 3)
				prefix = Templz.prefix;
			if (arguments.length < 2)
				tags = Templz.tags;

			if (typeof template === "string") {
				// Should work exactly like mustache.
				var parsed = checkParsedText(parseString(template, tags), []),
					pt = new ParsedTemplate(template);
				pt.tokens = buildTree(parsed);
				return pt;
			} else if (!template) {
				throw new TypeError("Invalid template");
			} else if (template.nodeType === 3) {
				// It's a single text node. Again, just like mustache, but
				// returning a text node instead.
				// Should it do the same for comment and cdata nodes too?
			} else if (template.nodeType === 1 || isFragment(template)) {
				// The real deal
				var parsed = parseNode(template.nodeName === "TEMPLATE" && hasTemplates
						&& template instanceof HTMLTemplateElement ? template.content.childNodes : template.childNodes,
						getTags(tags), prefix);
				var pt = new ParsedTemplate(template);
				pt.tokens = buildTree(parsed);
				return pt;
			}
		},

		/**
		 * Serialize the children of a node. Specifically thought for DocumentFragment
		 * nodes, it can be used with Element nodes too, and also every object with a
		 * childNodes property.
		 * @memberof Templz
		 * @param {Node} fragment  Fragment to serialize
		 * @returns {string}
		 */
		serialize: function(fragment) { return serializeFragment(fragment); },

		/**
		 * Creates a DocumentFragment out of a raw HTML string.
		 * @memberof Templz
		 * @param {string} html
		 * @returns {DocumentFragment}
		 */
		createFragment: function(html) { return getFrag(html); }
	};

	return Templz;
});