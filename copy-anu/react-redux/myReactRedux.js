/**
 * 1.HOC 组件会丢失 ref，因此有个参数为 withRef
 * 2.HOC 组件上面绑定的 Static 方法会丢失，解决办法用 hoist-non-react-statics
 * 参考文章：https://segmentfault.com/a/1190000008112017?_ea=1553893
 */