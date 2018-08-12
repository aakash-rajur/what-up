import React from 'react';
import Footer from './Footer';

describe('Footer component', () => {
	let component = shallow(<Footer/>);
	
	it('should render', () => {
		expect(component.find('div.documentation').exists())
			.toBe(true);
	});
	
	it('dom integrity', checkDOM(component, [{
		selector: 'div.documentation',
		children: [{
			selector: 'em',
			length: 1
		}, {
			selector: 'a',
			length: 2
		}]
	}, {
		selector: 'a.link.author',
		text: 'aakashRajur'
	}, {
		selector: 'a.link.inspiration',
		text: 'React • TodoMVC'
	}]));
	
	matchSnapshot(component)
});
