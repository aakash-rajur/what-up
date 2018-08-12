import React from 'react';
import CHEVRON_DOWN_ICON from "../../assets/chevron-down.svg";
import {UpdateAll} from './UpdateAll';

describe('UpdateAll component', () => {
	let className = 'lorem',
		onUpdateAll = stub(),
		component = shallow(<UpdateAll className={className} updateAll={onUpdateAll}/>);
	
	it('should render', () => {
		expect(component.find('img.lorem').exists())
			.toBe(true);
	});
	
	it('image source', () => Object.entries({
			src: CHEVRON_DOWN_ICON,
			alt: 'complete-all',
			className,
			onClick: onUpdateAll,
			title: 'Update All'
		}).forEach(([key, value]) =>
			expect(component.prop(key))
				.toBe(value)
		)
	);
	
	it('should invoke onUpdateAll', () => {
		component.simulate('click');
		expect(onUpdateAll.called).toBe(true);
		expect(onUpdateAll.callCount).toBe(1);
	});
	
	it('match snapshot', () => expect(component).toMatchSnapshot());
});
