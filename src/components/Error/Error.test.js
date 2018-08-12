import React from 'react';
import ERROR_ICON from '../../assets/alert.svg';
import Error from './Error'

describe('Error component without error text', () => {
	let error = 'Something Went Wrong',
		component = shallow(<Error/>);
	it('should render', () => {
		expect(component.find('div.error-container').exists())
			.toBe(true);
	});
	
	it('dom tree integrity', checkDOM(component, [{
		selector: 'div.error-container',
		props: {
			className: 'error-container '
		},
		children: [{
			selector: 'img',
			length: 1
		}, {
			selector: 'pre',
			length: 1
		}]
	}, {
		selector: 'img',
		props: {
			src: ERROR_ICON,
			alt: error
		}
	}, {
		selector: 'pre',
		text: error
	}]));
	
	matchSnapshot(component)
});

describe('Error component with error text', () => {
	let error = 'hello world',
		component = shallow(<Error text={error}/>);
	
	component.setProps({text: error});
	
	it('dom tree integrity', checkDOM(component, [{
		selector: 'div.error-container',
		props: {
			className: 'error-container '
		},
		children: [{
			selector: 'img',
			length: 1
		}, {
			selector: 'pre',
			length: 1
		}]
	}, {
		selector: 'img',
		props: {
			src: ERROR_ICON,
			alt: error
		}
	}, {
		selector: 'pre',
		text: error
	}]));
	
	matchSnapshot(component);
});
