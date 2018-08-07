import React from 'react';
import {MockedProvider} from 'react-apollo/test-utils';
import tasks from '../../../mock/tasks'
import {TASK_COMPLETED} from "../../utils/constants";
import Task from './Task';

let newDescription = 'hello world',
	newStatus = TASK_COMPLETED,
	mocks = [];

/*beforeAll(startServer);

afterAll(stopServer);*/

describe('Task Component', () => {
	let component = shallow(
		<MockedProvider mocks={mocks} addTypename={false}>
			<Task {...tasks[0]}/>
		</MockedProvider>
	);
	
	it('should render', () => {
		/*expect(component.find('div.app-width.task').exists())
				.toBe(true);*/
	});
});
