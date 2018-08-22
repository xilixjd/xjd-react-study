import { renderComponent } from '../react-dom/diff';

const setStateQueue = [];
const renderQueue = [];

function defer(fn) {
    return Promise.resolve().then(fn);
}

export function enqueueSetState(state, component) {
    if (setStateQueue.length === 0) {
        defer(flush);
    }

    setStateQueue.push({
        state,
        component,
    })

    if (!renderQueue.some(item => item === component)) {
        renderQueue.push(component);
    }
}

function flush() {
    let item, component;
    while (item = setStateQueue.shift()) {
        const { state, component } = item;
        if (!component.prevState) {
            component.prevState = Object.assign( {}, component.state );
        }
        if (typeof state === "function") {
            Object.assign(component.state, state(component.prevState));
        } else {
            Object.assign(component.state, state);
        }
        component.prevState = component.state;
    }

    while (component = renderQueue.shift()) {
        renderComponent(component);
    }
}