import PropTypes from "prop-types";
import React, {Component} from "react";
import CANCEL_ICON from "../../assets/close-white.svg";
import {promiseSetState, wait} from "../../utils/library";
import "./snackbar.css";

class SnackBar extends Component {
  static propTypes = {
    message: PropTypes.string,
    timeout: PropTypes.number
  };

  static defaultProps = {
    timeout: 1000
  };

  constructor(props) {
    super(props);
    this.onSnackBarClear = this.onSnackBarClear.bind(this);
    this.state = {
      message: "",
      animation: ""
    };
    this.cancelTimeout = null;
  }

  async componentDidUpdate(props) {
    if (this.props.message !== props.message) {
      if (!this.props.message) return;
      const setState = promiseSetState(this);
      await setState({
        message: this.props.message,
        animation: "visible"
      });
      await wait(100, setState, {animation: "fade-in"});
      let fadeOut = wait(this.props.timeout + 500, setState, {
        animation: "fade-out"
      });
      this.cancelTimeout = fadeOut.cancel;
      await fadeOut;
      await wait(350, setState, {animation: ""});
      this.cancelTimeout = null;
    }
  }

  render() {
    const {message, animation} = this.state;
    return (
      <div className={`snack-bar ${animation}`}>
        <pre className="message">{message}</pre>
        <img
          key="remove"
          src={CANCEL_ICON}
          alt="clear snack-bar"
          className="icon clear"
          title="Set Cancel"
          onClick={this.onSnackBarClear}
        />
      </div>
    );
  }

  async onSnackBarClear() {
    if (this.cancelTimeout) {
      this.cancelTimeout();
      this.cancelTimeout = null;
    }
    const setState = promiseSetState(this);
    await setState({animation: "fade-out"});
    await wait(350, setState, {animation: ""});
  }
}

export default SnackBar;
