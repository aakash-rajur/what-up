import React from 'react';
import FilterButton from './FilterButton';

describe('FilterButton with default props', () => {
	let active = false,
		component = shallow(<FilterButton/>);
	
	it('should render', () => {
		expect(component.find('button.filter').exists())
			.toBe(true);
	});
	
	it('dom tree integrity', () => {
		[{
			prop: 'title',
			value: ''
		}, {
			prop: 'data-active',
			value: active
		}, {
			prop: 'disabled',
			value: active
		}].forEach(({prop, value}) =>
			expect(component.prop(prop))
				.toBe(value));
		
		let span = component.childAt(0);
		expect(span.type()).toBe('span');
		expect(span.prop('className')).toBe('badge');
		expect(span.text()).toBe('0');
	});
	
	it('match snapshot with default props', () => expect(component).toMatchSnapshot());
});

describe('FilterButton with props', () => {
	let props = {
		active: true, title: 'All', stat: 7,
		filter: 'filter1', onClick: stub(),
	}, component = shallow(<FilterButton {...props}/>);
	
	it('should render', () => {
		expect(component.find('button.filter').exists())
			.toBe(true);
	});
	
	it('dom tree integrity', () => {
		[{
			prop: 'title',
			value: props.title
		}, {
			prop: 'data-active',
			value: props.active
		}, {
			prop: 'disabled',
			value: props.active
		}].forEach(({prop, value}) =>
			expect(component.prop(prop))
				.toBe(value));
		
		expect(component.childAt(0).text()).toBe(props.title);
		
		let span = component.childAt(1);
		expect(span.type()).toBe('span');
		expect(span.prop('className')).toBe('badge');
		expect(span.text()).toBe(props.stat.toString());
	});
	
	it('fires onClick', () => {
		component.simulate('click');
		expect(props.onClick.callCount).toBe(1);
		expect(props.onClick.calledWithExactly(props.filter)).toBe(true);
	});
	
	it('match snapshot with non-default props', () => expect(component).toMatchSnapshot());
});
