import Component from '../react/component';
import setAttribute from './dom';
import { renderComponent } from './render';

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
        diffComponent(out, vnode.children);
    }

    // out ?
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