import React from 'react';
import tasks from '../../../mock/tasks'
import CANCEL_ICON from "../../assets/close.svg";
import {TASK_TITLE} from "../../utils/constants";
import {getFormattedTimestamp} from "../../utils/library";
import Input from "../Input/Input";
import {Task} from './Task';

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
	
	it('dom integrity', checkDOM(component, [{
		selector: 'div.app-width.task',
		props: {
			'data-status': tasks[0].status
		},
		children: [{
			selector: 'div',
			length: 3
		}, {
			selector: 'img',
			length: 1
		}, {
			selector: 'i',
			length: 1
		}]
	}, {
		selector: 'div.icon.status',
		props: {
			title: 'Set Active',
			onClick: updateTask
		},
		text: '\u00a0'
	}, {
		selector: 'div.description',
		props: {
			title: TASK_TITLE
		},
		text: tasks[0].description
	}, {
		selector: 'img.icon.cancel',
		props: {
			src: CANCEL_ICON,
			alt: 'cancel-task',
			title: 'Set Cancel',
			onClick: cancelTask
		}
	}, {
		selector: 'i.updated',
		text: getFormattedTimestamp(tasks[0].updated)
	}]));
	
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
	
	matchSnapshot(component);
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
		}, component = shallow(<Task {...props}/>);
	
	component.find('div.description')
		.simulate('doubleClick');
	
	it('should render', () =>
		expect(component.find('div.app-width.task').exists())
			.toBe(true)
	);
	
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
	
	it('dom integrity', checkDOM(component, [{
		selector: 'div.app-width.task',
		props: {
			'data-status': tasks[0].status
		},
		children: [{
			selector: 'div',
			length: 2
		}, {
			selector: 'img',
			length: 1
		}, {
			selector: 'i',
			length: 1
		}]
	}, {
		selector: 'div.icon.status',
		props: {
			title: 'Set Active',
			onClick: updateTask
		},
		text: '\u00a0'
	}, {
		selector: Input,
		props: {
			value: tasks[0].description,
			className: 'editable',
			autoFocus: true
		}
	}, {
		selector: 'img.icon.cancel',
		props: {
			src: CANCEL_ICON,
			alt: 'cancel-task',
			title: 'Set Cancel',
			onClick: cancelTask
		}
	}, {
		selector: 'i.updated',
		text: getFormattedTimestamp(tasks[0].updated)
	}]));
	
	it('check callbacks', checkEvents(component, [{
		selector: 'div.icon.status',
		event: 'click',
		callback: updateTask,
		count: 1
	}, {
		selector: 'img.icon.cancel',
		event: 'click',
		callback: cancelTask,
		count: 1
	}, {
		selector: Input,
		event: 'onValueReturn',
		custom: true,
		callback: editTask,
		cArgs: [{
			id: tasks[0].id,
			description: tasks[0].description
		}]
	}]));
	
	/**
	 * snapshot is being checked before setState
	 */
	setImmediate(matchSnapshot, 100, component);
});
