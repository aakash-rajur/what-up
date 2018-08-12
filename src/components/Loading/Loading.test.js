import React from 'react';
import Loading from './Loading';

describe('Loading component', () => {
	let className = 'additional',
		component = shallow(<Loading className={className}/>);
	
	it('should render', () => {
		expect(component.find('div.loading').exists())
			.toBe(true);
	});
	
	it('dom integrity', checkDOM(component, [{
		selector: 'div.loading',
		props: {
			className: `loading ${className}`
		},
		text: '\u00a0'
	}]));
	
	matchSnapshot(component);
});
