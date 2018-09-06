var pendingRefs = []

function render(vnode, container) {
    return renderByXjdReact(vnode, container)
}

function renderByXjdReact(vnode, container) {
    var parentContext = {}
    var mountQueue = []
    var rootNode = genVnodes(vnode, container, parentContext, mountQueue)
    container.__component = vnode
    // clearRefs componentDidMount 生命周期
    clearRefsAndMounts(mountQueue)
    return rootNode
}

function clearRefsAndMounts(queue) {
    var refs = pendingRefs.slice(0)
    pendingRefs.length = 0
    queue.forEach(function(instance) {
        if (instance.componentDidMount) {
            instance.componentDidMount()
            instance.componentDidMount = null
        }
        instance.__mounting = false
        while (instance.__renderInNext) {
            _refeshComponent(instance, instance.__current._hostNode, [])
        }
    })
}