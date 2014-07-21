/*
 * JSON Tree Viewer
 * http://github.com/summerstyle/jsonTreeViewer
 *
 * Copyright 2014 Vera Lobacheva (summerstyle.ru)
 * Released under the GPL3 (GPL3.txt)
 *
 * Sun 27 2014 20:15:00 GMT+0400
 */

'use strict';

var jsonTreeViewer = (function() {
	/* Utilities */
	var utils = {
		get_type : function(x) {
			if (x === null) {
				return 'null';
			}

			switch (typeof x) {
				case 'number':
					return 'number';

				case 'string':
					return 'string';

				case 'boolean':
					return 'boolean';
			}

			switch(Object.prototype.toString.call(x)) {
				case '[object Array]':
					return 'array';

				case '[object Object]':
					return 'object';
			}

			throw new Error('Bad type');
		},

		foreach : function(obj, func) {
			var type = utils.get_type(obj),
				is_last = false,
				last, i, c;

			switch (type) {
				case 'array':
					last = obj.length - 1;

					for (i = 0, c = obj.length; i < c; i++) {
						if (i === last) {
							is_last = true;
						}

						func(obj[i], i, is_last);
					}

					break;

				case 'object':
					var keys = Object.keys(obj);

					last = keys.length - 1;

					for (i = 0, c = keys.length; i < c; i++) {
						if (i === last) {
							is_last = true;
						}

						func(obj[keys[i]], keys[i], is_last);
					}

					break;
			}
		},
		inherits : (function() {
			var F = function() {};

			return function(Child, Parent) {
				F.prototype = Parent.prototype;
				Child.prototype = new F();
				Child.prototype.constructor = Child;
			}
		})()
	};

	/* Node's factory */
	function Node(name, node, is_last) {
		var type = utils.get_type(node);

		switch (type) {
			case 'boolean':
				return new Node_boolean(name, node, is_last);

			case 'number':
				return new Node_number(name, node, is_last);

			case 'string':
				return new Node_string(name, node, is_last);

			case 'null':
				return new Node_null(name, node, is_last);

			case 'object':
				return new Node_object(name, node, is_last);

			case 'array':
				return new Node_array(name, node, is_last);

			default:
				throw new Error('Bad type');
		}
	}

	/* Simple type's constructor (string, number, boolean, null) */
	function Node_simple(name, value, is_last) {
		var self     = this,
			el       = document.createElement('li'),
			template = function(name, value) {
				var str = '<span class="name_wrapper">\
					<span class="name">"' +
						name +
					'"</span> : </span>\
					<span class="value">' +
						value +
					'</span>';

				if (!is_last) {
					str += ',';
				}

				return str;
			};

		el.classList.add('node');
		el.classList.add(this.type);
		el.innerHTML = template(name, value);

		self.el = el;
	}

	/* Boolean */
	function Node_boolean(name, value, is_last) {
		this.type = "boolean";

		Node_simple.call(this, name, value, is_last);
	}

	/* Number */
	function Node_number(name, value, is_last) {
		this.type = "number";

		Node_simple.call(this, name, value, is_last);
	}

	/* String */
	function Node_string(name, value, is_last) {
		this.type = "string";

		Node_simple.call(this, name, '"' + value + '"', is_last);
	}

	/* Null */
	function Node_null(name, value, is_last) {
		this.type = "null";

		Node_simple.call(this, name, value, is_last);
	}

	/* Complex node's constructor (object, array) */
	function Node_complex(name, value, is_last) {
		var self     = this,
			el       = document.createElement('li'),
			template = function(name, sym) {
				var comma = (!is_last) ? ',' : '',
					str = '<div class="value">\
						<b>' + sym[0] + '</b>\
						<ul class="children"></ul>\
						<b>' + sym[1] + '</b>'
						+ comma +
					'</div>';

				if (name !== null) {
					str = '<span class="name_wrapper">\
						<span class="name">"' +
							'<span class="expand_button"></span>' +
							name +
						'"</span> : </span>' + str;
				}

				return str;
			},
			children_ul,
			name_el,
			children = [];

		el.classList.add('node');
		el.classList.add(this.type);
		el.innerHTML = template(name, self.sym);

		children_ul = el.querySelector('.children');

		if (name !== null) {
			name_el = el.querySelector('.name');
			name_el.addEventListener('click', function() {
				self.toggle();
			}, false);
			self.is_root = false;
		} else {
			self.is_root = true;
			el.classList.add('expanded');
		}

		self.el = el;
		self.children = children;
		self.children_ul = children_ul;

		utils.foreach(value, function(node, name, is_last) {
			var child = new Node(name, node, is_last);
			self.add_child(child);
		});

		self.is_empty = !Boolean(children.length);
		if (self.is_empty) {
			el.classList.add('empty');
		}
	}

	Node_complex.prototype = {
		constructor : Node_complex,
		add_child : function(child) {
			this.children.push(child);
			this.children_ul.appendChild(child.el);
		},
		expand : function(is_recursive){
			var children = this.children;

			if (!this.is_root) {
				this.el.classList.add('expanded');
			}

			if (is_recursive) {
				utils.foreach(children, function(item, i) {
					if (typeof item.expand === 'function') {
						item.expand(is_recursive);
					}
				});
			}
		},
		collapse : function(is_recursive) {
			var children = this.children;

			if (!this.is_root) {
				this.el.classList.remove('expanded');
			}

			if (is_recursive) {
				utils.foreach(children, function(item, i) {
					if (typeof item.collapse === 'function') {
						item.collapse(is_recursive);
					}
				});
			}
		},
		toggle : function() {
			this.el.classList.toggle('expanded');
		}
	};

	/* Object */
	function Node_object(name, value, is_last) {
		this.sym = ['{', '}'];
		this.type = "object";

		Node_complex.call(this, name, value, is_last);
	}
	utils.inherits(Node_object, Node_complex);

	/* Array */
	function Node_array(name, value, is_last) {
		this.sym = ['[', ']'];
		this.type = "array";

		Node_complex.call(this, name, value, is_last);
	}
	utils.inherits(Node_array, Node_complex);

	/* Tree */
	var tree = (function() {
		var el = null,
			root = null;

		return {
			set_root : function(child, elementID) {
				root = child;
                el = document.getElementById(elementID);
				el.innerHTML = '';

				el.appendChild(child.el);
			},
			expand : function() {
				if (root) {
					root.expand('recursive');
				}
			},
			collapse : function(){
				if (root) {
					root.collapse('recursive');
				}
			}
		};
	})();

	return {
		parse : function(json_str, elementID) {
			var json = JSON.parse(json_str);

			tree.set_root(new Node(null, json, 'last'), elementID);

            return tree;
		}
	};
})();