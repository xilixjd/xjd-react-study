/* eslint-disable */
import React, { Component } from 'react';
import './App.css';

let A = (props) => <div>{props.a}</div>
        class App extends React.Component {
            constructor(props) {
                super(props)
                this.state = {
                    aaa: 'aaa',
                    num: 0,
                    error: false,
                }
                this.inputRef = null
                this.inputRefFunc = (element) => {
                    this.inputRef = element
                }
            }
            change(a){
                this.setState({
                    aaa:a
                })
            }
            click1() {
                var equal = this.state.aaa === "aaa"
                if (equal) {
                    this.setState({
                        aaa: "bbb"
                    })
                } else {
                    this.setState({
                        aaa: "aaa"
                    })
                }
                this.setState({
                    num: this.state.num + 1
                })
                this.setState({
                    num: this.state.num + 1
                })
                var self = this
                // setTimeout(function() {
                //     self.setState({
                //         num: self.state.num + 1
                //     })
                //     self.setState({
                //         num: self.state.num + 1
                //     })
                // }, 0)
                this.inputRef.focus()
            }
            click2() {
                var equal = this.state.aaa === "aaa"
                if (equal) {
                    this.setState({
                        aaa: "bbb"
                    })
                } else {
                    this.setState({
                        aaa: "aaa"
                    })
                }
                this.setState({
                    num: this.state.num + 2
                })
            }
            callback = () => {
                this.setState({
                    num: this.state.num + 1
                })
            }
            componentWillMount() {
                console.log("App componentWillMount")
                this.setState({
                    num: this.state.num + 1
                })
            }
            componentDidMount() {
                console.log('App componentDidMount')
                this.setState({
                    num: this.state.num + 1
                })
                this.setState({
                    num: this.state.num + 1
                })
            }
            componentWillUpdate() {
                console.log('App componentWillUpdate')
            }
            componentWillReceiveProps(nextProps) {
                console.log("App componentWillReceiveProps")
            }
            componentDidUpdate(){
                console.log('App componentDidUpdate')
            }
            componentDidCatch(a, b) {
                console.log(a, b)
                console.log("App componentDidCatch")
                this.setState({ error: true })
            }
            render() {
                return(
                    <div>
                        {this.state.error ? <h2>error</h2> : <h2>no error</h2>}
                        <h2>{this.state.num}</h2>
                        {this.state.aaa === 'aaa' ?  <Inner callback={this.callback} className={this.state.aaa} /> : <Inner2 className={this.state.aaa} />}
                        {/*<Inner callback={this.change.bind(this)} className={this.state.aaa}/>*/}
                        {/*<button onClick={() => this.click()}>click</button>*/}
                        <button style={ this.state.aaa === 'aaa' ? {} : {fontSize: "50px"}} onClick={() => this.click1()}>click</button>
                        <input ref={this.inputRefFunc}/>
                        {<A a={1}/>}
                    </div>
                )
             
            }
        }

        class Inner extends React.Component{
             constructor(props){
                super(props)
                this.state = {
                    innerP: "init",
                    num: 0
                }
            }
            componentWillMount(){
                console.log('Inner componentWillMount')
                this.setState({
                    num: this.state.num + 1,
                })
            }
            componentDidMount(){
                console.log('Inner componentDidMount')
                this.setState({
                    num: this.state.num + 1,
                })
                this.props.callback("bbb")
            }
            componentWillUpdate(){
                console.log('Inner componentWillUpdate')
            }
            componentDidUpdate(){
                console.log('Inner componentDidUpdate')
            }
            componentWillUnmount(){
                console.log('Inner componentWillUnmount')
            }
            componentWillReceiveProps(nextProps) {
                console.log("Inner componentWillReceiveProps")
                // this.props.changeAppState("inner change")
                this.setState({
                    innerP: "change",
                    num: this.state.num + 1
                })
            }
            click1() {
                this.props.callback()
            }
            render() {
                if (this.state.num === 3) {
                    throw new Error("error")
                }
                return (
                    <div className={this.props.className}>
                        <p>xxx{111}</p><p>{this.state.num}</p>
                        <button onClick={() => this.click1()}>click</button>
                        {/*<Inner2/>*/}
                    </div> 
                )
            }

        }
        class Inner2 extends React.Component{
            constructor(props){
                super(props)
                this.state = {
                    innerP: "init",
                    num: 0,
                }
            }
            componentWillMount(){
                console.log('Inner2 componentWillMount')
            }
            componentDidMount(){
                console.log('Inner2 componentDidMount')
                // this.setState({
                //     num: this.state.num + 1
                // })
            }
            componentWillUpdate(){
                console.log('Inner2 componentWillUpdate')
            }
            componentWillUnmount(){
                console.log('Inner2 componentWillUnmount')
            }
            componentWillReceiveProps(nextProps) {
                console.log("Inner2 componentWillReceiveProps")
                // this.setState({
                //     innerP: "change",
                // })
            }
            render() {
                return  <section className={this.props.className}><p>yyy</p><p>{this.state.innerP}</p><p>{this.state.num}</p></section>
            }

        }

// class ErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { error: null, errorInfo: null };
//   }
  
//   componentDidCatch(error, errorInfo) {
//     // Catch errors in any components below and re-render with error message
//     this.setState({
//       error: error,
//       errorInfo: errorInfo
//     })
//     // You can also log error messages to an error reporting service here
//   }
  
//   render() {
//     if (this.state.errorInfo) {
//       // Error path
//       return (
//         <div>
//           <h2>Something went wrong.</h2>
//           <details style={{ whiteSpace: 'pre-wrap' }}>
//             {this.state.error && this.state.error.toString()}
//             <br />
//             {this.state.errorInfo.componentStack}
//           </details>
//         </div>
//       );
//     }
//     // Normally, just render children
//     return this.props.children;
//   }  
// }

// class BuggyCounter extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { counter: 0 };
//     this.handleClick = this.handleClick.bind(this);
//   }
  
//   handleClick() {
//     this.setState(({counter}) => ({
//       counter: counter + 1
//     }));
//   }
  
//   render() {
//     if (this.state.counter === 5) {
//       // Simulate a JS error
//       throw new Error('I crashed!');
//     }
//     return <h1 onClick={this.handleClick}>{this.state.counter}</h1>;
//   }
// }

// function App() {
//   return (
//     <div>
//       <p>
//         <b>
//           This is an example of error boundaries in React 16.
//           <br /><br />
//           Click on the numbers to increase the counters.
//           <br />
//           The counter is programmed to throw when it reaches 5. This simulates a JavaScript error in a component.
//         </b>
//       </p>
//       <hr />
//       <ErrorBoundary>
//         <p>These two counters are inside the same error boundary. If one crashes, the error boundary will replace both of them.</p>
//         <BuggyCounter />
//         <BuggyCounter />
//       </ErrorBoundary>
//       <hr />
//       <p>These two counters are each inside of their own error boundary. So if one crashes, the other is not affected.</p>
//       <ErrorBoundary><BuggyCounter /></ErrorBoundary>
//       <ErrorBoundary><BuggyCounter /></ErrorBoundary>
//     </div>
//   );
// }

export default App;
