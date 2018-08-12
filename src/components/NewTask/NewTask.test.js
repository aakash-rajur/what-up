import React from 'react';
import Input from "../Input/Input";
import {NewTask} from './NewTask';

describe('NewTask component', () => {
	let newTask = 'helloWorld',
		onChange = stub(),
		addNewTask = stub(),
		props = {
			newTask,
			onChange,
			addNewTask,
			type: 'text',
			autoFocus: true,
			className: 'lorem',
			placeholder: 'ipsum'
		},
		component = shallow(<NewTask {...props}/>);
	
	it('dom integrity', checkDOM(component, [{
		selector: Input,
		props: {...props}
	}]));
	
	matchSnapshot(component);
});
