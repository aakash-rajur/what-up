import PropTypes from 'prop-types';
import React, {Component, Fragment} from 'react';
import {withSession} from "../../utils/apollo";
import {TASK_ALL, TASK_CANCELLED, TASK_COMPLETED, TASK_CREATED} from "../../utils/constants";
import {FILTER_BUTTON_TEMPLATE} from '../../utils/library';
import FilterButton from "../FilterButton/FilterButton";
import Footer from "../Footer/Footer";
import NewTask from "../NewTask/NewTask";
import SnackBar from "../SnackBar/SnackBar";
import TaskList from "../TaskList/TaskList";
import UpdateAll from "../UpdateAll/UpdateAll";
import './App.css';

export class App extends Component {
	static propTypes = {
		stat: PropTypes.shape({
			[TASK_ALL]: PropTypes.number,
			[TASK_CANCELLED]: PropTypes.number,
			[TASK_COMPLETED]: PropTypes.number,
			[TASK_CREATED]: PropTypes.number,
			timestamp: PropTypes.string
		}),
		notification: PropTypes.shape({
			action: PropTypes.string,
			timestamp: PropTypes.string,
			data: PropTypes.object
		})
	};
	
	static defaultProps = {
		stat: {
			[TASK_ALL]: 0,
			[TASK_CANCELLED]: 0,
			[TASK_COMPLETED]: 0,
			[TASK_CREATED]: 0,
			timestamp: "0"
		},
		notification: {
			action: null,
			timestamp: "0",
			data: null
		}
	};
	
	constructor(props) {
		super(props);
		this.getLatestTimestamp = this.getLatestTimestamp.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onNewTaskChange = this.onNewTaskChange.bind(this);
		this.clearNewTaskInput = this.clearNewTaskInput.bind(this);
		this.getNextUpdateALlStatus = this.getNextUpdateALlStatus.bind(this);
		this.state = {
			filter: TASK_ALL,
			newTask: ''
		};
	}
	
	render() {
		let {
				filter,
				newTask
			} = this.state, {
				notification: {
					data: notificationData,
					action
				},
				stat
			} = this.props,
			timestamp = this.getLatestTimestamp();
		return (
			<Fragment>
				<h1 className="accent-font-color title">What Up!</h1>
				<span className="new-task-container">
					<NewTask newTask={newTask} type="text"
					         autoFocus={true} placeholder="new task?"
					         className="app-width new-task"
					         onChange={this.onNewTaskChange}
					         onDone={this.clearNewTaskInput}/>
					<UpdateAll className="icon check-all"
					           nextStatus={this.getNextUpdateALlStatus()}
					           filter={filter}/>
					<div className="filter-container">
						{FILTER_BUTTON_TEMPLATE.map((type, index) => (
							<FilterButton key={index} {...type}
							              stat={stat ? stat[type.filter] : 0}
							              active={type.filter === filter}
							              onClick={this.onFilterChange}/>
						))}
	                </div>
        </span>
				<TaskList
					filter={filter}
					timestamp={timestamp}
					action={action}
				/>
				<Footer/>
				<SnackBar
					timeout={2000}
					message={notificationData && notificationData.message}
				/>
			</Fragment>
		);
	}
	
	getLatestTimestamp() {
		const {
			notification: {timestamp: t1},
			stat: {timestamp: t2}
		} = this.props;
		return t2 > t1 ? t2 : t1;
	}
	
	onNewTaskChange({target: {value}}) {
		this.setState({newTask: value});
	}
	
	onFilterChange(filter) {
		this.setState({filter});
	}
	
	clearNewTaskInput() {
		this.setState({newTask: ''});
	}
	
	getNextUpdateALlStatus() {
		if (!this.props || !this.props.stats)
			return TASK_CREATED;
		const {
			[TASK_ALL]: total,
			[TASK_COMPLETED]: completed
		} = this.props.stat, {
			filter
		} = this.state;
		if (filter === TASK_ALL)
			return completed === total ? TASK_CREATED : TASK_COMPLETED;
		switch (filter) {
			case TASK_ALL:
				return completed === total ? TASK_CREATED : TASK_COMPLETED;
			case TASK_CREATED:
				return TASK_COMPLETED;
			case TASK_COMPLETED:
			case TASK_CANCELLED:
			default:
				return TASK_CREATED;
		}
	}
}

export default withSession(App);