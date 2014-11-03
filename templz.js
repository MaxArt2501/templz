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

		serializeFragment = doc && "outerHTML" in doc.documentElement ? function(frag) {
			for (var i = 0, children = frag.childNodes, res = ""; i < children.length;) {
				var node = children[i++];
				switch (node.nodeType) {
					case 1: res += node.outerHTML; break;
					case 3: res += node.nodeValue; break;
					case 8: res += "<!--" + node.nodeValue + "-->"; break;
				}
			}
		} : (function(div) {
			return function(frag) {
				div.innerHTML = "";
				div.appendChild(frag.cloneNode(true));
				return div.innerHTML;
			};
		})(doc.createElement("div")),

		// See http://jsperf.com/native-trim-vs-regex
		trim = "".trim ? function(string) { return string.trim(); }
				: (function(trimRE) {
					return function(string) { return string.replace(trimRE, ""); }
				})(/^\s+|\s+$/g),

		isArray = Array.isArray || (function(toString) {
			return function (object) { return toString.call(object) === "[object Array]"; };
		})(Object.prototype.toString);

	function getTags(tags) {
		return typeof tags === "string" ? tags.split(/\s+/, 2) : isArray(tags) && tags;
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
			if (token.type === "#" || token.type === "^") {
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
				lone = getLoneSections(parsed);
				if (lone[0].length)
					throw new Error("Unopened section \"" + lone[0][0] + "\"");
				if (lone[1].length)
					throw new Error("Unclosed section \"" + lone[1][0] + "\"");

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
			tokens.push(new Token("fragment", l === 1 ? curFrag.firstChild : curFrag));
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
					token = new Token("name", attr);
					token.node = current.cloneNode(false);
					token.node.removeAttribute(prefix + "name");
				} else if (attr = current.getAttribute(prefix + "content")) {
					token = new Token("&", attr);
					token.node = current.cloneNode(false);
					token.node.removeAttribute(prefix + "content");
				} else if (attr = current.getAttribute(prefix + "section")) {
					token = new Token("#", attr);
					node = current.cloneNode(true);
					node.removeAttribute(prefix + "section");
					token.children = parseNode([ node ], tags, prefix);
				} else if (attr = current.getAttribute(prefix + "empty")) {
					token = new Token("^", attr);
					node = current.cloneNode(true);
					node.removeAttribute(prefix + "empty");
					token.children = parseNode([ node ], tags, prefix);
				} else if (attr = current.getAttribute(prefix + "partial")) {
					token = new Token(">", attr);
					token.node = current.cloneNode(false);
					token.node.removeAttribute(prefix + "partial");
				} else {
					// No template attributes found

					parsedAttributes = parseAttributes(current, tags);
					children = current.childNodes.length ? parseNode(current.childNodes, tags, prefix) : [];
					if (!parsedAttributes && (!children.length || children.length === 1 && children[0].type === "fragment"))
						// Just a common node without template tags
						curFrag.appendChild(current.cloneNode(true));
					else {
						token = new Token("node");
						token.attributes = parsedAttributes;
						if (children.length > 1 || children.length === 1 && children[0].type !== "fragment") {
							token.children = children;
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

		function clearEmptyLines() {
			var re = /\s*?\n/g, match;

			// Removing whitespaces from the last line of the last text token
			if (last && last.type === "text")
				last.value = last.value.replace(/(\s*\n)\s*$/, "$1");

			// Repositioning endIndex to trim the whitespaces to EOL
			// @todo Verify that works in old IE too...
			re.lastIndex = endIndex + tagLen[1];
			match = re.exec(string);
			if (match && match.index === endIndex + tagLen[1])
				endIndex += match[0].length;
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
					break;
				case "/": // Closing section
					name = trim(value.substring(1));
					if (sections.length && (value = sections.pop()) !== name)
						throw new Error("Unclosed section \"" + value + "\"");
					clearEmptyLines();
					tokens.push(last = new Token("/", name));
					break;
				case "{": // Binding value, unescaped
					if (value.charAt(value.length - 1) === "}")
						value = value.slice(0, -1);
					else if (string.charAt(endIndex++) !== "}" || string.substr(endIndex, tagLen[1]) !== tag[1])
						throw new Error("Unclosed tag at " + index);
					// Fall-through!
				case "&": // Binding value, unescaped
					name = trim(value.substring(1));
					tokens.push(last = new Token("&", name));
					break;
				case "!": // Comment
					// It should just delete the whitespaces around...

					// Removing standalone lines
					clearEmptyLines()
					break;
				case ">": // Partial
					tokens.push(last = new Token(">", value));
					break;
				case "=": // Changing delimiters
					if (value.charAt(value.length - 1) === "=")
						value = value.slice(0, -1);
					else if (string.charAt(endIndex++) !== "=" || string.substr(endIndex, tagLen[1]) !== tag[1])
						throw new Error("Unclosed tag at " + index);
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

	var escapeString = (function(map, re) {
		return function(string) {
			return (string + "").replace(re, function(c) { return map[c]; });
		};
	})({
		"&": "&#38;",
		"<": "&#60;",
		">": "&#62;",
		'"': '&#34;',
		"'": '&#39;',
		"/": '&#47;'
	}, /[&<>"'\/]/g);

	var isArray = Array.isArray || (function(toString) {
		return toString.call(object) === "[object Array]";
	})(Object.prototype.toString);

	// Doesn't support composed names yet (e.g. foo.bar.baz)
	function lookup(contextStack, name) {
		var split = name.split("."),
			i = contextStack.length,
			j, value;

		for (; i--;) {
			value = contextStack[i];
			for (j = 0; j < split.length; j++)
				if (split[j] in value)
					value = value[split[j]];
				else break;

			if (j === split.length)
				return value;
		}
	}

	// Build the result from a set of tokens and a context stack
	function renderTokens(tokens, type, contextStack, partials) {
		var i = 0, isString = type === "string",
			res = isString ? "" : newFrag(),
			token, value, node, subres;

		function copyNode(t, content, ctxstack) {
			var copy = t.node.cloneNode(content === null),
				attribs = t.attributes, name;

			// Filling the copy with the content, if provided
			if (content !== null)
				if (typeof content === "string") copy.innerHTML = content;
				else copy.appendChild(content);

			// Rendering the attributes
			for (name in attribs)
				copy.setAttribute(name, renderTokens(attribs[name], "string", ctxstack));

			res.appendChild(copy);
		}
		function renderAttributes(node, attribs, context) {
			for (var name in attribs)
				node.setAttribute(name, renderTokens(attribs[name], "string", contextStack.concat([ context ])));
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
									// else copyNode(token.children[0], subres, ctxStack);
									else res.appendChild(subres);
								}
							}
						} else if (value) {
							subres = renderTokens(token.children, type, contextStack.concat([ value ]), partials);
							if (isString) res += subres;
							// else copyNode(token.children[0], subres, contextStack);
							else res.appendChild(subres);
						}
					break;
				case "^":
					value = lookup(contextStack, token.value);
					if (!value || isArray(value) && !value.length) {
						subres = renderTokens(token.children, type, contextStack);
						if (isString) res += subres;
						// else copyNode(token.children[0], subres, contextStack);
						else res.appendChild(subres);
					}
					break;
				case ">":
					if (!partials || !(token.value in partials)) break;
					value = partials[token.value];
					if (value instanceof ParsedTemplate) {
						if (value = value.render(contextStack[contextStack.length - 1], partials)) {
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

		this.type = typeof root === "string" ? "string" : "fragment";
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

	var Templz = {

		tags: [ "{{", "}}" ],
		prefix: "tpl-",

		parse: function(template, tags, prefix) {
			if (arguments.length < 3)
				prefix = Templz.prefix;
			if (arguments.length < 2)
				tags = Templz.tags;

			if (typeof template === "string") {
				// Should work exactly like mustache.
				var parsed = parseString(template, tags),
					lone = getLoneSections(parsed);
				if (lone[0].length)
					throw new Error("Unopened section \"" + lone[0][0] + "\"");
				if (lone[1].length)
					throw new Error("Unclosed section \"" + lone[1][0] + "\"");
				var pt = new ParsedTemplate(template);
				pt.tokens = buildTree(parsed);
				return pt;
			} else if (!template) {
				throw new TypeError("Invalid template");
			} else if (template.nodeType === 3) {
				// It's a single text node. Again, just like mustache, but
				// returning a text node instead.
				// Should it do the same for comment and cdata nodes too?
			} else if (template.nodeType === 1) {
				// The real deal
				var parsed = parseNode(template.nodeName === "TEMPLATE" && hasTemplates
						&& template instanceof HTMLTemplateElement ? template.content.childNodes : template.childNodes,
						getTags(tags), prefix);
				var pt = new ParsedTemplate(template);
				pt.tokens = buildTree(parsed);
				return pt;
			}
		}

	};

	return Templz;
});