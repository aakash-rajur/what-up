import React from 'react';
import {TaskList} from './TaskList';
import tasks from '../../../mock/tasks';
import Loading from '../Loading/Loading';
import Error from '../Error/Error';
import Task from '../Task/Task';
import {TASK_ALL, TASK_COMPLETED} from "../../utils/constants";

describe('TaskList component when loading', () => {
	let props = {
		tasks: [],
		loading: true,
		error: null,
		filter: TASK_ALL
	}, component = shallow(<TaskList {...props}/>);
	
	it('should render loading', () => [
			'div.loading-container',
			Loading
		].forEach(selector =>
			expect(component.find(selector).exists())
				.toBe(true)
		)
	);
	
	it('state integrity', () => {
		expect(component.state('tasks').length)
			.toBe(0);
		expect(component.state('loading'))
			.toBe(true)
	});
	
	it('match snapshot', () => {
		expect(component).toMatchSnapshot();
	});
});

describe('TaskList with error', () => {
	let props = {
		tasks: [],
		loading: false,
		error: {hello: 'world'},
		filter: TASK_ALL
	}, component = shallow(<TaskList {...props}/>);
	
	it('should render error', () =>
		expect(component.find(Error).exists())
			.toBe(true)
	);
	
	it('should display the error stringified', () =>
		expect(component.find(Error).prop('text'))
			.toBe(JSON.stringify(props.error))
	);
	
	it('match snapshot', () => {
		expect(component).toMatchSnapshot();
	});
});

describe('TaskList component with empty List', () => {
	let props = {
		tasks: [],
		loading: true,
		error: null,
		filter: TASK_ALL
	}, component = shallow(<TaskList {...props}/>);
	
	component.setProps({tasks: []});
	
	it('should render empty list msg for ALL', () => {
		expect(component.find('div.no-tasks').exists())
			.toBe(true);
		expect(component.find('div.no-tasks').text())
			.toBe('all your tasks show up here!');
	});
	
	it('should render empty list msg for completed', () => {
		component.setProps({filter: TASK_COMPLETED});
		
		expect(component.find('div.no-tasks').text())
			.toBe(`your ${TASK_COMPLETED.toLowerCase()} tasks show up here!`)
	});
	
	it('state integrity', () => {
		expect(component.state('tasks').length)
			.toBe(0);
		expect(component.state('loading'))
			.toBe(false)
	});
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
	
	it('state integrity', () => {
		expect(component.state('tasks').length)
			.toBe(tasks.length);
		expect(component.state('loading'))
			.toBe(false)
	});
	
	it('children should be Task', () =>
		expect(component.find(Task).length)
			.toBe(2)
	);
	
	it('match snapshot with non-empty list', () => {
		expect(component).toMatchSnapshot();
	});
});
