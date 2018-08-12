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
	
	it('dom integrity', checkDOM(component, [{
		selector: 'img',
		props: {
			src: CHEVRON_DOWN_ICON,
			alt: 'toggle-all',
			title: 'Update ALl',
			onClick: onUpdateAll,
			className,
		}
	}]));
	
	it('check callbacks', checkEvents(component, [{
		selector: 'img',
		event: 'click',
		callback: onUpdateAll,
		count: 1
	}]));
	
	matchSnapshot(component)
});
