export default function setAttribute(dom, name, value) {
    if (name === "className") {
        name = "class";
    }

    if (/^on\w+/.test(name)) {
        if (typeof value === "function") {
            name = name.toLowerCase();
            dom[name] = value;
        } else {
            throw "事件绑定必须为函数";
        }
    } else if (name === "style") {
        if (value && typeof value === "object") {
            for (let cssKey in value) {
                let cssAttr = value[cssKey];
                dom.style[cssKey] = typeof cssAttr === "number" ? cssAttr + "px" : cssAttr;
            }
        }
    } else {
        if (!typeof value === "string") {
            throw "属性必须为string类型";
        }
        if (name in dom) {
            dom[name] = value || "";
            return;
        }
        if (value) {
            dom.setAttribute(name, value);
        } else {
            dom.removeAttribute(name, value);
        }
    }
}