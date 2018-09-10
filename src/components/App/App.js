import React, {Component, Fragment} from 'react';
import {withNotificationAndTaskSubscription} from "../../utils/apollo";
import {TASK_ALL, TASK_CANCELLED, TASK_COMPLETED, TASK_CREATED} from "../../utils/constants";
import {FILTER_BUTTON_TEMPLATE} from "../../utils/library";
import FilterButton from "../FilterButton/FilterButton";
import Footer from "../Footer/Footer";
import NewTask from "../NewTask/NewTask";
import SnackBar from "../SnackBar/SnackBar";
import TaskList from "../TaskList/TaskList";
import UpdateAll from "../UpdateAll/UpdateAll";
import './App.css';

export class App extends Component {
	constructor(props) {
		super(props);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onNewTaskChange = this.onNewTaskChange.bind(this);
		this.clearNewTaskInput = this.clearNewTaskInput.bind(this);
		this.getNextUpdateALlStatus = this.getNextUpdateALlStatus.bind(this);
		this.state = {
			filter: TASK_ALL,
			lastUpdated: Date.now().toString(10),
			newTask: ''
		};
	}
	
	componentDidMount() {
		window.addEventListener('unload', () =>
			document.cookie = `connection=;expires=Thu, 01 Jan 1970 00:00:01 GMT;`);
	}
	
	componentDidUpdate(prevProps) {
		if (prevProps.notification !== this.props.notification) {
			const {action, data} = this.props.notification;
			if (action === 'NEW_SESSION') {
				const {token} = data;
				document.cookie = `session=${token};`;
				document.cookie = `connection=true;`
			} else if (action === 'SESSION_EXPIRED') {
				document.cookie = `session=;expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
			} else if (action === 'SESSION_RESTORED') {
				document.cookie = 'connection=true;'
			}
		}
	}
	
	render() {
		let {
			filter,
			newTask
		} = this.state, {
			timestamp = 'NONE',
			stats
		} = this.props;
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
							              stat={stats ? stats[type.filter] : 0}
							              active={type.filter === filter}
							              onClick={this.onFilterChange}/>
						))}
	                </div>
	        </span>
				<TaskList filter={filter} timestamp={timestamp}/>
				<Footer/>
				{this.renderNotification()}
			</Fragment>
		);
	}
	
	renderNotification() {
		const {
				notification
			} = this.props,
			message = (notification && notification.data && notification.data.message) || '';
		return (
			<SnackBar
				timeout={2000}
				message={message}
			/>
		)
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
		} = this.props.stats, {
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

export default withNotificationAndTaskSubscription(App);
