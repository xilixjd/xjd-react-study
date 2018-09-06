// import ReactDOM from '../react-dom';
import { enqueueSetState } from './setStateQueue';

class Component {
    constructor(props = {}) {
        this.isReactComponent = true;

        this.state = {};
        this.props = props;
    }

    setState(stateChange) {
        // Object.assign(this.state, stateChange);
        // ReactDOM.renderComponent(this);
        enqueueSetState(stateChange, this);
    }
}

export default Component;