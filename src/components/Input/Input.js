import React, {Component} from 'react';
import PropTypes from 'prop-types';

class Input extends Component {
    static propTypes = {
        onValueReturn: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.onReturn = this.onReturn.bind(this);
    }

    render() {
        let inputProps = {...this.props};
        delete inputProps.onValueReturn;
        return (
            <input {...inputProps} onKeyUp={this.onReturn}/>
        )
    }

    onReturn(e) {
        let {
            keyCode,
            target: {value}
        } = e, {
            onKeyUp,
            onValueReturn
        } = this.props;
        onKeyUp && onKeyUp(e);
        keyCode === 13 && onValueReturn && onValueReturn(value)
    }
}

export default Input;
