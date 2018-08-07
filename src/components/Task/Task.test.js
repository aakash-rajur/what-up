import React from 'react';
import tasks from '../../../mock/tasks'
import {TASK_COMPLETED} from "../../utils/constants";
//import Task from './Task';
import {Task} from './Task';

let newDescription = 'hello world',
	newStatus = TASK_COMPLETED,
	mocks = [];

describe('Task component', () => {
	let onUpdate = stub(),
		onCancel = stub(),
		onEdit = stub(),
		props = {
			...tasks[0],
			onUpdate,
			onCancel,
			onEdit
		}, component = shallow(<Task {...props}/>);
	
	it('should render', () => {
		expect(component.find('div.app-width.task').exists())
			.toBe(true);
	});
	
	it('dom integrity', () => {
		[
			'div.icon.status',
			'div.description',
			'img.icon.cancel'
		].forEach(child =>
			expect(component.find(child).exists())
				.toBe(true)
		);
	});
	
	it('')
});