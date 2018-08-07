import React from 'react';
import ERROR_ICON from '../../assets/alert.svg';
import Error from './Error'

describe('Error component with default props', () => {
	let error = 'Something Went Wrong',
		component = shallow(<Error/>);
	it('should render', () => {
		expect(component.find('div.error-container').exists())
			.toBe(true);
	});
	
	it('dom tree integrity', () => {
		['img', 'pre'].forEach((tag, i) =>
			expect(component.childAt(i).type())
				.toBe(tag))
	});
	
	it('img props', () => {
		let img = component.find('img');
		expect(img.prop('src')).toBe(ERROR_ICON);
		expect(img.prop('alt')).toBe(error);
	});
	
	it('pre content', () => {
		let pre = component.find('pre');
		expect(pre.text()).toBe(error);
	});
	
	it('match snapshot with default text', () => expect(component).toMatchSnapshot());
});

describe('Error component with non-default props', () => {
	let error = 'hello world',
		component = shallow(<Error text={error}/>);
	
	component.setProps({text: error});
	
	it('img props with non-default text', () => {
		let img = component.find('img');
		expect(img.prop('src')).toBe(ERROR_ICON);
		expect(img.prop('alt')).toBe(error);
	});
	
	it('pre content with non-default text', () => {
		let pre = component.find('pre');
		expect(pre.text()).toBe(error);
	});
	
	it('match snapshot with non-default text', () => expect(component).toMatchSnapshot());
});
