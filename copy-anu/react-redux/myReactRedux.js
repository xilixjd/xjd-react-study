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

