import Component from '../react/component';
import setAttribute from './dom';
import { renderComponent } from './render';

function removeNode(node) {
    if (node && node.parentNode) {
        node.parentNode.removeChild(node);
    }
}

function unmountComponent(component) {
    if (component.componentWillUnmount) {
        component.componentWillUnmount();
    }
    removeNode(component.base);
}

function createComponentInst(component, props) {
    let inst;
    if (component.prototype && component.prototype.render) {
        inst = new component(props);
    } else {
        inst = new Component(props);
        inst.constructor = component;
        inst.render = function() {
            // 不同
            return inst.constructor(props);
        }
    }
    return inst;
}

export function diff(dom, vnode, container) {
    const newDom = diffNode(dom, vnode);
    // newDom.parentNode !== container 这个是否有必要？
    if (container && newDom.parentNode !== container) {
        container.appendChild(newDom);
    }

    // 这个是否有必要？
    // return newDom;
}

function diffNode(dom, vnode) {
    let out = dom;

    if (vnode === undefined || vnode === null || typeof vnode === "boolean") {
        vnode = "";
    }

    if (typeof vnode === "number") {
        vnode = String(vnode);
    }

    if (typeof vnode === "string") {
        if (dom && dom.nodeType === 3) {
            if (dom.textContent !== vnode) {
                dom.textContent = vnode;
            }
        } else {
            out = document.createTextNode(vnode);
            if (dom && dom.parentNode) {
                dom.parentNode.replaceChild(out, dom);
            }
        }
        return out;
    }

    if (typeof vnode.tag === "function") {
        return diffComponent(dom, vnode);
    }

    if (!dom || !isSameNodeType(dom, vnode)) {
        out = document.createElement(vnode.tag);
        if (dom) {
            [...dom.childNodes].map(out.appendChild);
            if (dom.parentNode) {
                dom.parentNode.replaceChild(out, dom);
            }
        }
    }

    if (vnode.children && vnode.children.length > 0 || out.childNodes && out.childNodes.length > 0) {
        diffChildren(out, vnode.children);
    }

    // out 没法解决，因为 dom 为 undefined
    diffAttributes(out, vnode);

    return out;
}


function isSameNodeType(dom, vnode) {
    if (typeof vnode === "string" || typeof vnode === "number") {
        return dom && dom.nodeType === 3;
    } else if (typeof vnode.tag === "string") {
        return dom && dom.nodeName.toLowerCase() === vnode.tag.toLowerCase();
    } else {
        return dom && dom._component && dom._component.constructor === vnode.tag;
    }
}

function diffChildren( dom, vchildren ) {

    const domChildren = dom.childNodes;
    const children = [];

    const keyed = {};

    if ( domChildren.length > 0 ) {
        for ( let i = 0; i < domChildren.length; i++ ) {
            const child = domChildren[ i ];
            const key = child.key;
            if ( key ) {
                keyed[ key ] = child;
            } else {
                children.push( child );
            }
        }
    }

    if ( vchildren && vchildren.length > 0 ) {

        let min = 0;
        let childrenLen = children.length;

        for ( let i = 0; i < vchildren.length; i++ ) {

            const vchild = vchildren[ i ];
            const key = vchild.key;
            let child;

            if ( key ) {

                if ( keyed[ key ] ) {
                    child = keyed[ key ];
                    keyed[ key ] = undefined;
                }

            } else if ( min < childrenLen ) {

                for ( let j = min; j < childrenLen; j++ ) {

                    let c = children[ j ];

                    if ( c && isSameNodeType( c, vchild ) ) {

                        child = c;
                        children[ j ] = undefined;

                        if ( j === childrenLen - 1 ) childrenLen--;
                        if ( j === min ) min++;
                        break;

                    }

                }

            }

            child = diffNode( child, vchild );

            const f = domChildren[ i ];
            if ( child && child !== dom && child !== f ) {
                if ( !f ) {
                    console.log("appendChild", child, vchild)
                    dom.appendChild(child);
                } else if ( child === f.nextSibling ) {
                    console.log("remove", f)
                    removeNode( f );
                } else {
                    console.log("insertbefore", child)
                    dom.insertBefore( child, f );
                }
            }

        }
    }
}

function diffComponent(dom, vnode) {
    let domComp = dom && dom._component;
    let newDom;

    if (domComp && domComp.constructor === vnode.tag) {
        setComponentProps(domComp, vnode.attrs);
        renderComponent(domComp);
        newDom = domComp.base;
    } else {
        if (domComp) {
            // dom 存在 component（该节点为 component 节点）
            unmountComponent(domComp);
        }
        domComp = createComponentInst(vnode.tag, vnode.attrs);
        setComponentProps(domComp, vnode.attrs);
        renderComponent(domComp);

        newDom = domComp.base;
        if (dom && dom._component) {
            dom._component = null;
        }
        if (dom && newDom !== dom) {
            removeNode(dom);
        }
    }

    return newDom;
}