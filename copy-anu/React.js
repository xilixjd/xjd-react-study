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

    },
    __event__: function __event__(dom, name, val, lastProps) {
        
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

