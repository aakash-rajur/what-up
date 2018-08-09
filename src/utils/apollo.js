import {InMemoryCache} from 'apollo-cache-inmemory';
import {ApolloClient} from 'apollo-client';
import {ApolloLink, split} from 'apollo-link';
import {onError} from 'apollo-link-error';
import {HttpLink} from 'apollo-link-http';
import {WebSocketLink} from 'apollo-link-ws';
import {getMainDefinition} from "apollo-utilities";
import gql from 'graphql-tag';
import {compose, graphql} from 'react-apollo';
import {API_URL, TASK_ALL, TASK_CANCELLED, TASK_COMPLETED, TASK_CREATED, WS_URL} from "./constants";

const wsLink = new WebSocketLink({
	uri: WS_URL,
	options: {
		reconnect: true
	}
});

export default new ApolloClient({
	link: ApolloLink.from([
		onError(({graphQLErrors, networkError}) => {
			if (graphQLErrors)
				graphQLErrors.map(({message, locations, path}) =>
					console.log(
						`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
					),
				);
			if (networkError) console.log(`[Network error]: ${JSON.stringify(networkError)}`);
		}),
		split(({query}) => {
				const {kind, operation} = getMainDefinition(query);
				return kind === 'OperationDefinition' && operation === 'subscription';
			},
			wsLink,
			new HttpLink({
				uri: API_URL,
				credentials: 'same-origin'
			}))
	]),
	cache: new InMemoryCache()
});


export const FETCH_TASKS = gql`
    query fetchTasks($filter: String!, $timestamp: String){
        tasks(filter: $filter, timestamp: $timestamp){
            id,
            description,
            status,
            created,
            updated
        }
    }
`;

export const CANCEL_TASK = gql`
    mutation removeTask($id: String!) {
        remove(id: $id){
            description,
            status
        }
    }
`;

export const EDIT_TASK = gql`
    mutation editTask($id: String!, $description: String!){
        edit(id: $id, description: $description){
            description,
            status
        }
    }
`;

export const UPDATE_TASK = gql`
    mutation updateTask($id: String!, $status: String!){
        update(id: $id, status: $status){
            description,
            status
        }
    }
`;

export const UPDATE_ALL_TASKS = gql`
    mutation updateAll($status: String!){
        updateAll(status: $status)
    }
`;

export const ADD_TASK = gql`
    mutation addTask($description: String!){
        add(description: $description)
    }
`;

export const TASKS_UPDATED = gql`
    subscription onTasksChanged {
        tasksChanged{
            timestamp,
            CREATED,
            COMPLETED,
            CANCELLED,
            ALL
        }
    }
`;

export const withTaskMutations = compose(...(
		[{
			mutation: CANCEL_TASK,
			prefix: 'cancel',
			args: ({id}) => ({id})
		}, {
			mutation: EDIT_TASK,
			prefix: 'edit',
			args: () => ({}),
			dynamic: true
		}, {
			mutation: UPDATE_TASK,
			prefix: 'update',
			args: ({id, status}) => ({
				id, status: status === TASK_CREATED ?
					TASK_COMPLETED : TASK_CREATED
			})
		}].map(({mutation, prefix, args, dynamic}) => graphql(mutation, {
				props: ({mutate}, result) => {
					return ({
						[`${prefix}Task`]: dynamic ? (props) => mutate({variables: {...props}}) : mutate,
						[`${prefix}Result`]: result ? result.data : null
					})
				},
				options: props => ({variables: args(props)})
			})
		)
	)
);

export const withQueryTasks = graphql(FETCH_TASKS, {
		props: ({data = {}}, ...rest) => ({...data, ...rest})
	}
);

export const withNewTaskAddition = graphql(ADD_TASK, {
	props: ({mutate}, result) => ({addNewTask: mutate, result}),
	options: ({newTask, onDone}) => ({
		variables: {description: newTask},
		onCompleted: onDone,
		onError: onDone
	})
});

export const withUpdateAll = graphql(UPDATE_ALL_TASKS, {
	props: ({mutate, result}) => ({updateAll: mutate, result}),
	options: ({nextStatus}) => ({variables: {status: nextStatus}})
});

const defaultTaskUpdated = {
	tasksChanged: {
		timestamp: "0",
		[TASK_ALL]: 0,
		[TASK_CANCELLED]: 0,
		[TASK_COMPLETED]: 0,
		[TASK_CREATED]: 0
	}
};

export const withTasksUpdatedSubscription = graphql(TASKS_UPDATED, {
	props: ({data: {tasksChanged} = defaultTaskUpdated}) => ({...tasksChanged}),
	options: () => ({shouldResubscribe: true})
});