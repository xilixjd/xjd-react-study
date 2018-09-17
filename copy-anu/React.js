/* ==========================================Component========================================== */
function Component(props, context) {
    //防止用户在构造器生成JSX
    CurrentOwner.cur = this
    this.context = context;
    this.props = props;
    this.refs = {};
    this.state = null
    this.__pendingCallbacks = [];
    this.__pendingStates = [];
    this.__current = {}
    /*
    * this.__mounting = true 表示组件正在根据虚拟DOM合成真实DOM
    * this.__renderInNext = true 表示组件需要在下一周期重新渲染
    * this.__forceUpdate = true 表示会无视shouldComponentUpdate的结果
    */
}

Component.prototype = {
    setState: function setState(state, cb) {
        setStateImpl.call(this, state, cb)
    },
    __mergeStates: function __mergeStates(nextProps, nextContext) {
        let length = this.__pendingStates.length
        if (length === 0) {
            return this.state
        }
        let states = clearArray(this.__pendingStates)
        let nextStates = Object.assign({}, states)
        for (var i = 0; i < length; i++) {
            var state = states
            var nextState = typeNumber(state) === 5 ? state.call(this, nextStates, nextProps, nextContext) : state
            Object.assign(nextStates, nextState)
        }
        return nextStates
    },
    render: function render() {}
}

function setStateImpl(state, cb) {
    if (typeNumber(cb) === 5) {
        this.__pendingCallbacks.push(cb)
    }
    this.__pendingStates.push(state)

    let hasDom = this.__current._hostNode
    if (!hasDom) {
        //组件挂载期，willMount 时会调用
        if (this.__mounting) {
            // ??? 这里没找到场景
            //在挂载过程中，子组件在componentWillReceiveProps里调用父组件的setState，延迟到下一周期更新
            this.__renderInNext = true;
        }
    } else {
        //组件更新期
        if (this.__receiving) {
            //componentWillReceiveProps中的setState/forceUpdate应该被忽略 
            return;
        }
        this.__renderInNext = true;
        if (options.async) {
            //在事件句柄中执行setState会进行合并
            options.enqueueUpdate(this);
            return;
        }
        if (this.__mounting) {
            // 在componentDidMount里调用自己的setState，延迟到下一周期更新
            // ??? 在更新过程中， 子组件在componentWillReceiveProps里调用父组件的setState，延迟到下一周期更新
            return;
        }
        //  不在生命周期钩子内执行setState
        options.flushBatchedUpdates([this]);
    }
}

function Stateless(render) {
    this.ref = {}
    this.__StatelessRender = render
    this.__current = {}
}

Stateless.prototype.render = renderComponent
/* ==========================================Component========================================== */

/* ==========================================createElement========================================== */
let CurrentOwner = {
    cur: null
}

function createElement(type, config, children) {
    let props = {}
    // props 是否为空 若为 0 则为空
    let checkProps = 0
    // 浏览器 dom element vtype = 1
    let vtype = 1
    let key = null
    let ref = null

    if (typeNumber(config) === 8) {
        for (let c in config) {
            let val = config[c]
            if (c === "key") {
                if (typeNumber(val) >= 2) {
                    key = val + ""
                }
            } else if (c === "ref") {
                if (typeNumber(val) >= 2) {
                    ref = val
                }
            } else {
                checkProps = 1
                props[c] = val
            }
        }
    }

    let childrenLength = arguments.length - 2
    if (childrenLength === 1) {
        if (typeNumber(children) !== 0) {
            props.children = children
        }
    } else if (childrenLength > 1) {
        let childrenArray = Array(childrenLength)
        for (let i = 0; i < childrenLength; i++) {
            childrenArray[i] = arguments[i + 2]
        }
        props.children = childrenArray
    }

    if (typeNumber(type) === 5) {
        // 有 render 则 type 为 Component vtype = 2，没有则为 statelessComponent，vtype = 4
        vtype = type.prototype && type.prototype.render ? 2 : 4
        let defaultProps = type.defaultProps
        if (defaultProps) {
            for (let propName in defaultProps) {
                // 当有 defaultProps 时，要判断 props 是否有这个属性，没有的话才能赋值，否则不用赋值
                if (typeNumber(props[propName]) === 0) {
                    checkProps = 1
                    props[propName] = defaultProps[propName]
                }
            }
        }
    }

    return new Vnode(type, key, ref, props, vtype, checkProps)
}

function Vnode(type, key, ref, props, vtype, checkProps) {
    this.type = type
    this.props = props
    this.vtype = vtype
    let owner = CurrentOwner.cur
    this._owner = owner
    if (key) {
        this.key = key
    }
    // 只有 dom element 才有 checkProps
    if (vtype === 1) {
        this.checkProps = checkProps
    }
    // ref 只接受 function
    if (typeNumber(ref) === 5) {
        this.ref = ref
    }
}

Vnode.prototype = {
    getDomNode: function getDomNode() {
        return this._hostNode || null
    },
    $$typeof: 1
}

function _flattenChildren(original, convert) {
    let children = [],
        temp,
        lastText,
        child
    if (Array.isArray(original)) {
        temp = original.slice(0);
    } else {
        temp = [original];
    }

    while (temp.length) {
        //比较巧妙地判定是否为子数组
        if ((child = temp.pop()) && child.pop) {
            if (child.toJS) {
                //兼容Immutable.js
                child = child.toJS();
            }
            for (let i = 0; i < child.length; i++) {
                temp[temp.length] = child[i];
            }
        } else {
            // eslint-disable-next-line
            let childType = typeNumber(child);

            if (childType < 3 ) {
                continue;
            }

            if (childType < 6) {
                if (lastText && convert) {
                    //false模式下不进行合并与转换
                    children[0].text = child + children[0].text;
                    continue;
                }
                child = child + '';
                if (convert) {
                    child = {
                        type: "#text",
                        text: child,
                        vtype: 0
                    };
                }
                lastText = true;
            } else if (childType === 8 && !child.type) {
                // 针对 <a>{this.props}</a> props 可能是 object 形式，这种情况要对 object 进行转换
                child = JSON.stringify(child)
                if (lastText && convert) {
                    //false模式下不进行合并与转换
                    children[0].text = child + children[0].text;
                    continue;
                }
                child = child + '';
                if (convert) {
                    child = {
                        type: "#text",
                        text: child,
                        vtype: 0
                    };
                }
                lastText = true;
            } else {
                lastText = false;
            }

            children.unshift(child);
        }
    }
    return children;
}

function flattenVChildrenToVnode(vnode) {
    let arr = _flattenChildren(vnode.props.children, true);
    if (arr.length == 0) {
        arr = [];
    }
    return vnode.vchildren = arr;
}
/* ==========================================createElement========================================== */


/* ==========================================util========================================== */
// 根据 type 创建真实 dom
function createDOMElement(vnode) {
    let type = vnode.type
    let dom
    if (type === "#text") {
        dom = document.createTextNode(vnode.text)
    } else if (type === "#comment") {
        dom = document.createComment(vnode.text)
    } else {
        dom = document.createElement(type)
    }
    return dom
}

// 对比对象是否相等
function objectCompare(obj1, obj2) {
    let obj1Stringfy
    let obj2Stringfy
    try {
        obj1Stringfy = JSON.stringify(obj1)
    } catch (e) {
        console.log("第一个参数不是对象")
        return false
    }
    try {
        obj2Stringfy = JSON.stringify(obj2)
    } catch (e) {
        console.log("第二个参数不是对象")
        return false
    }
    return obj1Stringfy === obj2Stringfy
}

let numberMap = {
    //null undefined IE6-8这里会返回[object Object]
    "[object Boolean]": 2,
    "[object Number]": 3,
    "[object String]": 4,
    "[object Function]": 5,
    "[object Symbol]": 6,
    "[object Array]": 7
  };
  
// undefined: 0, null: 1, boolean:2, number: 3, string: 4, function: 5, array: 7, object:8
function typeNumber(data) {
    if (data === null) {
        return 1;
    }
    if (data === void 666) {
        return 0;
    }
    let a = numberMap[Object.prototype.toString.call(data)];
    return a || 8;
}

/**
 * 清除原数组参数并返回
 * @param {数组} arr 
 */
function clearArray(arr) {
    return arr.splice(0, arr.length)
}
/* ==========================================util========================================== */

/* ==========================================event========================================== */
let globalEventsDict = {}

function addGlobalEvent(name) {
    if (!globalEventsDict[name]) {
        globalEventsDict[name] = true
        addEvent(document, name, dispatchEvent)
    }
}

function addEvent(el, eventType, fn, bool) {
    if (el.addEventListener) {
        el.addEventListener(eventType, fn, bool)
    } else if (el.attachEvent) {
        el.attachEvent("on" + eventType, fn)
    }
}

function dispatchEvent(e, type, end) {
    e = new SyntheticEvent(e)
    if (type) {
        e.type = type
    }
    let eventType = e.type
    if (eventType === "click") {
        if (e.target.disabled) {
            return
        }
    }
    let paths = collectPaths(e.target, end || document)
    let captured = eventType + "capture"

    options.async = true
    // 捕获阶段
    triggerEventFlow(paths, captured, e)
    if (!e._stopPropagation) {
        // 冒泡阶段
        triggerEventFlow(paths.reverse(), eventType, e)
    }
    options.async = false
    options.flushBatchedUpdates()
}

function collectPaths(from, end) {
    let paths = []
    while (from !== end && from.nodeType === 1) {
        let events = from.__events
        if (events) {
            paths.push({
                dom: from,
                events: events
            })
        }
        from = from.parentNode
    }
    return paths
}

function triggerEventFlow(paths, eventType, e) {
    for (let i = paths.length - 1; i >= 0; i--) {
        let path = paths[i]
        let fn = path.events[eventType]
        if (typeNumber(fn) === 5) {
            e.currentTarget = path.dom
            fn.call(path.dom, e)
            if (e._stopPropagation) {
                break
            }
        }
    }
}

function SyntheticEvent(event) {
    if (event.nativeEvent) {
        return event
    }
    for (let i in event) {
        if (!eventProto[i]) {
            this[i] = event[i]
        }
    }
    if (!this.target) {
        this.target = event.srcElement
    }
    this.nativeEvent = event
}

let eventProto = SyntheticEvent.prototype = {
    fixEvent: function fixEvent() {},
    preventDefault: function preventDefault() {
        let e = this.nativeEvent || {}
        e.returnValue = this.returnValue = false
        if (e.preventDefault) {
            e.preventDefault()
        }
    },
    fixHooks: function fixHooks() {},
    stopPropagation: function stopPropagation() {
        let e = this.nativeEvent || {}
        e.cancelBubble = this._stopPropagation = true
        if (e.stopPropagation) {
            e.stopPropagation()
        }
    },
    stopImmediatePropagation: function stopImmediatePropagation() {
        this.stopPropagation();
        this.stopImmediate = true;
    }
}
/* ==========================================event========================================== */

let pendingRefs = []

let dirtyComponents = []

let nullFunc = function() {}

let options = {
    beforeUnmount: nullFunc,
    afterMount: nullFunc,
    afterUpdate: nullFunc,
}
options.flushBatchedUpdates = function (queue) {
    clearRefsAndMounts(queue || dirtyComponents);
}
options.enqueueUpdate = function (instance) {
    dirtyComponents.push(instance);
}

let specialProps = {
    children: 1,
    style: 1,
    className: 1,
}

function getPropsHookType(name, val, type, dom) {
    // 缺少 boolAttributes（checked, readonly...） 和 booleanTag（option） 的判断
    if (specialProps[name]) {
        return name
    } else if (/^on[A-Z]/.test(name)) {
        return "__event__"
    } else if (typeNumber(val) < 3 && !val) {
        return "removeAttribute"
    } else {
        // dom 没有这个属性，则相当于 <div xxx="x"></div>，若有，则为 dom[name]=val
        return dom[name] === undefined ? "setAttribute" : "property"
    }
}

let propsHook = {
    children: nullFunc,
    style: function style(dom, _, val, lastProps) {
        let oldStyle = lastProps.style || {}
        let newStyle = val || {}
        if (objectCompare(oldStyle, newStyle) === true) {
            return
        }
        for (let name in newStyle) {
            let val = newStyle[name]
            if (val !== oldStyle[name]) {
                if (/^-?\d+(\.\d+)?$/.test(val)) {
                    val += "px"
                }
                dom.style[name] = val
            }
        }
        // 旧样式中存在，新样式没有的，需要清除
        for (let name in oldStyle) {
            if (!(name in newStyle)) {
                dom.style[name] = ""
            }
        }
    },
    className: function className(dom, _, val) {
        dom.className = val
    },
    __event__: function __event__(dom, name, val, lastProps) {
        let domEvents = dom.__events || (dom.__events = {})
        if (!val) {
            delete domEvents[name.slice(2)]
        } else {
            // vnode 第一次 mount 的时候没有这个事件，则要绑定全局事件
            // 然而当 update 来 diffProps 时，lastProps 与第一次 mount 的事件一致时
            // 不用再绑定
            let _name = name.slice(2).toLowerCase()
            if (!lastProps[name]) {
                addGlobalEvent(_name)
            }
            domEvents[_name] = val
        }
    },
    removeAttribute: function removeAttribute(dom, name) {
        dom.removeAttribute(name)
    },
    setAttribute: function setAttribute(dom, name, val) {
        dom.setAttribute(name, val)
    },
    property: function property(dom, name, val) {
        dom[name] = val
    },
}

function diffProps(nextProps, lastProps, vnode, dom) {
    // 首先更新 props
    for (let name in nextProps) {
        let val = nextProps[name]
        if (val !== lastProps[name]) {
            let hookType = getPropsHookType(name, val, vnode.type, dom)
            propsHook[hookType](dom, name, val, lastProps)
        }
    }

    for (let name in lastProps) {
        if (!nextProps.hasOwnProperty(name)) {
            let hookType = getPropsHookType(name, "", vnode.type, dom)
            propsHook[hookType](dom, name, "", lastProps)
        }
    }
}

/* ==========================================mountordiff========================================== */

function mountVnode(vnode, context, prevRendered, mountQueue) {
    let vtype = vnode.vtype
    return mountTypeDict[vtype](vnode, context, prevRendered, mountQueue)
}

// 根据 vnode.vtype 来实现 mount 或 update
let mountTypeDict = {
    0: mountText,
    1: mountElement,
    2: mountComponent,
    4: mountStateless,
    // 10: updateText,
    // 11: updateElement,
    // 12: updateComponent,
    // 14: updateStateless
}

/* ==========================================mountordiff========================================== */

/* ==========================================mount========================================== */

function mountText(vnode) {
    let node = createDOMElement(vnode)
    vnode._hostNode = node
    return node
}

function mountElement(vnode, context, prevRendered, mountQueue) {
    let type = vnode.type
    let props = vnode.props
    let ref = vnode.ref

    let dom = createDOMElement(vnode)
    vnode._hostNode = dom

    mountChildren(vnode, dom, context, mountQueue)

    if (vnode.checkProps) {
        diffProps(props, {}, vnode, dom)
    }

    if (ref) {
        pendingRefs.push(ref.bind(null, dom))
    }

    return dom
}

function mountChildren(vnode, parentNode, context, mountQueue) {
    let children = flattenVChildrenToVnode(vnode)
    for (let i = 0; i < children.length; i++) {
        let child = children[i]
        let dom = mountVnode(child, context, null, mountQueue)
        parentNode.appendChild(dom)
    }
}

function mountComponent(vnode, context, prevRendered, mountQueue) {
    let type = vnode.type,
        ref = vnode.ref,
        props = vnode.props
    let instance = new type(props, context)
    vnode._instance = instance

    if (instance.componentWillMount) {
        instance.componentWillMount()
        // todo
        // instance.state = instance.__mergeStates(props, context)
    }

    // dom element vnode
    let rendered = renderComponent.call(instance, vnode, props, context)
    instance.__mounting = true
    instance.__childContext = context

    let dom = mountVnode(rendered, context, prevRendered, mountQueue)
    vnode._hostNode = dom
    mountQueue.push(instance)
    if (ref) {
        pendingRefs.push(ref.bind(null, instance))
    }
    
    options.afterMount(instance)
    return dom
}

function renderComponent(vnode, props, context) {
    let lastOwn = CurrentOwner.cur
    CurrentOwner.cur = this
    let rendered = this.__StatelessRender ? this.__StatelessRender(props, context) : this.render()
    CurrentOwner.cur = lastOwn
    this.context = context
    this.props = props
    vnode._instance = this
    this.__current = vnode
    // ??? 这里怎么都会为 undefined
    // let dom = this.__current._hostNode
    // vnode._hostNode = dom
    vnode._renderedVnode = rendered
    return rendered
}

function mountStateless(vnode, context, prevRendered, mountQueue) {
    let type = vnode.type,
        ref = vnode.ref,
        props = vnode.props
    let instance = new Stateless(type)
    let rendered = instance.render(vnode, props, context)
    let dom = mountVnode(rendered, context, prevRendered, mountQueue)
    
    if (ref) {
        pendingRefs.push(ref.bind(null, null))
    }

    vnode._hostNode = dom
    return dom
}

/* ==========================================mount========================================== */

/* ==========================================diff========================================== */
var contextStatus = []
var contextHasChange = false

function _refeshComponent(instance, dom, mountQueue) {
    var lastProps = instance.lastProps,
        lastContext = instance.lastContext,
        lastState = instance.state,
        nextContext = instance.context,
        vnode = instance.__current,
        nextProps = instance.props
    
    lastProps = lastProps || nextProps
    var nextState = instance.__mergeStates(nextProps, nextContext)
    // ??? 为何要赋值？
    instance.props = lastProps

    instance.__renderInNext = null
    if (instance.shouldComponentUpdate && instance.shouldComponentUpdate(nextProps, nextState, nextContext) === false) {
        return dom
    }
    instance.__mounting = true
    if (instance.componentWillUpdate) {
        instance.componentWillUpdate(nextProps, nextState, nextContext)
    }
    instance.props = nextProps
    instance.state = nextState

    let lastRendered = vnode._renderedVnode
    var nextElement = instance.__next || vnode
    if (!lastRendered._hostNode) {
        lastRendered._hostNode = dom
    }
    var rendered = renderComponent.call(instance, nextElement)
    delete instance.__next

    // ??? context 部分不懂
    contextStatus.push(contextHasChange)

    let prevChildContext = instance.__childContext
    instance.__childContext = nextContext
    contextHasChange = Object.keys(prevChildContext).length === 0 +
        Object.keys(nextContext).length === 0 && prevChildContext !== nextContext

    dom = alignVnode(lastRendered, rendered, dom, nextContext, mountQueue)

    contextHasChange = contextStatus.pop()

    nextElement._hostNode = dom

    if (instance.componentDidUpdate) {
        instance.__didUpdate = true
        // ???
        instance.componentDidUpdate(lastProps, lastState, lastContext)
        if (!instance.__renderInNext) {
            instance.__didUpdate = false
        }
    }

    instance.__mounting = false

    options.afterUpdate(instance)
    if (instance.__renderInNext && mountQueue.mountAll) {
        mountQueue.push(instance);
    }
    return dom
}

/* ==========================================diff========================================== */

function render(vnode, container) {
    return renderByXjdReact(vnode, container)
}

function renderByXjdReact(vnode, container) {
    let parentContext = {}
    let mountQueue = []
    let prevRendered = null
    let rootNode = mountVnode(vnode, parentContext, prevRendered, mountQueue)
    container.appendChild(rootNode)
    container.__component = vnode
    clearRefsAndMounts(mountQueue)
    return rootNode
}

// clearRefs componentDidMount 生命周期
function clearRefsAndMounts(queue) {
    let refs = pendingRefs.slice(0)
    pendingRefs.length = 0
    refs.forEach(function(fn) {
        fn()
    })
    queue.forEach(function(instance) {
        // 只用于第一次 Mount 的时候调用，之后设为 null
        if (instance.componentDidMount) {
            instance.componentDidMount()
            instance.componentDidMount = null
        }
        instance.__mounting = false
        // 第一次 Mount 的时候 instance.__renderInNext 为 null
        while (instance.__renderInNext) {
            // todo
            _refeshComponent(instance, instance.__current._hostNode, [])
        }
        clearArray(instance.__pendingCallbacks).forEach(function(fn) {
            fn.call(instance)
        })
    })
    queue.length = 0
}

let React = {
    render: render,
    options: options,
    Component: Component,
    createElement: createElement,
}

window.React = window.ReactDOM = React
