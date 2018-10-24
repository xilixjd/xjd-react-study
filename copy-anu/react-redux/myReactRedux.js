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

var hasOwn = Object.prototype.hasOwnProperty;

function is(x, y) {
    if (x === y) {
        return x !== 0 || y !== 0 || 1 / x === 1 / y;
    } else {
        return x !== x && y !== y;
    }
}

function shallowEqual(objA, objB) {
    if (is(objA, objB)) return true;

    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
        return false;
    }

    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (var i = 0; i < keysA.length; i++) {
        if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
        return false;
        }
    }

    return true;
}

function strictEqual(a, b) {
    return a === b;
}

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

function pureFinalPropsSelectorFactory(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    dispatch,
    options
) {
    let hasRunAtLeastOnce = false
    let state
    let ownProps
    let stateProps
    let dispatchProps
    let mergedProps

    function handleFirstCall(firstState, firstOwnProps) {
        state = firstState
        ownProps = firstOwnProps
        stateProps = mapStateToProps(state, ownProps)
        dispatchProps = mapDispatchToProps(dispatch, ownProps)
        mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
        hasRunAtLeastOnce = true
        return mergedProps
    }

    function handleSubsequentCalls(nextState, nextOwnProps) {
        // nextState 是 redux 的全局 state
        // 感觉做这些判断的唯一意义就是少调用一些 mapStateToProps？
        // 所以也可以粗暴的直接全部 merge
        const propsChanged = !shallowEqual(nextOwnProps, ownProps)
        const stateChanged = !strictEqual(nextState, state)
        state = nextState
        ownProps = nextOwnProps
        // props 改变了，说明依赖 ownProps 的方法全要改变
        // state 改变了，说明一定要调用 mapStateToProps
        if (propsChanged && stateChanged) return handleNewPropsAndNewState()
        if (propsChanged) return handleNewProps()
        if (stateChanged) return handleNewState()
        return mergedProps
    }

    function handleNewPropsAndNewState() {
        stateProps = mapStateToProps(state, ownProps)
        if (mapDispatchToProps.dependsOnOwnProps) {
            dispatchProps = mapDispatchToProps(dispatch, ownProps)
        }
        mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
        return mergedProps
    }

    function handleNewProps() {
        if (mapStateToProps.dependsOnOwnProps) {
            stateProps = mapStateToProps(state, ownProps)
        }
        if (mapDispatchToProps.dependsOnOwnProps) {
            dispatchProps = mapDispatchToProps(dispatch, ownProps)
        }
        mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
        return mergedProps
    }

    function handleNewState() {
        const nextStateProps = mapStateToProps(state, ownProps)
        const statePropsChanged = !shallowEqual(nextStateProps, stateProps)
        stateProps = nextStateProps
        if (statePropsChanged) {
            mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
        }
        return mergedProps
    }

    return function pureFinalPropsSelector(nextState, nextOwnProps) {
        return hasRunAtLeastOnce
            ? handleSubsequentCalls(nextState, nextOwnProps)
            : handleFirstCall(nextState, nextOwnProps)
    }
}

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

function makeSelectorStateful(sourceSelector, store) {
    const selector = {
        run: function runComponentSelector(props) {
            try {
                const nextProps = sourceSelector(store.getState(), props)
                if (nextProps !== selector.props || selector.error) {
                    selector.shouldComponentUpdate = true
                    selector.props = nextProps
                    selector.error = null
                }
            } catch (error) {
                selector.shouldComponentUpdate = true
                selector.error = error
            }
        }
    }
    return selector
}

function connectAdvanced(
    selectFactory,
    {
        // 相当于默认参数，没有才是 true
        shouldHandleStateChanges = true,
        withRef = false,
        ...connectOptions
    } = {}
) {
    // 需引入 PropTypes
    // const contextTypes = {
    //     store: PropTypes.Object
    // }
    return function wrapWthConnect(WrappedComponent) {
        const selectFactoryOptions = {
            shouldHandleStateChanges,
            withRef,
            WrappedComponent,
            ...connectOptions
        }

        class Connect extends Component {
            constructor(props, context) {
                super(props, context)
                this.state = {}
                // 由 Provider 组件传来
                this.store = context["store"]

                this.initSelector()
                this.initSubscription()
            }

            initSelector() {
                const sourceSelector = selectFactory(this.store.dispatch, selectFactoryOptions)
                this.selector = makeSelectorStateful(sourceSelector, this.store)
                this.selector.run(this.props)
            }

            initSubscription() {

            }

        }
    }
}