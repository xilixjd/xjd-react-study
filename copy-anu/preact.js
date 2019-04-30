(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
			(global = global || self, factory(global.ReactDOM = global.React = {}));
}(this, function (exports) {
	'use strict';

	const EMPTY_OBJ = {};
	const EMPTY_ARR = [];
	const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/i;

	/**
	 * Assign properties from `props` to `obj`
	 * @template O, P The obj and props types
	 * @param {O} obj The object to copy properties to
	 * @param {P} props The object to copy properties from
	 * @returns {O & P}
	 */
	function assign(obj, props) {
		for (let i in props) obj[i] = props[i];
		return /** @type {O & P} */ (obj);
	}

	/**
	 * Remove a child node from its parent if attached. This is a workaround for
	 * IE11 which doesn't support `Element.prototype.remove()`. Using this function
	 * is smaller than including a dedicated polyfill.
	 * @param {Node} node The node to remove
	 */
	function removeNode(node) {
		let parentNode = node.parentNode;
		if (parentNode) parentNode.removeChild(node);
	}

	/** @type {import('./index').Options}  */
	const options = {};

	/**
	  * Create an virtual node (used for JSX)
	  * @param {import('./internal').VNode["type"]} type The node name or Component
	  * constructor for this virtual node
	  * @param {object | null | undefined} [props] The properties of the virtual node
	  * @param {Array<import('.').ComponentChildren>} [children] The children of the virtual node
	  * @returns {import('./internal').VNode}
	  */
	function createElement(type, props, children) {
		if (props == null) props = {};
		if (arguments.length > 3) {
			children = [children];
			for (let i = 3; i < arguments.length; i++) {
				children.push(arguments[i]);
			}
		}
		if (children != null) {
			props.children = children;
		}

		// "type" may be undefined during development. The check is needed so that
		// we can display a nice error message with our debug helpers
		if (type != null && type.defaultProps != null) {
			for (let i in type.defaultProps) {
				if (props[i] === undefined) props[i] = type.defaultProps[i];
			}
		}
		let ref = props.ref;
		if (ref) delete props.ref;
		let key = props.key;
		if (key) delete props.key;

		return createVNode(type, props, null, key, ref);
	}

	/**
	 * Create a VNode (used internally by Preact)
	 * @param {import('./internal').VNode["type"]} type The node name or Component
	 * Constructor for this virtual node
	 * @param {object | null} props The properites of this virtual node
	 * @param {string | number} text If this virtual node represents a text node,
	 * this is the text of the node
	 * @param {string |number | null} key The key for this virtual node, used when
	 * diffing it against its children
	 * @param {import('./internal').VNode["ref"]} ref The ref property that will
	 * receive a reference to its created child
	 * @returns {import('./internal').VNode}
	 */
	function createVNode(type, props, text, key, ref) {
		// V8 seems to be better at detecting type shapes if the object is allocated from the same call site
		// Do not inline into createElement and coerceToVNode!
		const vnode = {
			type,
			props,
			text,
			key,
			ref,
			_children: null,
			_dom: null,
			_lastDomChild: null,
			_component: null
		};

		if (options.vnode) options.vnode(vnode);

		return vnode;
	}

	function createRef() {
		return {};
	}

	function Fragment() { }

	/**
	 * Coerce an untrusted value into a VNode
	 * Specifically, this should be used anywhere a user could provide a boolean, string, or number where
	 * a VNode or Component is desired instead
	 * @param {boolean | string | number | import('./internal').VNode} possibleVNode A possible VNode
	 * @returns {import('./internal').VNode}
	 */
	function coerceToVNode(possibleVNode) {
		if (possibleVNode == null || typeof possibleVNode === 'boolean') return null;
		if (typeof possibleVNode === 'string' || typeof possibleVNode === 'number') {
			return createVNode(null, null, possibleVNode, null, null);
		}

		if (Array.isArray(possibleVNode)) {
			return createElement(Fragment, null, possibleVNode);
		}

		// Clone vnode if it has already been used. ceviche/#57
		if (possibleVNode._dom != null) {
			return createVNode(possibleVNode.type, possibleVNode.props, possibleVNode.text, possibleVNode.key, null);
		}

		return possibleVNode;
	}

	/**
	 * Base Component class. Provides `setState()` and `forceUpdate()`, which
	 * trigger rendering
	 * @param {object} props The initial component props
	 * @param {object} context The initial context from parent components'
	 * getChildContext
	 */
	function Component(props, context) {
		this.props = props;
		this.context = context;
		// this.constructor // When component is functional component, this is reset to functional component
		// if (this.state==null) this.state = {};
		// this.state = {};
		// this._dirty = true;
		// this._renderCallbacks = []; // Only class components

		// Other properties that Component will have set later,
		// shown here as commented out for quick reference
		// this.base = null;
		// this._context = null;
		// this._ancestorComponent = null; // Always set right after instantiation
		// this._vnode = null;
		// this._nextState = null; // Only class components
		// this._prevVNode = null;
		// this._processingException = null; // Always read, set only when handling error
	}

	/**
	 * Update component state and schedule a re-render.
	 * @param {object | ((s: object, p: object) => object)} update A hash of state
	 * properties to update with new values or a function that given the current
	 * state and props returns a new partial state
	 * @param {() => void} [callback] A function to be called once component state is
	 * updated
	 */
	Component.prototype.setState = function (update, callback) {
		// only clone state when copying to nextState the first time.
		let s = (this._nextState !== this.state && this._nextState) || (this._nextState = assign({}, this.state));

		// if update() mutates state in-place, skip the copy:
		if (typeof update !== 'function' || (update = update(s, this.props))) {
			assign(s, update);
		}

		// Skip update if updater function returned null
		if (update == null) return;

		if (this._vnode) {
			if (callback) this._renderCallbacks.push(callback);
			enqueueRender(this);
		}
	};

	/**
	 * Immediately perform a synchronous re-render of the component
	 * @param {() => void} [callback] A function to be called after component is
	 * re-renderd
	 */
	Component.prototype.forceUpdate = function (callback) {
		let vnode = this._vnode, dom = this._vnode._dom, parentDom = this._parentDom;
		if (parentDom) {
			// Set render mode so that we can differantiate where the render request
			// is coming from. We need this because forceUpdate should never call
			// shouldComponentUpdate
			const force = callback !== false;

			let mounts = [];
			dom = diff(dom, parentDom, vnode, vnode, this._context, parentDom.ownerSVGElement !== undefined, null, mounts, this._ancestorComponent, force);
			if (dom != null && dom.parentNode !== parentDom) {
				parentDom.appendChild(dom);
			}
			commitRoot(mounts, vnode);
		}
		if (callback) callback();
	};

	/**
	 * Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
	 * Virtual DOM is generally constructed via [JSX](http://jasonformat.com/wtf-is-jsx).
	 * @param {object} props Props (eg: JSX attributes) received from parent
	 * element/component
	 * @param {object} state The component's current state
	 * @param {object} context Context object, as returned by the nearest
	 * ancestor's `getChildContext()`
	 * @returns {import('./index').ComponentChildren | void}
	 */
	Component.prototype.render = Fragment;

	/**
	 * The render queue
	 * @type {Array<import('./internal').Component>}
	 */
	let q = [];

	/**
	 * Asynchronously schedule a callback
	 * @type {(cb) => void}
	 */
	const defer = typeof Promise == 'function' ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;

	/*
	 * The value of `Component.debounce` must asynchronously invoke the passed in callback. It is
	 * important that contributors to Preact can consistenly reason about what calls to `setState`, etc.
	 * do, and when their effects will be applied. See the links below for some further reading on designing
	 * asynchronous APIs.
	 * * [Designing APIs for Asynchrony](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
	 * * [Callbacks synchronous and asynchronous](https://blog.ometer.com/2011/07/24/callbacks-synchronous-and-asynchronous/)
	 */

	/**
	 * Enqueue a rerender of a component
	 * @param {import('./internal').Component} c The component to rerender
	 */
	function enqueueRender(c) {
		if (!c._dirty && (c._dirty = true) && q.push(c) === 1) {
			(options.debounceRendering || defer)(process);
		}
	}

	/** Flush the render queue by rerendering all queued components */
	function process() {
		let p;
		while ((p = q.pop())) {
			// forceUpdate's callback argument is reused here to indicate a non-forced update.
			if (p._dirty) p.forceUpdate(false);
		}
	}

	/**
	 * Diff the children of a virtual node
	 * @param {import('../internal').PreactElement} parentDom The DOM element whose
	 * children are being diffed
	 * @param {import('../internal').VNode} newParentVNode The new virtual
	 * node whose children should be diff'ed against oldParentVNode
	 * @param {import('../internal').VNode} oldParentVNode The old virtual
	 * node whose children should be diff'ed against newParentVNode
	 * @param {object} context The current context object
	 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
	 * @param {Array<import('../internal').PreactElement>} excessDomChildren
	 * @param {Array<import('../internal').Component>} mounts The list of components
	 * which have mounted
	 * @param {import('../internal').Component} ancestorComponent The direct parent
	 * component to the ones being diffed
	 */
	function diffChildren(parentDom, newParentVNode, oldParentVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent) {
		let childVNode, i, j, p, index, oldVNode, newDom,
			nextDom, sibDom, focus,
			childDom;
		
		let newChildren = newParentVNode._children || toChildArray(newParentVNode.props.children, newParentVNode._children = [], coerceToVNode);
		let oldChildren = oldParentVNode != null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR;

		let oldChildrenLength = oldChildren.length;

		for (i = 0; i < oldChildrenLength; i++) {
			if (oldChildren[i] && oldChildren[i]._dom) {
				childDom = oldChildren[i]._dom;
				break;
			}
		}

		if (excessDomChildren != null) {
			for (i = 0; i < excessDomChildren.length; i++) {
				if (excessDomChildren[i] != null) {
					childDom = excessDomChildren[i];
					break;
				}
			}
		}

		for (i = 0; i < newChildren.length; i++) {
			childVNode = newChildren[i] = coerceToVNode(newChildren[i]);
			oldVNode = index = null;

			// Check if we find a corresponding element in oldChildren and store the
			// index where the element was found.
			p = oldChildren[i];
			if (p != null && (childVNode.key == null && p.key == null ? (childVNode.type === p.type) : (childVNode.key === p.key))) {
				index = i;
			}
			else {
				for (j = 0; j < oldChildrenLength; j++) {
					p = oldChildren[j];
					if (p != null) {
						if (childVNode.key == null && p.key == null ? (childVNode.type === p.type) : (childVNode.key === p.key)) {
							index = j;
							break;
						}
					}
				}
			}

			// If we have found a corresponding old element we store it in a variable
			// and delete it from the array. That way the next iteration can skip this
			// element.
			if (index != null) {
				oldVNode = oldChildren[index];
				oldChildren[index] = null;
			}

			nextDom = childDom != null && childDom.nextSibling;

			// Morph the old element into the new one, but don't append it to the dom yet
			newDom = diff(oldVNode == null ? null : oldVNode._dom, parentDom, childVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent, null);

			// Only proceed if the vnode has not been unmounted by `diff()` above.
			if (childVNode != null && newDom != null) {
				// Store focus in case moving children around changes it. Note that we
				// can't just check once for every tree, because we have no way to
				// differentiate wether the focus was reset by the user in a lifecycle
				// hook or by reordering dom nodes.
				focus = document.activeElement;

				if (childVNode._lastDomChild != null) {
					// Only Fragments or components that return Fragment like VNodes will
					// have a non-null _lastDomChild. Continue the diff from the end of
					// this Fragment's DOM tree.
					newDom = childVNode._lastDomChild;
				}
				else if (excessDomChildren == oldVNode || newDom != childDom || newDom.parentNode == null) {
					// NOTE: excessDomChildren==oldVNode above:
					// This is a compression of excessDomChildren==null && oldVNode==null!
					// The values only have the same type when `null`.

					outer: if (childDom == null || childDom.parentNode !== parentDom) {
						parentDom.appendChild(newDom);
					}
					else {
						sibDom = childDom;
						j = 0;
						while ((sibDom = sibDom.nextSibling) && j++ < oldChildrenLength / 2) {
							if (sibDom === newDom) {
								break outer;
							}
						}
						parentDom.insertBefore(newDom, childDom);
					}
				}

				// Restore focus if it was changed
				if (focus !== document.activeElement) {
					focus.focus();
				}

				childDom = newDom != null ? newDom.nextSibling : nextDom;
			}
		}

		// Remove children that are not part of any vnode. Only used by `hydrate`
		if (excessDomChildren != null && newParentVNode.type !== Fragment) for (i = excessDomChildren.length; i--;) if (excessDomChildren[i] != null) removeNode(excessDomChildren[i]);

		// Remove remaining oldChildren if there are any.
		for (i = oldChildrenLength; i--;) if (oldChildren[i] != null) unmount(oldChildren[i], ancestorComponent);
	}

	/**
	 * Flatten a virtual nodes children to a single dimensional array
	 * @param {import('../index').ComponentChildren} children The unflattened
	 * children of a virtual node
	 * @param {Array<import('../internal').VNode | null>} [flattened] An flat array of children to modify
	 */
	function toChildArray(children, flattened, map) {
		if (flattened == null) flattened = [];
		if (children == null || typeof children === 'boolean');
		else if (Array.isArray(children)) {
			for (let i = 0; i < children.length; i++) {
				toChildArray(children[i], flattened);
			}
		}
		else {
			flattened.push(map ? map(children) : children);
		}

		return flattened;
	}

	/**
	 * Diff the old and new properties of a VNode and apply changes to the DOM node
	 * @param {import('../internal').PreactElement} dom The DOM node to apply
	 * changes to
	 * @param {object} newProps The new props
	 * @param {object} oldProps The old props
	 * @param {boolean} isSvg Whether or not this node is an SVG node
	 */
	function diffProps(dom, newProps, oldProps, isSvg) {
		for (let i in newProps) {
			if (i !== 'children' && i !== 'key' && (!oldProps || ((i === 'value' || i === 'checked') ? dom : oldProps)[i] !== newProps[i])) {
				setProperty(dom, i, newProps[i], oldProps[i], isSvg);
			}
		}
		for (let i in oldProps) {
			if (i !== 'children' && i !== 'key' && (!newProps || !(i in newProps))) {
				setProperty(dom, i, null, oldProps[i], isSvg);
			}
		}
	}

	let CAMEL_REG = /-?(?=[A-Z])/g;

	/**
	 * Set a property value on a DOM node
	 * @param {import('../internal').PreactElement} dom The DOM node to modify
	 * @param {string} name The name of the property to set
	 * @param {*} value The value to set the property to
	 * @param {*} oldValue The old value the property had
	 * @param {boolean} isSvg Whether or not this DOM node is an SVG node or not
	 */
	function setProperty(dom, name, value, oldValue, isSvg) {
		let v;
		if (name === 'class' || name === 'className') name = isSvg ? 'class' : 'className';

		if (name === 'style') {

			/* Possible golfing activities for setting styles:
			 *   - we could just drop String style values. They're not supported in other VDOM libs.
			 *   - assigning to .style sets .style.cssText - TODO: benchmark this, might not be worth the bytes.
			 *   - assigning also casts to String, and ignores invalid values. This means assigning an Object clears all styles.
			 */
			let s = dom.style;

			if (typeof value === 'string') {
				s.cssText = value;
			}
			else {
				if (typeof oldValue === 'string') s.cssText = '';
				else {
					// remove values not in the new list
					for (let i in oldValue) {
						if (value == null || !(i in value)) s.setProperty(i.replace(CAMEL_REG, '-'), '');
					}
				}
				for (let i in value) {
					v = value[i];
					if (oldValue == null || v !== oldValue[i]) {
						s.setProperty(i.replace(CAMEL_REG, '-'), typeof v === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? (v + 'px') : v);
					}
				}
			}
		}
		else if (name === 'dangerouslySetInnerHTML') {
			return;
		}
		// Benchmark for comparison: https://esbench.com/bench/574c954bdb965b9a00965ac6
		else if (name[0] === 'o' && name[1] === 'n') {
			let useCapture = name !== (name = name.replace(/Capture$/, ''));
			let nameLower = name.toLowerCase();
			name = (nameLower in dom ? nameLower : name).substring(2);

			if (value) {
				if (!oldValue) dom.addEventListener(name, eventProxy, useCapture);
			}
			else {
				dom.removeEventListener(name, eventProxy, useCapture);
			}
			(dom._listeners || (dom._listeners = {}))[name] = value;
		}
		else if (name !== 'list' && name !== 'tagName' && !isSvg && (name in dom)) {
			dom[name] = value == null ? '' : value;
		}
		else if (value == null || value === false) {
			if (name !== (name = name.replace(/^xlink:?/, ''))) dom.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase());
			else dom.removeAttribute(name);
		}
		else if (typeof value !== 'function') {
			if (name !== (name = name.replace(/^xlink:?/, ''))) dom.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value);
			else dom.setAttribute(name, value);
		}
	}

	/**
	 * Proxy an event to hooked event handlers
	 * @param {Event} e The event object from the browser
	 * @private
	 */
	function eventProxy(e) {
		return this._listeners[e.type](options.event ? options.event(e) : e);
	}

	/**
	 * Diff two virtual nodes and apply proper changes to the DOM
	 * @param {import('../internal').PreactElement | Text} dom The DOM element representing
	 * the virtual nodes under diff
	 * @param {import('../internal').PreactElement} parentDom The parent of the DOM element
	 * @param {import('../internal').VNode | null} newVNode The new virtual node
	 * @param {import('../internal').VNode | null} oldVNode The old virtual node
	 * @param {object} context The current context object
	 * @param {boolean} isSvg Whether or not this element is an SVG node
	 * @param {Array<import('../internal').PreactElement>} excessDomChildren
	 * @param {Array<import('../internal').Component>} mounts A list of newly
	 * mounted components
	 * @param {import('../internal').Component | null} ancestorComponent The direct
	 * parent component
	 */
	function diff(dom, parentDom, newVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent, force) {

		// If the previous type doesn't match the new type we drop the whole subtree
		if (oldVNode == null || newVNode == null || oldVNode.type !== newVNode.type) {
			if (oldVNode != null) unmount(oldVNode, ancestorComponent);
			if (newVNode == null) return null;
			dom = null;
			oldVNode = EMPTY_OBJ;
		}

		if (options.diff) options.diff(newVNode);

		let c, p, isNew = false, oldProps, oldState, snapshot,
			newType = newVNode.type;

		/** @type {import('../internal').Component | null} */
		let clearProcessingException;

		try {
			outer: if (oldVNode.type === Fragment || newType === Fragment) {
				diffChildren(parentDom, newVNode, oldVNode, context, isSvg, excessDomChildren, mounts, c);

				if (newVNode._children.length) {
					dom = newVNode._children[0]._dom;
					newVNode._lastDomChild = newVNode._children[newVNode._children.length - 1]._dom;
				}
			}
			else if (typeof newType === 'function') {

				// Necessary for createContext api. Setting this property will pass
				// the context value as `this.context` just for this component.
				let cxType = newType.contextType;
				let provider = cxType && context[cxType._id];
				let cctx = cxType != null ? (provider ? provider.props.value : cxType._defaultValue) : context;

				// Get component and set it to `c`
				if (oldVNode._component) {
					c = newVNode._component = oldVNode._component;
					clearProcessingException = c._processingException;
				}
				else {
					// Instantiate the new component
					if (newType.prototype && newType.prototype.render) {
						newVNode._component = c = new newType(newVNode.props, cctx); // eslint-disable-line new-cap
					}
					else {
						newVNode._component = c = new Component(newVNode.props, cctx);
						c.constructor = newType;
						c.render = doRender;
					}
					c._ancestorComponent = ancestorComponent;
					if (provider) provider.sub(c);

					c.props = newVNode.props;
					if (!c.state) c.state = {};
					c.context = cctx;
					c._context = context;
					isNew = c._dirty = true;
					c._renderCallbacks = [];
				}

				c._vnode = newVNode;

				// Invoke getDerivedStateFromProps
				let s = c._nextState || c.state;
				if (newType.getDerivedStateFromProps != null) {
					oldState = assign({}, c.state);
					if (s === c.state) s = c._nextState = assign({}, s);
					assign(s, newType.getDerivedStateFromProps(newVNode.props, s));
				}

				// Invoke pre-render lifecycle methods
				if (isNew) {
					if (newType.getDerivedStateFromProps == null && c.componentWillMount != null) c.componentWillMount();
					if (c.componentDidMount != null) mounts.push(c);
				}
				else {
					if (newType.getDerivedStateFromProps == null && force == null && c.componentWillReceiveProps != null) {
						c.componentWillReceiveProps(newVNode.props, cctx);
						s = c._nextState || c.state;
					}

					if (!force && c.shouldComponentUpdate != null && c.shouldComponentUpdate(newVNode.props, s, cctx) === false) {
						c.props = newVNode.props;
						c.state = s;
						c._dirty = false;
						break outer;
					}

					if (c.componentWillUpdate != null) {
						c.componentWillUpdate(newVNode.props, s, cctx);
					}
				}

				oldProps = c.props;
				if (!oldState) oldState = c.state;

				c.context = cctx;
				c.props = newVNode.props;
				c.state = s;

				if (options.render) options.render(newVNode);

				let prev = c._prevVNode;
				let vnode = c._prevVNode = coerceToVNode(c.render(c.props, c.state, c.context));
				c._dirty = false;

				if (c.getChildContext != null) {
					context = assign(assign({}, context), c.getChildContext());
				}

				if (!isNew && c.getSnapshotBeforeUpdate != null) {
					snapshot = c.getSnapshotBeforeUpdate(oldProps, oldState);
				}

				c.base = dom = diff(dom, parentDom, vnode, prev, context, isSvg, excessDomChildren, mounts, c, null);

				if (vnode != null) {
					// If this component returns a Fragment (or another component that
					// returns a Fragment), then _lastDomChild will be non-null,
					// informing `diffChildren` to diff this component's VNode like a Fragemnt
					newVNode._lastDomChild = vnode._lastDomChild;
				}

				c._parentDom = parentDom;

				if (newVNode.ref) applyRef(newVNode.ref, c, ancestorComponent);
			}
			else {
				dom = diffElementNodes(dom, newVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent);

				if (newVNode.ref && (oldVNode.ref !== newVNode.ref)) {
					applyRef(newVNode.ref, dom, ancestorComponent);
				}
			}

			newVNode._dom = dom;

			if (c != null) {
				while (p = c._renderCallbacks.pop()) p.call(c);

				// Don't call componentDidUpdate on mount or when we bailed out via
				// `shouldComponentUpdate`
				if (!isNew && oldProps != null && c.componentDidUpdate != null) {
					c.componentDidUpdate(oldProps, oldState, snapshot);
				}
			}

			if (clearProcessingException) {
				c._processingException = null;
			}

			if (options.diffed) options.diffed(newVNode);
		}
		catch (e) {
			catchErrorInComponent(e, ancestorComponent);
		}

		return dom;
	}

	function commitRoot(mounts, root) {
		let c;
		while ((c = mounts.pop())) {
			try {
				c.componentDidMount();
			}
			catch (e) {
				catchErrorInComponent(e, c._ancestorComponent);
			}
		}

		if (options.commit) options.commit(root);
	}

	/**
	 * Diff two virtual nodes representing DOM element
	 * @param {import('../internal').PreactElement} dom The DOM element representing
	 * the virtual nodes being diffed
	 * @param {import('../internal').VNode} newVNode The new virtual node
	 * @param {import('../internal').VNode} oldVNode The old virtual node
	 * @param {object} context The current context object
	 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
	 * @param {*} excessDomChildren
	 * @param {Array<import('../internal').Component>} mounts An array of newly
	 * mounted components
	 * @param {import('../internal').Component} ancestorComponent The parent
	 * component to the ones being diffed
	 * @returns {import('../internal').PreactElement}
	 */
	function diffElementNodes(dom, newVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent) {
		let d = dom;

		// Tracks entering and exiting SVG namespace when descending through the tree.
		isSvg = newVNode.type === 'svg' || isSvg;

		if (dom == null && excessDomChildren != null) {
			for (let i = 0; i < excessDomChildren.length; i++) {
				const child = excessDomChildren[i];
				if (child != null && (newVNode.type === null ? child.nodeType === 3 : child.localName === newVNode.type)) {
					dom = child;
					excessDomChildren[i] = null;
					break;
				}
			}
		}

		if (dom == null) {
			dom = newVNode.type === null ? document.createTextNode(newVNode.text) : isSvg ? document.createElementNS('http://www.w3.org/2000/svg', newVNode.type) : document.createElement(newVNode.type);

			// we created a new parent, so none of the previously attached children can be reused:
			excessDomChildren = null;
		}
		newVNode._dom = dom;

		if (newVNode.type === null) {
			if ((d === null || dom === d) && newVNode.text !== oldVNode.text) {
				dom.data = newVNode.text;
			}
		}
		else {
			if (excessDomChildren != null && dom.childNodes != null) {
				excessDomChildren = EMPTY_ARR.slice.call(dom.childNodes);
			}
			if (newVNode !== oldVNode) {
				let oldProps = oldVNode.props;
				let newProps = newVNode.props;

				// if we're hydrating, use the element's attributes as its current props:
				if (oldProps == null) {
					oldProps = {};
					if (excessDomChildren != null) {
						let name;
						for (let i = 0; i < dom.attributes.length; i++) {
							name = dom.attributes[i].name;
							oldProps[name == 'class' && newProps.className ? 'className' : name] = dom.attributes[i].value;
						}
					}
				}
				let oldHtml = oldProps.dangerouslySetInnerHTML;
				let newHtml = newProps.dangerouslySetInnerHTML;
				if (newHtml || oldHtml) {
					// Avoid re-applying the same '__html' if it did not changed between re-render
					if (!newHtml || !oldHtml || newHtml.__html != oldHtml.__html) {
						dom.innerHTML = newHtml && newHtml.__html || '';
					}
				}
				if (newProps.multiple) {
					dom.multiple = newProps.multiple;
				}
				diffChildren(dom, newVNode, oldVNode, context, newVNode.type === 'foreignObject' ? false : isSvg, excessDomChildren, mounts, ancestorComponent);
				diffProps(dom, newProps, oldProps, isSvg);
			}
		}

		return dom;
	}

	/**
	 * Invoke or update a ref, depending on whether it is a function or object ref.
	 * @param {object|function} [ref=null]
	 * @param {any} [value]
	 */
	function applyRef(ref, value, ancestorComponent) {
		try {
			if (typeof ref == 'function') ref(value);
			else ref.current = value;
		}
		catch (e) {
			catchErrorInComponent(e, ancestorComponent);
		}
	}

	/**
	 * Unmount a virtual node from the tree and apply DOM changes
	 * @param {import('../internal').VNode} vnode The virtual node to unmount
	 * @param {import('../internal').Component} ancestorComponent The parent
	 * component to this virtual node
	 * @param {boolean} skipRemove Flag that indicates that a parent node of the
	 * current element is already detached from the DOM.
	 */
	function unmount(vnode, ancestorComponent, skipRemove) {
		let r;
		if (options.unmount) options.unmount(vnode);

		if (r = vnode.ref) {
			applyRef(r, null, ancestorComponent);
		}

		if (!skipRemove && vnode._lastDomChild == null && (skipRemove = ((r = vnode._dom) != null))) removeNode(r);

		vnode._dom = vnode._lastDomChild = null;

		if ((r = vnode._component) != null) {
			if (r.componentWillUnmount) {
				try {
					r.componentWillUnmount();
				}
				catch (e) {
					catchErrorInComponent(e, ancestorComponent);
				}
			}

			r.base = r._parentDom = null;
			if (r = r._prevVNode) unmount(r, ancestorComponent, skipRemove);
		}
		else if (r = vnode._children) {
			for (let i = 0; i < r.length; i++) {
				unmount(r[i], ancestorComponent, skipRemove);
			}
		}
	}

	/** The `.render()` method for a PFC backing instance. */
	function doRender(props, state, context) {
		return this.constructor(props, context);
	}

	/**
	 * Find the closest error boundary to a thrown error and call it
	 * @param {object} error The thrown value
	 * @param {import('../internal').Component} component The first ancestor
	 * component check for error boundary behaviors
	 */
	function catchErrorInComponent(error, component) {
		for (; component; component = component._ancestorComponent) {
			if (!component._processingException) {
				try {
					if (component.constructor.getDerivedStateFromError != null) {
						component.setState(component.constructor.getDerivedStateFromError(error));
					}
					else if (component.componentDidCatch != null) {
						component.componentDidCatch(error);
					}
					else {
						continue;
					}
					return enqueueRender(component._processingException = component);
				}
				catch (e) {
					error = e;
				}
			}
		}
		throw error;
	}

	/**
	 * Render a Preact virtual node into a DOM element
	 * @param {import('./index').ComponentChild} vnode The virtual node to render
	 * @param {import('./internal').PreactElement} parentDom The DOM element to
	 * render into
	 */
	function render(vnode, parentDom) {
		let oldVNode = parentDom._prevVNode;
		vnode = createElement(Fragment, null, [vnode]);

		let mounts = [];
		diffChildren(parentDom, parentDom._prevVNode = vnode, oldVNode, EMPTY_OBJ, parentDom.ownerSVGElement !== undefined, oldVNode ? null : EMPTY_ARR.slice.call(parentDom.childNodes), mounts, vnode);
		commitRoot(mounts, vnode);
	}

	/**
	 * Update an existing DOM element with data from a Preact virtual node
	 * @param {import('./index').ComponentChild} vnode The virtual node to render
	 * @param {import('./internal').PreactElement} parentDom The DOM element to
	 * update
	 */
	function hydrate(vnode, parentDom) {
		parentDom._prevVNode = null;
		render(vnode, parentDom);
	}

	/**
	 * Clones the given VNode, optionally adding attributes/props and replacing its children.
	 * @param {import('./internal').VNode} vnode The virtual DOM element to clone
	 * @param {object} props Attributes/props to add when cloning
	 * @param {Array<import('./index').ComponentChildren>} rest Any additional arguments will be used as replacement children.
	 */
	function cloneElement(vnode, props) {
		props = assign(assign({}, vnode.props), props);
		if (arguments.length > 2) props.children = EMPTY_ARR.slice.call(arguments, 2);
		return createVNode(vnode.type, props, null, props.key || vnode.key, props.ref || vnode.ref);
	}

	let i = 0;

	/**
	 *
	 * @param {any} defaultValue
	 */
	function createContext(defaultValue) {
		const id = '__cC' + i++;

		let context = {
			_id: id,
			_defaultValue: defaultValue
		};

		function Consumer(props, context) {
			return props.children(context);
		}
		Consumer.contextType = context;
		context.Consumer = Consumer;

		let ctx = { [id]: null };

		function initProvider(comp) {
			let subs = [];
			comp.getChildContext = () => {
				ctx[id] = comp;
				return ctx;
			};
			comp.componentDidUpdate = () => {
				let v = comp.props.value;
				subs.map(c => v !== c.context && (c.context = v, enqueueRender(c)));
			};
			comp.sub = (c) => {
				subs.push(c);
				let old = c.componentWillUnmount;
				c.componentWillUnmount = () => {
					subs.splice(subs.indexOf(c), 1);
					old && old();
				};
			};
		}

		function Provider(props) {
			if (!this.getChildContext) initProvider(this);
			return props.children;
		}
		context.Provider = Provider;

		return context;
	}

	const mapFn = (children, fn) => {
		if (children == null) return null;
		children = preact.toChildArray(children);
		return children.map(fn);
	};

	let Children = {
		map: mapFn,
		forEach: mapFn,
		count(children) {
			return children ? React.toChildArray(children).length : 0;
		},
		only(children) {
			children = React.toChildArray(children);
			if (children.length!==1) throw new Error('Children.only() expects only one child.');
			return children[0];
		},
		toArray: React.toChildArray
	};

	exports.Component = Component;
	exports.Fragment = Fragment;
	exports.cloneElement = cloneElement;
	exports.createContext = createContext;
	exports.createElement = createElement;
	exports.createRef = createRef;
	exports.h = createElement;
	exports.hydrate = hydrate;
	exports.options = options;
	exports.render = render;
	exports.toChildArray = toChildArray;
	exports.Children = Children;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
