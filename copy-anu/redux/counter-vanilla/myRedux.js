let Redux = (function() {
    let ActionTypes = {
        INIT: "@@myRedux/INIT"
    }

    function createStore(reducer, preloadedState, enhancer) {
        if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
            enhancer = preloadedState
            preloadedState = undefined
        }
        if (enhancer) {
            return enhancer(createStore)(reducer, preloadedState)
        }

        if (typeof reducer !== "function") {
            throw new Error("reducer 必须为 function!")
        }

        let currentReducer = reducer
        let currentState = preloadedState
        let currentListeners = []
        let nextListeners = currentListeners
        let isDispatching = false

        // 为了在 unsubscribe 的时候，不会清除掉 currentListeners 的 listener
        function ensureCanMutateNextListeners() {
            if (nextListeners === currentListeners) {
                nextListeners = currentListeners.slice()
            }
        }

        function getState() {
            return currentState
        }

        function subscribe(listener) {
            if (typeof listener !== "function") {
                throw new Error("listner 必须为 function!")
            }
            
            let isSubscribed = true
            ensureCanMutateNextListeners()
            nextListeners.push(listener)

            return function unsubscribe() {
                if (!isSubscribed) {
                    return
                }
                isSubscribed = false

                ensureCanMutateNextListeners()
                let index = nextListeners.indexOf(listener)
                nextListeners.splice(index, 1)
            }
        }

        function dispatch(action) {
            if (typeof action.type === "undefined") {
                throw new Error(`需要为 action 设置 "type" 属性!`)
            }

            if (isDispatching) {
                throw new Error(`不能 dispatch 此 action：${action}`)
            }

            try {
                isDispatching = true
                currentState = currentReducer(currentState, action)
            } finally {
                isDispatching = false
            }

            let listeners = currentListeners = nextListeners
            for (let i = 0; i < listeners.length; i++) {
                let listener = listeners[i]
                listener()
            }

            return action
        }

        dispatch({ type: ActionTypes.INIT })

        return {
            dispatch,
            subscribe,
            getState,
        }
    }

    function combineReducers(reducers) {
        let finalReducers = {}
        for (let key in reducers) {
            if (reducers.hasOwnProperty(key)) {
                let reducer = reducers[key]
                if (typeof reducer === "function") {
                    finalReducers[key] = reducer
                } else {
                    throw new Error("reducer 必须要为 function!")
                }
            }
        }
        let finalReducersKeys = Object.keys(finalReducers)

        return function combination(state = {}, action) {
            // let hasChanged = false
            let nextState = {}
            for (let i = 0; i < finalReducersKeys.length; i++) {
                let key = finalReducersKeys[i]
                let reducer = finalReducers[key]
                let previousStateForKey = state[key]
                let nextStateForKey = reducer(previousStateForKey, action)
                nextState[key] = nextStateForKey
                // 这里我觉得没必要判断，因为 nextStateForKey 为对象的话必然是不相等
                // 就算是相等的，那比较一下又有什么意义呢
                // hasChanged = hasChanged || nextStateForKey !== previousStateForKey
            }
            // return hasChanged ? nextState : state
            return nextState
        }
    }

    function applyMiddleware(...middlewares) {
        return (createStore) => (reducer, preloadedState, enhancer) => {
            let store = createStore(reducer, preloadedState, enhancer)
            let dispatch = store.dispatch
            let chain = []

            let middlewareAPI = {
                getState: store.getState,
                dispatch: (action) => {
                    return dispatch(action)
                }
            }

            chain = middlewares.map((middleware) => {
                return middleware(middlewareAPI)
            })
            composeFunc = compose(...chain)
            dispatch = composeFunc(store.dispatch)

            return {
                ...store,
                dispatch
            }
        }
    }

    function bindActionCreator(actionCreator, dispatch) {
        return function(...args) {
            return dispatch(actionCreator(...args))
        }
    }

    function bindActionCreators(actionCreators, dispatch) {
        if (typeof actionCreators === "function") {
            return bindActionCreator(actionCreators, dispatch)
        }

        const keys = Object.keys(actionCreators)
        const boundAcrionCreators = {}
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            const actionCreator = actionCreators[key]
            if (typeof actionCreator === "function") {
                boundAcrionCreators[key] = bindActionCreator(actionCreator, dispatch)
            }
        }
        return boundAcrionCreators
    }

    function compose(...funcs) {
        // 传什么 return 什么
        if (funcs.length === 0) {
            return arg => arg
        }
        // 只有一个 func 相当于没用 compose
        if (funcs.length === 1) {
            return funcs[0]
        }
        return funcs.reduce((a, b) => (...args) => a(b(...args)))
    }

    return {
        createStore,
        combineReducers,
        applyMiddleware,
        bindActionCreators,
        compose,
    }

})()