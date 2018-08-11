import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {withQueryTasks} from "../../utils/apollo";
import {TASK_ALL} from "../../utils/constants";
import Error from "../Error/Error";
import Loading from "../Loading/Loading";
import Task from "../Task/Task";
import './task-list.css';

export class TaskList extends Component {
	static propTypes = {
		tasks: PropTypes.array,
		loading: PropTypes.bool,
		error: PropTypes.any,
		filter: PropTypes.string
	};

	state = {
		tasks: [],
		loading: true
	};

	componentDidUpdate(prevProps) {
		if (this.props.loading !== prevProps.loading) {
			this.setState({loading: this.props.loading && !this.state.tasks.length});
		}
		if (this.props.tasks !== prevProps.tasks && this.props.tasks)
			this.setState({tasks: this.props.tasks, loading: false});
	}

	render() {
		let {error, filter} = this.props, {
			loading, tasks
		} = this.state;
		return (
			error ? <Error text={error && (typeof error === "string" ? error : JSON.stringify(error))}/> :
				loading ? (<div className="loading-container"><Loading/></div>) :
					!tasks.length ? (
						<div className="no-tasks">
							{filter === TASK_ALL ? 'all your tasks show up here!' :
								`your ${filter.toLowerCase()} tasks show up here!`}
						</div>
					) : (
						<div className="task-list">
							{tasks.map((task, index) => <Task {...task} index={index} key={index}/>)}
						</div>
					)
		)
	}
}

export default withQueryTasks(TaskList);
