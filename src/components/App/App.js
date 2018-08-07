import React, {Component, Fragment} from 'react';
import {Mutation, Query, Subscription} from 'react-apollo';
import CHEVRON_DOWN_ICON from '../../assets/chevron-down.svg';
import {ADD_TASK, FETCH_TASKS, TASKS_UPDATED, UPDATE_ALL_TASKS} from "../../utils/apollo";
import {TASK_ALL, TASK_COMPLETED} from "../../utils/constants";
import {FILTER_BUTTON_TEMPLATE, getNextUpdateAllStatus} from "../../utils/library";
import FilterButton from "../FilterButton/FilterButton";
import Input from "../Input/Input";
import TaskList from "../TaskList/TaskList";
import './App.css';

class App extends Component {
	constructor(props) {
		super(props);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onNewTaskChange = this.onNewTaskChange.bind(this);
		this.clearNewTaskInput = this.clearNewTaskInput.bind(this);
		this.renderNewTaskInput = this.renderNewTaskInput.bind(this);
		this.renderUpdateAll = this.renderUpdateAll.bind(this);
		this.renderTaskList = this.renderTaskList.bind(this);
		this.renderApp = this.renderApp.bind(this);
		this.onTaskListChange = this.onTaskListChange.bind(this);
		this.state = {
			filter: TASK_ALL,
			lastUpdated: Date.now().toString(10),
			newTask: '',
			nextUpdateAllStatus: TASK_COMPLETED
		};
	}
	
	
	render() {
		return (
			<Subscription subscription={TASKS_UPDATED} shouldResubscribe={true}>
				{this.renderApp}
			</Subscription>
		);
	}
	
	renderNewTaskInput(trigger) {
		let {newTask} = this.state;
		return (
			<Input tabIndex={0} type="text" autoFocus={true} value={newTask}
			       className="app-width new-task" placeholder="new task?"
			       onChange={this.onNewTaskChange} onValueReturn={trigger}/>
		)
	}
	
	// noinspection JSMethodCanBeStatic
	renderUpdateAll(trigger) {
		return (
			<img src={CHEVRON_DOWN_ICON} alt="complete-all"
			     className="icon check-all" onClick={trigger}
			     title='Update All'/>
		)
	}
	
	renderTaskList({data, ...rest}) {
		let {filter} = this.state;
		return (
			<TaskList filter={filter} {...data} {...rest}
			          onTaskListChange={this.onTaskListChange}/>
		)
	}
	
	renderApp({data}) {
		let {filter, newTask, nextUpdateAllStatus} = this.state,
			{timestamp} = data ? data.tasksChanged : {};
		return (
			<Fragment>
				<h1 className="accent-font-color title">What Up!</h1>
				
				<span className="new-task-container">
                    <Mutation mutation={ADD_TASK} variables={{description: newTask}}
                              onCompleted={this.clearNewTaskInput} onError={this.clearNewTaskInput}>
                        {this.renderNewTaskInput}
                    </Mutation>
                    <Mutation mutation={UPDATE_ALL_TASKS} variables={{status: nextUpdateAllStatus}}>
                        {this.renderUpdateAll}
                    </Mutation>
                    <div className="filter-container">
                        {FILTER_BUTTON_TEMPLATE.map((type, index) => (
	                        <FilterButton key={index} {...type}
	                                      stat={data ? data.tasksChanged[type.filter] : 0}
	                                      active={type.filter === filter}
	                                      onClick={this.onFilterChange}/>
                        ))}
                    </div>
                </span>
				
				<Query query={FETCH_TASKS} variables={{filter, timestamp}}>
					{this.renderTaskList}
				</Query>
				
				<div className="documentation">
					<em>double-click to edit tasks</em><br/>
					Created by <a href="https://github.com/aakashRajur"
					              className="link">aakashRajur</a><br/>
					Inspired by <a href="http://todomvc.com/examples/react/" className="link">React •
					TodoMVC</a><br/>
				</div>
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
	
	onTaskListChange(tasks) {
		this.setState({nextUpdateAllStatus: getNextUpdateAllStatus(tasks)});
	}
}

export default App;
