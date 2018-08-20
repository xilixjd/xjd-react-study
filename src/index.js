import React from './react';
import ReactDOM from './react-dom';


function Welcome() {
    return (
        <h1>welcom</h1>
    )
}

class Counter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            num: 1
        }
    }

    onClick() {
        this.setState({ num: this.state.num + 1 });
    }

    render() {
        return (
            <div>
                <Welcome />
                <h2>{this.props.a}</h2>
                <h1>count: {this.state.num}</h1>
                <button onClick={() => this.onClick()}>add</button>
            </div>
        );
    }
}

ReactDOM.render(
    <Counter a={1}/>,
    document.getElementById("root")
);