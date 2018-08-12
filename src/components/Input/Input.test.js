import React from 'react';
import Input from './Input';

describe('Input component', () => {
	let props = {
			type: 'text', tabIndex: 1, className: 'task-input',
			autoFocus: true, value: 'hello world',
			placeholder: 'lorem ipsum'
		}, onValueReturn = stub(),
		component = shallow(<Input {...props} onValueReturn={onValueReturn}/>);
	
	it('should render', () => {
		expect(component.find('input').exists())
			.toBe(true);
	});
	
	it('dom integrity', checkDOM(component, [{
		selector: 'input',
		props: {...props}
	}]));
	
	it('should not fire onValueReturn if keyCode is not 13', checkEvents(component, [{
		selector: 'input',
		event: 'keyup',
		args: [{keyCode: 10, target: {value: props.value}}],
		callback: onValueReturn,
		count: 0
	}]));
	
	it('should fire onValueReturn if keyCode is 13', checkEvents(component, [{
		selector: 'input',
		event: 'keyup',
		args: [{keyCode: 13, target: {value: props.value}}],
		callback: onValueReturn,
		count: 1,
		cArgs: [props.value]
	}]));
	
	
	matchSnapshot(component)
});
