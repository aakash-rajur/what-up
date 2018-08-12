import React from 'react';
import tasks from '../../../mock/tasks';
import {TASK_ALL, TASK_COMPLETED} from "../../utils/constants";
import Error from '../Error/Error';
import Loading from "../Loading/Loading";
import {Task} from "../Task/Task";
import {TaskList} from './TaskList';

describe('TaskList component when loading', () => {
	let props = {
		tasks: [],
		loading: true,
		error: null,
		filter: TASK_ALL
	}, component = shallow(<TaskList {...props}/>);
	
	it('dom integrity', checkDOM(component, [{
		selector: 'div.loading-container',
		children: [{
			selector: Loading,
			length: 1
		}]
	}]));
	
	it('state integrity', () => {
		expect(component.state('tasks').length)
			.toBe(0);
		expect(component.state('loading'))
			.toBe(true)
	});
	
	matchSnapshot(component)
});

describe('TaskList with error', () => {
	let props = {
		tasks: [],
		loading: false,
		error: {hello: 'world'},
		filter: TASK_ALL
	}, component = shallow(<TaskList {...props}/>);
	
	it('dom integrity', checkDOM(component, [{
		selector: Error,
		props: {
			text: JSON.stringify(props.error)
		}
	}]));
	
	matchSnapshot(component)
});

describe('TaskList component with empty List', () => {
	let props = {
		tasks: [],
		loading: true,
		error: null,
		filter: TASK_ALL
	}, component = shallow(<TaskList {...props}/>);
	
	component.setProps({tasks: []});
	
	it('dom integrity for filter ALL', checkDOM(component, [{
		selector: 'div.no-tasks',
		text: 'all your tasks show up here!'
	}]));
	
	it('should render empty list msg for completed', () => {
		component.setProps({filter: TASK_COMPLETED});
		
		checkDOM(component, [{
			selector: 'div.no-tasks',
			text: `your ${TASK_COMPLETED.toLowerCase()} tasks show up here!`
		}])();
	});
	
	it('state integrity', () => {
		expect(component.state('tasks').length)
			.toBe(0);
		expect(component.state('loading'))
			.toBe(false)
	});
	
	setImmediate(matchSnapshot, component);
});

describe('TaskList component with List', () => {
	let props = {
		tasks: [],
		loading: false,
		error: null,
		filter: TASK_ALL
	}, component = shallow(<TaskList {...props}/>);
	
	component.setProps({loading: false, tasks: props.tasks = [...tasks]});
	
	it('should render task-list', () => {
		expect(component.find('div.task-list').exists())
			.toBe(true);
		expect(component.children().length)
			.toBe(props.tasks.length);
	});
	
	setImmediate(it, 'dom integrity', checkDOM(component, [{
		selector: 'div.task-list',
		children: [{
			selector: Task,
			length: tasks.length
		}]
	}]));
	
	it('state integrity', () => {
		expect(component.state('tasks').length)
			.toBe(tasks.length);
		expect(component.state('loading'))
			.toBe(false)
	});
	
	setImmediate(matchSnapshot, component);
});
