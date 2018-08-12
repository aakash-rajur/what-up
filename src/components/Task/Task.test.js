import React from 'react';
import tasks from '../../../mock/tasks'
import {Task} from './Task';
import {TASK_TITLE} from "../../utils/constants";
import {getFormattedTimestamp} from "../../utils/library";
import CANCEL_ICON from "../../assets/close.svg";

describe('Task component non editable description', () => {
	let updateTask = stub(),
		cancelTask = stub(),
		editTask = stub(),
		props = {
			...tasks[0],
			updateTask,
			cancelTask,
			editTask,
		}, component = shallow(<Task {...props}/>);
	
	it('should render', () => {
		expect(component.find('div.app-width.task').exists())
			.toBe(true);
	});
	
	it('dom integrity', () => [{
			selector: 'div.icon.status',
			props: {
				title: 'Set Active',
				onClick: updateTask
			},
			text: '\u00a0'
		}, {
			selector: 'div.description',
			props: {
				title: TASK_TITLE,
			},
			text: tasks[0].description
		}, {
			selector: 'img.icon.cancel',
			props: {
				title: 'Set Cancel',
				alt: 'cancel-task',
				src: CANCEL_ICON,
				onClick: cancelTask
			}
		}, {
			selector: 'i.updated',
			text: getFormattedTimestamp(tasks[0].updated)
		}].forEach(({selector, props, text}) => {
			let el = component.find(selector);
			props && Object.entries(([key, value]) =>
				expect(el.prop(key)).toBe(value)
			);
			text && expect(el.text()).toBe(text);
		})
	);
	
	it('state integrity', () => [{
			prop: 'description',
			value: tasks[0].description
		}, {
			prop: 'editable',
			value: false
		}].forEach(({prop, value}) =>
			expect(component.state(prop))
				.toBe(value)
		)
	);
	
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
			editTask,
		}, component = mount(<Task {...props}/>);
	
	it('should render', () =>
		expect(component.find('div.app-width.task').exists())
			.toBe(true)
	);
	
	component.find('div.description')
		.simulate('doubleClick');
	
	it('state integrity after', () => [{
			prop: 'description',
			value: tasks[0].description
		}, {
			prop: 'editable',
			value: true
		}].forEach(({prop, value}) =>
			expect(component.state(prop))
				.toBe(value)
		)
	);
	
	it('dom integrity', () => [
		'div.icon.status',
		'input.editable',
		'img.icon.cancel'
	].forEach(child =>
		expect(component.find(child).exists())
			.toBe(true)
	));
	
	it('should invoke relevant callback', () => {
		[{
			test: 'status',
			selector: 'div.icon.status',
			callback: 'updateTask'
		}, {
			test: 'cancel',
			selector: 'img.icon.cancel',
			callback: 'cancelTask'
		}].forEach(({test, selector, callback}) => {
				component.find(selector)
					.simulate('click');
				let func = props[callback];
				expect(func.called).toBe(true);
				expect(func.callCount).toBe(1);
			}
		);
		component.find('input.editable')
			.simulate('keyup', {keyCode: 13, target: {value: props.value}});
		expect(props.editTask.called).toBe(true);
		expect(props.editTask.callCount).toBe(1);
	});
	
	it('match snapshot', () => {
		expect(component).toMatchSnapshot();
	});
});
