import React from 'react';
import {App} from './App';
import NewTask from '../NewTask/NewTask';
import UpdateAll from '../UpdateAll/UpdateAll';
import TaskList from '../TaskList/TaskList';
import Footer from "../Footer/Footer";
import FilterButton from "../FilterButton/FilterButton";

describe('App component', () => {
	let component = shallow(<App/>);
	
	it('dom integrity', () => {
		[
			'h1.accent-font-color.title',
			'span.new-task-container',
			NewTask,
			UpdateAll,
			'div.filter-container',
			TaskList,
			Footer
		].forEach(child =>
			expect(component.find(child).exists())
				.toBe(true)
		);
		expect(component.find(FilterButton).length)
			.toBe(4);
	});
	
	it('match snapshot with non-empty list', () => {
		expect(component).toMatchSnapshot();
	});
});
