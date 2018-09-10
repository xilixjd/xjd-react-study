function createDOMElement(vnode) {
    var type = vnode.type
    var dom
    if (type === "#text") {
        dom = document.createTextNode(vnode.text)
    } else if (type === "#comment") {
        dom = document.createComment(vnode.text)
    } else {
        dom = document.createElement(type)
    }
    return dom
}

/* ==========================================util========================================== */
// 对比对象是否相等
function objectCompare(obj1, obj2) {
    var obj1Stringfy
    var obj2Stringfy
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

var numberMap = {
    //null undefined IE6-8这里会返回[object Object]
    "[object Boolean]": 2,
    "[object Number]": 3,
    "[object String]": 4,
    "[object Function]": 5,
    "[object Symbol]": 6,
    "[object Array]": 7
  };
  
// undefined: 0, null: 1, boolean:2, number: 3, string: 4, function: 5, array: 6, object:8
function typeNumber(data) {
    if (data === null) {
        return 1;
    }
    if (data === void 666) {
        return 0;
    }
    var a = numberMap[Object.prototype.toString.call(data)];
    return a || 8;
}
/* ==========================================util========================================== */

/* ==========================================event========================================== */
var globalEventsDict = {}

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

function dispatchEvent(e) {
    e = new SyntheticEvent(e)
    var eventType = e.type
    if (eventType === "click") {
        if (e.target.disabled) {
            return
        }
    }
    var paths = collectPaths(e.target, end || document)
    var captured = eventType + "capture"

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
    var paths = []
    while (from !== end && from.nodeType === 1) {
        var events = from.__events
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
    for (var i = paths.length - 1; i >= 0; i--) {
        var path = paths[i]
        var fn = path.events[eventType]
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
    for (var i in event) {
        if (!eventProto[i]) {
            this[i] = event[i]
        }
    }
    if (!this.target) {
        this.target = event.srcElement
    }
    this.nativeEvent = event
}

var eventProto = SyntheticEvent.prototype = {
    fixEvent: function fixEvent() {},
    preventDefault: function preventDefault() {
        var e = this.nativeEvent || {}
        e.returnValue = this.returnValue = false
        if (e.preventDefault) {
            e.preventDefault()
        }
    },
    fixHooks: function fixHooks() {},
    stopPropagation: function stopPropagation() {
        var e = this.nativeEvent || {}
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



var specialProps = {
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

var propsHook = {
    children: nullFunc,
    className: function className(dom, _, val) {
        dom.className = val
    },
    property: function property(dom, name, val) {
        dom[name] = val
    },
    removeAttribute: function removeAttribute(dom, name) {
        dom.removeAttribute(name)
    },
    setAttribute: function setAttribute(dom, name, val) {
        dom.setAttribute(name, val)
    },
    style: function style(dom, _, val, lastProps) {
        var oldStyle = lastProps.style || {}
        var newStyle = val || {}
        if (objectCompare(oldStyle, newStyle) === true) {
            return
        }
        for (var name in newStyle) {
            var val = newStyle[name]
            if (val !== oldStyle[name]) {
                if (/^-?\d+(\.\d+)?$/.test(val)) {
                    val += "px"
                }
                dom.style[name] = val
            }
        }
        // 旧样式中存在，新样式没有的，需要清除
        for (var name in oldStyle) {
            if (!(name in newStyle)) {
                dom.style[name] = ""
            }
        }
    },
    __event__: function __event__(dom, name, val, lastProps) {
        var domEvents = dom.__events || (dom.__events = {})
        if (!val) {
            delete domEvents[name.slice(2)]
        } else {
            // vnode 第一次 mount 的时候没有这个事件，则要绑定全局事件
            // 然而当 update 来 diffProps 时，lastProps 与第一次 mount 的事件一致时
            // 不用
            var _name = name.slice(2).toLowerCase()
            if (!lastProps[name]) {
                addGlobalEvent(_name)
            }
            domEvents[_name] = val
        }
    }
}

function diffProps(nextProps, lastProps, vnode, dom) {
    // 首先更新 props
    for (var name in nextProps) {
        var val = nextProps[name]
        if (val !== lastProps[name]) {
            
        }
    }
}

var pendingRefs = []

var dirtyComponent = []

var nullFunc = function() {}

var option = {
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

function mountVnode(vnode, context, prevRendered, mountQueue) {
    var vtype = vnode.vtype
    mountTypeDict[vtype](vnode, context, prevRendered, mountQueue)
}

// 根据 vnode.vtype 来实现 mount 或 update
var mountTypeDict = {
    0: mountText,
    1: mountElement,
    2: mountComponent,
    4: mountStateless,
    // 10: updateText,
    // 11: updateElement,
    // 12: updateComponent,
    // 14: updateStateless
}

function mountText(vnode) {
    var node = createDOMElement(vnode)
    vnode._hostNode = node
    return node
}

function mountElement(vnode, context) {
    var type = vnode.type
    var props = vnode.props
    var ref = vnode.ref

    var dom = createDOMElement(vnode)
    vnode._hostNode = dom

    mountChildren(vnode, dom, context)
    if (vnode.checkProps) {
        diffProps(props, {}, vnode, dom)
    }
    if (ref) {
        pendingRefs.push(ref.bind(0, dom))
    }

    return dom
}

function render(vnode, container) {
    return renderByXjdReact(vnode, container)
}

function renderByXjdReact(vnode, container) {
    var parentContext = {}
    var mountQueue = []
    var prevRendered = null
    var rootNode = mountVnode(vnode, parentContext, prevRendered, mountQueue)
    container.appendChild(rootNode)
    container.__component = vnode
    clearRefsAndMounts(mountQueue)
    return rootNode
}

// clearRefs componentDidMount 生命周期
function clearRefsAndMounts(queue) {
    var refs = pendingRefs.slice(0)
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
        while (instance.__renderInNext) {
            _refeshComponent(instance, instance.__current._hostNode, [])
        }
    })
    queue.length = 0
}

