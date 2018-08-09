import React from 'react';
import tasks from '../../../mock/tasks'
import {Task} from './Task';

describe('Task component non editable description', () => {
	let updateTask = stub(),
		cancelTask = stub(),
		editTask = stub(),
		props = {
			...tasks[0],
			updateTask,
			cancelTask,
			editTask
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
	
	[{
		test: 'status',
		selector: 'div.icon.status',
		callback: 'updateTask'
	}, {
		test: 'cancel',
		selector: 'img.icon.cancel',
		callback: 'cancelTask'
	}].forEach(({test, selector, callback}) =>
		it(`should invoke ${callback} on ${test} click`, () => {
			component.find(selector)
				.simulate('click');
			let func = props[callback];
			expect(func.called).toBe(true);
			expect(func.callCount).toBe(1);
		})
	);
	
	it('match snapshot', () => {
		expect(component).toMatchSnapshot();
	});
});

describe('Task component editable description', () => {
	let updateTask = stub(),
		cancelTask = stub(),
		editTask = stub(),
		props = {
			...tasks[0],
			updateTask,
			cancelTask,
			editTask
		},
		component = shallow(<Task {...props}/>);
	
	it('should render', () => {
		expect(component.find('div.app-width.task').exists())
			.toBe(true);
	});
	
	component.setState({editable: true});
	
	component.update();
	
	it('dom integrity', () => {
		[
			'div.icon.status',
			'img.icon.cancel'
		].forEach(child =>
			expect(component.find(child).exists())
				.toBe(true)
		);
	});
	
	/*
	[{
		test: 'status',
		selector: 'div.icon.status',
		callback: 'updateTask'
	}, {
		test: 'cancel',
		selector: 'img.icon.cancel',
		callback: 'cancelTask'
	}].forEach(({test, selector, callback}) =>
		it(`should invoke ${callback} on ${test} click`, () => {
			component.find(selector)
				.simulate('click');
			let func = props[callback];
			expect(func.called).toBe(true);
			expect(func.callCount).toBe(1);
		})
	);
	
	it('match snapshot', () => {
		expect(component).toMatchSnapshot();
	});*/
});