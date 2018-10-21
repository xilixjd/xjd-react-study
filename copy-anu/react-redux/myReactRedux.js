/**
 * 1.HOC 组件会丢失 ref，因此有个参数为 withRef
 * 2.HOC 组件上面绑定的 Static 方法会丢失，解决办法用 hoist-non-react-statics
 * 参考文章：https://segmentfault.com/a/1190000008112017?_ea=1553893
 * 
 * react-redux 会在高阶组件（Connect组件）中的 constructor 调用 initSelector，用来生成一个 selector，此 selector
 * 包含了 mapStateToProps, mapDispatchToProps, mergeProps, dispatch, options 这些参数，用来根据 connect 函数
 * 传递的参数，来提供合适的 mapStateToProps 等的方法，如有时没有 mapStateToProps，有时用户将 pure 设为 false（默认为 true）。
 * 此外 selector 还会缓存经过 mapStateToProps 和 mapDispatchToProps 计算后组件的 props，selector.props = nextProps。
 * selector 还需要对 react 的 shouldComponentUpdate 等生命周期来进行重新封装，猜想是需要对被包裹的组件的生命周期进行应用
 */

function getDependsOnOwnProps(mapToProps) {
    return mapToProps.length !== 1
}

function wrapMapToPropsConstant(getConstant) {
    return function initConstantSelector(dispatch, options) {
        const constant = getConstant(dispatch, options)

        function constantSelector() { return constant}
        constantSelector.dependsOnOwnProps = true
        return constantSelector
    }
}

function wrapMapToPropsFunc(mapToProps) {
    return function initProxySelecor() {
        // 这里不考虑 mapStateToProps 或 mapDispatchToProps return 为 function 的情况
        const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
            return proxy.dependsOnOwnProps
                ? mapToProps(stateOrDispatch, ownProps)
                : mapToProps(stateOrDispatch)
        }
        proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)

        return proxy
    }
}

function getInitMapStateToPropsWrap(mapStateToProp) {
    return mapStateToProp ? wrapMapToPropsFunc(mapStateToProp) : wrapMapToPropsConstant(() => ({}))
}

function getInitMapDispatchToPropsWrap(mapDispatchToProps) {
    // 这里不考虑 mapDispatchToProps 是 object 的情况
    return mapDispatchToProps 
            ? wrapMapToPropsFunc(mapDispatchToProps) 
            : wrapMapToPropsConstant((dispatch) => ({ dispatch }))
}

function pureFinalPropsSelectorFactory()

function selectFactory(dispatch, {
    initMapStateToPropsWrap,
    initMapDispatchToPropsWrap,
    initMergePropsWrap,
    ...options
}) {
    const mapStateToProps = initMapStateToPropsWrap(dispatch)
    const mapDispatchToProps = initMapDispatchToPropsWrap(dispatch)
    const mergeProps = initMergePropsWrap(dispatch)

    return pureFinalPropsSelectorFactory(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps,
        dispatch,
        options
    )
}

function connect(mapStateToProps, mapDispatchToProps, mergeProps, extraOptions = {}) {
    // mapStateToProps 或 mapDispatchToProps 的返回不能为 function
    // 输入参数 mergeProps 不做处理
    const initMapStateToPropsWrap = getInitMapStateToPropsWrap(mapStateToProps)
    const initMapDispatchToPropsWrap = getInitMapDispatchToPropsWrap(mapDispatchToProps)
    const initMergePropsWrap = function() {
        return function defaultMergeProps(stateProps, dispatchProps, ownProps) {
            return {
                ...ownProps,
                ...stateProps,
                ...dispatchProps
            }
        }
    }

    return connectAdvanced(selectFactory, {
        shouldHandleStateChanges: Boolean(mapStateToProps),
        initMapStateToPropsWrap,
        initMapDispatchToPropsWrap,
        initMergePropsWrap,
        ...extraOptions
    })
}