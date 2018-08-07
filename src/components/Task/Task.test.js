import React from 'react';
import tasks from '../../../mock/tasks'
import {EDIT_TASK, CANCEL_TASK, UPDATE_TASK} from "../../utils/apollo";
import {TASK_CANCELLED, TASK_COMPLETED, TASK_CREATED} from "../../utils/constants";
import Task from './Task';
import {ApolloProvider} from 'react-apollo';
import {MockedProvider} from 'react-apollo/test-utils';
import client from '../../utils/apollo';

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
