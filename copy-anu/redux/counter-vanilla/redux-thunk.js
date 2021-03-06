
function createThunkMiddleware(extraArgument) {
  // middleware(middlewareAPI)
  return function middleware(middlewareAPI) {
    var dispatch = middlewareAPI.dispatch,
        getState = middlewareAPI.getState;
    return function thunk (next) {
      // 调用 store.dispatch 时即为此匿名 function
      return function thunkReturn(action) {
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }
        // next 在 applyMiddleware 中即 dispatch，然而也有可能是 compose 之后 function(action)...
        // 例如 myThunkMiddleware 中的 next 就为此处的匿名的 function(action)
        return next(action);
      };
    };
  };
}

var thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

function myThunkMiddleware() {
  return function middleware(middlewareAPI) {
    var dispatch = middlewareAPI.dispatch,
        getState = middlewareAPI.getState
    return function myMiddle (next) {
      return function myMiddleReturn(action) {
        console.log('prev', getState())
        next(action)
        console.log('next', action.type, getState())
      }
    }
  }
}

var myThunk = myThunkMiddleware()