import PropTypes from 'prop-types';
import React, {Component} from 'react';
import CANCEL_ICON from '../../assets/close.svg';
import {MutableTask} from "../../utils/apollo";
import {TASK_CREATED, TASK_TITLE} from "../../utils/constants";
import {getFormattedTimestamp} from "../../utils/library";
import Input from "../Input/Input";
import './task.css';

export class Task extends Component {
	static propTypes = {
		description: PropTypes.string,
		status: PropTypes.string,
		id: PropTypes.string,
		updated: PropTypes.string
	};
	
	constructor(props) {
		super(props);
		this.onDescriptionChange = this.onDescriptionChange.bind(this);
		this.onSaveDescription = this.onSaveDescription.bind(this);
		this.state = {
			description: props.description,
			editable: false
		};
	}
	
	render() {
		let {
			status,
			updated,
			updateTask,
			cancelTask
		} = this.props, {
			description,
			editable
		} = this.state;
		return (
			<div className="app-width task" data-status={status}>
				<div key='status' className="icon status"
				     title={status === TASK_CREATED ?
					     'Set Complete' : 'Set Active'}
				     onClick={updateTask}>
					&nbsp;
				</div>
				{editable ? (
					<Input key='description' value={description}
					       className='editable' autoFocus={true}
					       onChange={this.onDescriptionChange}
					       onBlur={this.onEditChange(false)}
					       onValueReturn={this.onSaveDescription}/>
				) : (
					<div className="description" key='description'
					     title={TASK_TITLE} onDoubleClick={this.onEditChange(true)}>
						{description}
					</div>
				)}
				<img key='remove' src={CANCEL_ICON} alt="cancel-task"
				     className="icon cancel" title='Set Cancel'
				     onClick={cancelTask}/>
				<i className="updated">{getFormattedTimestamp(updated)}</i>
			</div>
		)
	}
	
	onEditChange(editable) {
		return () => {
			let {description} = this.props;
			this.setState({editable, description: description.trim()});
		};
	}
	
	onDescriptionChange({target: {value}}) {
		this.setState({description: value});
	}
	
	async onSaveDescription() {
		let {id, editTask} = this.props,
			{description} = this.state;
		await editTask({id, description});
		this.setState({editable: false});
	}
}


export default MutableTask(Task);
