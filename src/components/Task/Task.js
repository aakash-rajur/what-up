import React, {Component} from 'react';
import PropTypes from 'prop-types';
import CANCEL_ICON from '../../assets/close.svg';
import {TASK_COMPLETED, TASK_CREATED, TASK_TITLE} from "../../utils/constants";
import {EDIT_TASK, REMOVE_TASK, UPDATE_TASK} from "../../utils/apollo";
import Input from "../Input/Input";
import {getFormattedTimestamp, renderMutations} from "../../utils/library";
import './task.css';

class Task extends Component {
    static propTypes = {
        description: PropTypes.string,
        status: PropTypes.string,
        id: PropTypes.string
    };

    constructor(props) {
        super(props);
        this.renderStatusToggle = this.renderStatusToggle.bind(this);
        this.renderRemoveIcon = this.renderRemoveIcon.bind(this);
        this.renderEditDescription = this.renderEditDescription.bind(this);
        this.getEditTemplate = this.getEditTemplate.bind(this);
        this.getEditVariables = this.getEditVariables.bind(this);
        this.onDescriptionChange = this.onDescriptionChange.bind(this);
        this.blurInput = this.onEditChange(false);
        this.state = {
            editable: false,
            description: props.description
        };
    }

    render() {
        let {status, updated} = this.props;
        return (
            <div className="app-width task" data-status={status}>
                {renderMutations(this.getEditTemplate())}
                <i className="updated">{getFormattedTimestamp(updated)}</i>
            </div>
        )
    }

    // noinspection JSMethodCanBeStatic
    renderStatusToggle(trigger) {
        let {status} = this.props;
        return (
            <div key='status' className="icon status" onClick={trigger}
                 title={status === TASK_CREATED ?
                     'Set Complete' : 'Set Active'}>
                &nbsp;
            </div>
        );
    }

    // noinspection JSMethodCanBeStatic
    renderRemoveIcon(trigger) {
        return (
            <img key='remove' src={CANCEL_ICON} alt="cancel-task"
                 className="icon cancel" onClick={trigger}
                 title='Set Cancel'/>
        );
    }

    renderEditDescription(trigger) {
        let {description} = this.state;
        return <Input value={description} onChange={this.onDescriptionChange}
                      className='editable' onValueReturn={this.onSaveEdit(trigger)} key='description'
                      onBlur={this.onEditChange(false)} autoFocus={true}/>
    }

    getEditTemplate() {
        let {editable} = this.state, {
            description
        } = this.props;
        return [{
            mutation: UPDATE_TASK,
            getVariables: this.getEditVariables,
            renderComponent: this.renderStatusToggle
        }, {
            mutation: EDIT_TASK,
            getVariables: this.getEditVariables,
            renderComponent: editable ? this.renderEditDescription : (
                <div className="description" key='description'
                     onDoubleClick={this.onEditChange(true)}
                     title={TASK_TITLE}>
                    {description}
                </div>
            )
        }, {
            mutation: REMOVE_TASK,
            getVariables: this.getEditVariables,
            renderComponent: this.renderRemoveIcon
        }];
    }

    onDescriptionChange({target: {value}}) {
        this.setState({description: value});
    }

    onEditChange(editable) {
        return () => {
            let {description} = this.props;
            this.setState({editable, description: description.trim()});
        };
    }

    getEditVariables(mutation) {
        let {id, status} = this.props,
            {description} = this.state;
        switch (mutation) {
            case UPDATE_TASK:
                return {
                    id, status: status === TASK_CREATED ?
                        TASK_COMPLETED : TASK_CREATED
                };
            case REMOVE_TASK:
                return {id};
            case EDIT_TASK:
                return {id, description};
            default:
                return null;
        }
    }

    onSaveEdit(trigger) {
        return async () => {
            await trigger();
            this.blurInput();
        }
    }
}

export default Task;
