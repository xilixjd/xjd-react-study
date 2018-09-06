import React from './react';
import ReactDOM from './react-dom';


function Welcome() {
    return (
        <h2>welcom</h2>
    )
}

class Counter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            num: 1,
            flag: true,
        }
    }

    onClick() {
        let flag = this.state.flag;
        this.setState({ num: this.state.num + 1, flag: !flag });
        this.setState({ num: this.state.num + 1, flag: !flag });
    }

    render() {
        let flag = this.state.flag;
        return (
            <div>
                {flag ? <Welcome /> : <h1>flag: false</h1>}
                {/* {flag ? <h1>flag: true</h1> : <h1>flag: false</h1>} */}
                {/* <h2>{this.props.a}</h2> */}
                {/* <h1>count: {this.state.num}</h1> */}
                <button onClick={() => this.onClick()}>add</button>
            </div>
        );
    }
}

ReactDOM.render(
    <Counter a={1}/>,
    document.getElementById("root")
);