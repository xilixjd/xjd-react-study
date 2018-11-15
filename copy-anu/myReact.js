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

function getChildContext(instance, context) {
    if (instance.getChildContext) {
        return Object.assign({}, context, instance.getChildContext());
    }
    return context;
}

Component.prototype = {
    setState: function setState(state, cb) {
        setStateImpl.call(this, state, cb)
    },
    forceUpdate: function forceUpdate(cb) {
        setStateImpl.call(this, true, cb)
    },
    __mergeStates: function __mergeStates(nextProps, nextContext) {
        let length = this.__pendingStates.length
        if (length === 0) {
            return this.state
        }
        let states = clearArray(this.__pendingStates)
        let nextStates = Object.assign({}, this.state)
        for (var i = 0; i < length; i++) {
            var state = states[i]
            var nextState = typeNumber(state) === 5 ? state.call(this, nextStates, nextProps, nextContext) : state
            Object.assign(nextStates, nextState)
        }
        return nextStates
    },
    render: function render() {}
}

// class Component {
//     constructor(props, context) {
//         CurrentOwner.cur = this
//         this.context = context;
//         this.props = props;
//         this.refs = {};
//         this.state = null
//         this.__pendingCallbacks = [];
//         this.__pendingStates = [];
//         this.__current = {}
//     }

//     setState(state, cb) {
//         setStateImpl.call(this, state, cb)
//     }
//     __mergeStates(nextProps, nextContext) {
//         let length = this.__pendingStates.length
//         if (length === 0) {
//             return this.state
//         }
//         let states = clearArray(this.__pendingStates)
//         let nextStates = Object.assign({}, this.state)
//         for (var i = 0; i < length; i++) {
//             var state = states[i]
//             var nextState = typeNumber(state) === 5 ? state.call(this, nextStates, nextProps, nextContext) : state
//             Object.assign(nextStates, nextState)
//         }
//         return nextStates
//     }
//     render() {}
// }

function setStateImpl(state, cb) {
    if (typeNumber(cb) === 5) {
        this.__pendingCallbacks.push(cb)
    }
    if (state === true) {
        this.__forceUpdate = true
    } else {
        this.__pendingStates.push(state)
    }

    let hasDom = this.__current._hostNode
    if (!hasDom) {
        //组件挂载期，willMount 时会调用
        if (this.__mounting) {
            // ??? 这里没找到场景，简单来说是 bug，在新版本 anu 中被修复
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
            // 合并在 componentDidMount 中重复调用的 setState
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
/* ==========================================/Component========================================== */

/* ==========================================createElement========================================== */
let CurrentOwner = {
    cur: null
}

/**
 *  调用 render() 函数的时候必然会调用 createElement，因为含有 JSX 语法
 */
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

/**
 * 该函数主要用于将由 babel 转换而来的 vnode 数组进行转换
 * 转换诸如子数组平铺到最终数组中，还有就是将文字合并并转换为 text 节点
 * @param {vnode 数组} original
 * @param {是否合并} convert
 */
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
        // 这里写一般的页面找不到子数组的场景
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
                // +++ React 都不支持该类型
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

function cloneElement(vnode, props) {
    if (Array.isArray(vnode)) {
        vnode = vnode[0];
    }
    if (!vnode.vtype) {
        return Object.assign({}, vnode);
    }
    var configs = {
        key: vnode.key,
        ref: vnode.ref
    };
    var owner = vnode._owner;
    var lastOwn = CurrentOwner.cur;
    if (props && props.ref) {
        owner = lastOwn;
    }
    Object.assign(configs, vnode.props, props);
    CurrentOwner.cur = owner;
    var ret = createElement(vnode.type, configs, arguments.length > 2 ? [].slice.call(arguments, 2) : configs.children);
    CurrentOwner.cur = lastOwn;
    return ret;
}
/* ==========================================/createElement========================================== */


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

function insertDOM(parentNode, dom, child) {
    if (!child) {
        parentNode.appendChild(dom)
    } else {
        parentNode.insertBefore(dom, child)
    }
}

function removeDOMElement(node) {
    if (node.nodeType === 1) {
        node.textContent = ""
    }
    node.__events = null
    let fragment = document.createDocumentFragment()
    // ??? 靠这个方法删除父节点中的子节点 node
    fragment.appendChild(node)
    fragment.removeChild(node)
    node = null
}

// 对比对象是否相等
function objectCompare(obj1, obj2) {
    let obj1Stringfy
    let obj2Stringfy
    try {
        obj1Stringfy = JSON.stringify(obj1)
    } catch (e) {
        console.log("第一个参数不是对象")
        return true
    }
    try {
        obj2Stringfy = JSON.stringify(obj2)
    } catch (e) {
        console.log("第二个参数不是对象")
        return true
    }
    return obj1Stringfy !== obj2Stringfy
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

function checkRenderNull(vnode, type) {
    if (vnode === null || vnode === false) {
        return { type: "#comment", text: "empty", vtype: 0 }
    }
    return vnode
}

/**
 * 是空对象，返回 0，不是，返回 1
 * @param {对象} obj 
 */
function isEmpty(obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            return 1;
        }
    }
    return 0;
}

function isValidElement(vnode) {
    return vnode && vnode.vtype
}
/* ==========================================/util========================================== */

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
        // +++
        this.defaultPrevented = true
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
/* ==========================================/event========================================== */

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
    10: updateText,
    11: updateElement,
    12: updateComponent,
    14: updateStateless
}

/* ==========================================/mountordiff========================================== */

/* ==========================================mount========================================== */

function mountText(vnode) {
    let node = createDOMElement(vnode)
    vnode._hostNode = node
    return node
}

/**
 * 注意到这个函数用来 mount 虚拟 dom 节点，而不是组件
 */
function mountElement(vnode, context, prevRendered, mountQueue) {
    let type = vnode.type
    let props = vnode.props
    let ref = vnode.ref

    let dom = createDOMElement(vnode)
    vnode._hostNode = dom

    mountChildren(vnode, dom, context, mountQueue)

    if (vnode.checkProps) {
        // 这里的 props 也是 dom 元素上的属性（style, onclick 事件等）
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
    var lastOwn = CurrentOwner.cur
    // 这里对应的是组件的 instructor 中的 instructor(props, context)
    // instance 在这里是组件的实例，总结起来就是 vnode 属于虚拟 dom
    // 而在调用组件中一些方法及渲染时，却是在框架中定义一个组件的实例去完成
    let instance = new type(props, context)
    CurrentOwner.cur = lastOwn
    vnode._instance = instance

    // 需要对未调用 super(props, context) 的组件进行重新赋值
    instance.context = instance.context || context
    instance.props = instance.props || props

    if (instance.componentWillMount) {
        instance.componentWillMount()
        instance.state = instance.__mergeStates(props, context)
    }

    // dom element vnode
    let rendered = renderComponent.call(instance, vnode, props, context)
    instance.__mounting = true
    let childContext = rendered.vtype ? getChildContext(instance, context) : context;
    instance.__childContext = context

    let dom = mountVnode(rendered, childContext, prevRendered, mountQueue)
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
    // 用以对 null 节点做处理，不能让其返回 null，还得给他赋一个虚拟 dom
    rendered = checkRenderNull(rendered, vnode.type)
    CurrentOwner.cur = lastOwn
    // this 为 instance（组件实例）
    // 其实这几步有点重复
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
    vnode._instance = instance
    return dom
}

/* ==========================================/mount========================================== */

/* ==========================================diff========================================== */
var contextStatus = []
var contextHasChange = false

function refreshComponent(instance, mountQueue) {
    let dom = instance.__current._hostNode
    dom = _refreshComponent(instance, dom, mountQueue)
    // ??? 这里有必要？
    // while (instance.__renderInNextCycle) {
    //     dom = _refreshComponent(instance, dom, mountQueue);
    // }

    clearArray(instance.__pendingCallbacks).forEach(function(fn) {
        fn.call(instance)
    })

    return dom
}

function _refreshComponent(instance, dom, mountQueue) {
    let lastProps = instance.lastProps,
        lastContext = instance.lastContext,
        lastState = instance.state,
        nextContext = instance.context,
        vnode = instance.__current,
        nextProps = instance.props
    
    lastProps = lastProps || nextProps
    let nextState = instance.__mergeStates(nextProps, nextContext)
    // ??? 为何要赋值？
    instance.props = lastProps

    instance.__renderInNext = null
    if (!instance.__forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(nextProps, nextState, nextContext) === false) {
        instance.__forceUpdate = false
        return dom
    }
    instance.__mounting = true
    instance.__forceUpdate = false
    if (instance.componentWillUpdate) {
        instance.componentWillUpdate(nextProps, nextState, nextContext)
    }
    instance.props = nextProps
    instance.state = nextState

    let lastRendered = vnode._renderedVnode
    let nextElement = instance.__next || vnode
    if (!lastRendered._hostNode) {
        lastRendered._hostNode = dom
    }
    let rendered = renderComponent.call(instance, nextElement, nextProps, nextContext)
    delete instance.__next
    let childContext = rendered.vtype ? getChildContext(instance, nextContext) : nextContext

    // ??? context 部分不懂
    contextStatus.push(contextHasChange)

    let prevChildContext = instance.__childContext
    instance.__childContext = childContext
    // let a = Object.keys(prevChildContext).length !== 0
    // let b = Object.keys(childContext).length !== 0
    // 是空对象返回 0
    let a = isEmpty(prevChildContext)
    let b = isEmpty(childContext)
    // 不等于为 true
    let c = objectCompare(prevChildContext, childContext)
    // 如果两个context都为空对象，就不比较引用，认为它们没有变
    contextHasChange = a + b && c

    dom = alignVnode(lastRendered, rendered, dom, childContext, mountQueue)

    contextHasChange = contextStatus.pop()

    nextElement._hostNode = dom

    if (instance.componentDidUpdate) {
        instance.__didUpdate = true
        instance.componentDidUpdate(lastProps, lastState, lastContext)
        // ???
        if (!instance.__renderInNext) {
            instance.__didUpdate = false
        }
    }

    instance.__mounting = false

    options.afterUpdate(instance)
    // ??? instance.__renderInNext 在上面就已经赋为 null 了
    if (instance.__renderInNext && mountQueue.mountAll) {
        mountQueue.push(instance)
    }
    return dom
}

function updateVnode(lastVnode, nextVnode, context, mountQueue) {
    return mountTypeDict[lastVnode.vtype + 10](lastVnode, nextVnode, context, mountQueue)
}

function updateText(lastVnode, nextVnode) {
    let dom = lastVnode._hostNode
    nextVnode._hostNode = dom
    if (lastVnode.text !== nextVnode.text) {
        dom.nodeValue = nextVnode.text
    }
    return dom
}

function updateElement(lastVnode, nextVnode, context, mountQueue) {
    let dom = lastVnode._hostNode
    let lastProps = lastVnode.props
    let nextProps = nextVnode.props
    let ref = nextVnode.ref
    nextVnode._hostNode = dom
    updateChildren(lastVnode, nextVnode, nextVnode._hostNode, context, mountQueue)
    if (lastVnode.checkProps || nextVnode.checkProps) {
        diffProps(nextProps, lastProps, nextVnode, dom)
    }
    if (ref) {
        pendingRefs.push(ref.bind(null, dom))
    }
    return dom
}

/**
 * 只适用于同样的 component props 变化时才调用
 * @param {*} lastVnode 
 * @param {*} nextVnode 
 * @param {*} context 
 * @param {*} mountQueue 
 */
function updateComponent(lastVnode, nextVnode, context, mountQueue) {
    let instance = nextVnode._instance = lastVnode._instance
    // 在 refreshComponent 里用
    instance.__next = nextVnode
    let nextProps = nextVnode.props
    instance.lastProps = instance.props // lastVnode.props
    instance.lastContext = instance.context

    if (instance.componentWillReceiveProps) {
        instance.__receiving = true
        instance.componentWillReceiveProps(nextProps, context)
        instance.__receiving = false
    }

    instance.props = nextProps
    instance.context = context
    if (nextVnode.ref) {
        pendingRefs.push(nextVnode.ref.bind(null, instance))
    }

    return refreshComponent(instance, mountQueue)
}

function updateStateless(lastTypeVnode, nextTypeVnode, context, mountQueue) {
    let instance = lastTypeVnode._instance
    let lastVnode = lastTypeVnode._renderedVnode
    let nextVnode = instance.render(nextTypeVnode, nextTypeVnode.props, context)
    let dom = alignVnode(lastVnode, nextVnode, lastVnode._hostNode, context, mountQueue)
    nextTypeVnode._hostNode = dom
    return dom
}

/**
 * 当移动节点时是不对比的，如倒转顺序，也就是顺序变化有可能会导致重新渲染，但是这种渲染场景并不多
 * @param {*} lastVnode 
 * @param {*} nextVnode 
 * @param {*} parentNode 
 * @param {*} context 
 * @param {*} mountQueue 
 */
function updateChildren(lastVnode, nextVnode, parentNode, context, mountQueue) {
    let lastChildren = lastVnode.vchildren
    let nextChildren = flattenVChildrenToVnode(nextVnode)
    let childNodes = parentNode.childNodes
    let mountAll = mountQueue.mountAll
    // 若 nextChildren 长度为 0，则将旧节点全部删除
    if (nextChildren.length === 0) {
        lastChildren.forEach(function(lastChild) {
            let node = lastChild._hostNode
            if (node) {
                removeDOMElement(node)
            }
            disposeVnode(lastChild)
        })
        return
    }
    let hashCode = {}
    lastChildren.forEach(function(lastChild) {
        let key = lastChild.type + (lastChild.key || "")
        let list = hashCode[key]
        if (list) {
            list.push(lastChild)
        } else {
            hashCode[key] = [lastChild]
        }
    })
    nextChildren.forEach(function(nextChild) {
        let key = nextChild.type + (nextChild.key || "")
        let list = hashCode[key]
        if (list) {
            let old = list.shift()
            if (old) {
                // 将 nextChild 设一个 key 为 old，方便之后的对比
                nextChild.old = old
                if (!list.length) {
                    delete hashCode[key]
                }
            }
        }
    })
    for (let key in hashCode) {
        let list = hashCode[key]
        if (Array.isArray(list)) {
            list.forEach(function(lastChild) {
                let node = lastChild._hostNode
                if (node) {
                    removeDOMElement(node)
                }
                disposeVnode(lastChild)
            })
        }
    }
    nextChildren.forEach(function(el, index) {
        let old = el.old,
            child,
            dom,
            queue = mountAll ? mountQueue : []
        if (old) {
            delete el.old
            if (el === old && old._hostNode && !contextHasChange) {
                dom = old._hostNode
            } else {
                dom = updateVnode(old, el, context, queue)
            }
        } else {
            dom = mountVnode(el, context, null, queue)
        }
        child = childNodes[index]
        if (dom !== child) {
            insertDOM(parentNode, dom, child)
        }
        // mount 带来的 mountQueue 不能进入，这里 queue.length 只会在上面的 mountVnode 触发才会 push
        // 而 diff 的时候只会在 diff new component 的时候才会 mountVnode 中 mountComponent，再 push 一个 component
        // 不做这一步，新 component 的 componentDidMount 生命周期都不会进入
        if (!mountAll && queue.length) {
            debugger
            clearRefsAndMounts(queue)
        }
    })

}

function alignVnode(lastVnode, nextVnode, node, context, mountQueue) {
    var dom = node
    // ??? 这里只会出现 div 等 dom (vtype 只能等于 1)？
    // 没找到场景。。
    if (lastVnode.type !== nextVnode.type || lastVnode.key !== nextVnode.key) {
        debugger
        disposeVnode(lastVnode)
        dom = mountVnode(nextVnode, context, null, mountQueue)
        var parent = node.parentNode
        if (parent) {
            parent.replaceChild(dom, node)
            removeDOMElement(node)
        }
        clearRefsAndMounts(mountQueue)
    } else {
        // ??? 这里需要判断一下 lastVnode 和 nextVnode 是否相等，然而基本无法判断
        dom = updateVnode(lastVnode, nextVnode, context, mountQueue)
    }
    return dom
}

function disposeVnode(vnode) {
    if (!vnode || vnode._disposed) {
        return
    }
    switch (vnode.vtype) {
        case 1:
            disposeElement(vnode)
            break
        case 2:
            disposeComponent(vnode)
            break
        case 4:
            disposeStateless(vnode)
            break
    }
    vnode._disposed = true
}

function disposeElement(vnode) {
    let vchildren = vnode.vchildren
    for (let i = 0; i < vchildren.length; i++) {
        disposeVnode(vchildren[i])
    }
    vnode.ref && vnode.ref(null)
}

function disposeComponent(vnode) {
    let instance = vnode._instance
    if (instance) {
        options.beforeUnmount(instance)
        if (instance.componentWillUnMount) {
            instance.componentWillUnMount()
        }
        let dom = instance.__current._hostNode
        if (dom) {
            dom.__current = null
        }
        vnode.ref && vnode.ref(null)
        instance.setState = instance.forceUpdate = nullFunc
        vnode._instance = instance.__current = instance.__renderInNext = null
        disposeVnode(vnode._renderedVnode)
    }
}

function disposeStateless(vnode) {
    let instance = vnode._instance
    if (instance) {
        disposeVnode(instance._renderedVnode)
        vnode._instance = null
    }
}
/* ==========================================/diff========================================== */

function render(vnode, container) {
    return renderByXjdReact(vnode, container)
}

function renderByXjdReact(vnode, container) {
    let parentContext = {}
    let mountQueue = []
    // 在 render 的时候需要给 mountQueue 加 mountAll 的属性，这样都后面
    mountQueue.mountAll = true
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
            _refreshComponent(instance, instance.__current._hostNode, [])
        }
        clearArray(instance.__pendingCallbacks).forEach(function(fn) {
            fn.call(instance)
        })
    })
    queue.length = 0
}

// 为 react-redux, react-router 服务
var Children = {
    only: function only(children) {
        //only方法接受的参数只能是一个对象，不能是多个对象（数组）。
        if (Array.isArray(children)) {
            children = children[0];
        }
        if (children && children.vtype) return children;
        throw new Error('expect only one child');
    },
    count: function count(children) {
        return _flattenChildren(children, false).length;
    },
    forEach: function forEach(children, callback, context) {
        _flattenChildren(children, false).forEach(callback, context);
    },
    map: function map(children, callback, context) {
        return _flattenChildren(children, false).map(callback, context);
    },

    toArray: function toArray(children) {
        return _flattenChildren(children, false);
    }
}

let React = {
    render: render,
    options: options,
    Component: Component,
    createElement: createElement,
    cloneElement: cloneElement,
    isValidElement: isValidElement,
    Children: Children
}

// 为 react-redux 服务
window.react = window.React = window.ReactDOM = React
