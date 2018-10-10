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
            let hasChanged = false
            
        }
    }

})()