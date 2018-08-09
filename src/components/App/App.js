import React, {Component, Fragment} from 'react';
import {withTasksUpdatedSubscription} from "../../utils/apollo";
import {TASK_ALL, TASK_COMPLETED, TASK_CREATED} from "../../utils/constants";
import {FILTER_BUTTON_TEMPLATE} from "../../utils/library";
import FilterButton from "../FilterButton/FilterButton";
import Footer from "../Footer/Footer";
import NewTask from "../NewTask/NewTask";
import TaskList from "../TaskList/TaskList";
import UpdateAll from "../UpdateAll/UpdateAll";
import './App.css';

class App extends Component {
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
	
	
	render() {
		let {filter, newTask} = this.state,
			{timestamp} = this.props;
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
                     nextStatus={this.getNextUpdateALlStatus()}/>
          <div className="filter-container">
              {FILTER_BUTTON_TEMPLATE.map((type, index) => (
	              <FilterButton key={index} {...type}
	                            stat={this.props[type.filter]}
	                            active={type.filter === filter}
	                            onClick={this.onFilterChange}/>
              ))}
          </div>
        </span>
				
				<TaskList filter={filter} timestamp={timestamp}/>
				
				<Footer/>
			</Fragment>
		);
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
		let {[TASK_ALL]: total, [TASK_COMPLETED]: completed} = this.props;
		return completed === total ? TASK_CREATED : TASK_COMPLETED;
	}
}

export default withTasksUpdatedSubscription(App);
