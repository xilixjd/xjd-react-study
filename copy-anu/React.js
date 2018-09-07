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
    return 
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

