import React from 'react';
import Input from './Input';

describe('Input component', () => {
	let props = {
		type: 'text', tabIndex: 1, className: 'task-input',
		autoFocus: true, value: 'hello world',
		placeholder: 'lorem ipsum', onValueReturn: stub()
	}, component = shallow(<Input {...props}/>);
	
	it('should render', () => {
		expect(component.find('input').exists())
			.toBe(true);
	});
	
	it('props integrity', () => {
		let domProps = {...props};
		delete domProps.onValueReturn;
		Object.entries(domProps)
			.forEach(([prop, value]) =>
				expect(component.prop(prop))
					.toBe(value)
			);
	});
	
	it('should not fire onValueReturn if keyCode is not 13', () => {
		component.simulate('keyup', {keyCode: 10, target: {value: props.value}});
		expect(props.onValueReturn.called).toBe(false);
	});
	
	it('should fire onValueReturn if keyCode is 13', () => {
		component.simulate('keyup', {keyCode: 13, target: {value: props.value}});
		expect(props.onValueReturn.called).toBe(true);
		expect(props.onValueReturn.callCount).toBe(1);
		expect(props.onValueReturn.calledWithExactly(props.value)).toBe(true)
	});
	
	it('match snapshot', () => {
		expect(component).toMatchSnapshot();
	});
});
