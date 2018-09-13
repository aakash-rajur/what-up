import {InMemoryCache} from 'apollo-cache-inmemory';
import {ApolloClient} from 'apollo-client';
import {ApolloLink, split} from 'apollo-link';
import {onError} from 'apollo-link-error';
import {createHttpLink} from 'apollo-link-http';
import {WebSocketLink} from 'apollo-link-ws';
import {getMainDefinition} from "apollo-utilities";
import gql from 'graphql-tag';
import {compose, graphql} from 'react-apollo';
import {
	API_URL,
	ON_NOTIFICATION,
	TASK_ALL,
	TASK_CANCELLED,
	TASK_COMPLETED,
	TASK_CREATED,
	TASKS_CHANGED,
	WS_URL
} from "./constants";

export const FETCH_TASKS = gql`
    query fetchTasks($filter: String!, $timestamp: String){
        tasks(filter: $filter, timestamp: $timestamp) {
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
        remove(id: $id)
    }
`;

export const EDIT_TASK = gql`
    mutation editTask($id: String!, $description: String!) {
        edit(id: $id, description: $description)
    }
`;

export const UPDATE_TASK = gql`
    mutation updateTask($id: String!, $status: String!) {
        update(id: $id, status: $status)
    }
`;

export const UPDATE_ALL_TASKS = gql`
    mutation updateAll($filter: String!, $status: String!) {
        updateAll(filter: $filter,status: $status)
    }
`;

export const ADD_TASK = gql`
    mutation addTask($description: String!) {
        add(description: $description)
    }
`;

export const TASKS_UPDATED = gql`
    subscription onTasksChanged {
        TASKS_CHANGED {
            timestamp,
            CREATED,
            COMPLETED,
            CANCELLED,
            ALL
        }
    }
`;

export const ON_SERVER_NOTIFICATION = gql`
    subscription onServerNotification {
        ON_NOTIFICATION {
            timestamp,
            action,
            data
        }
    }
`;

export default function getApolloClient() {
	const wsLink = new WebSocketLink({
			uri: WS_URL,
			options: {
				timeout: 600000,
				inactivityTimeout: 0,
				reconnect: true,
				reconnectionAttempts: 3
			}
		}),
		httpLink = createHttpLink({
			uri: API_URL,
			credentials: 'include'
		});
	wsLink.subscriptionClient.maxConnectTimeGenerator.duration = () =>
		wsLink.subscriptionClient.maxConnectTimeGenerator.max;
	return new ApolloClient({
		link: ApolloLink.from([
			onError(
				({graphQLErrors, networkError}) => {
					if (graphQLErrors)
						graphQLErrors.map(({message, locations, path}) =>
							console.error(
								`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
							),
						);
					if (networkError) console.error(`[Network error]: ${JSON.stringify(networkError)}`);
				}
			),
			split(
				({query}) => {
					const {kind, operation} = getMainDefinition(query);
					return kind === 'OperationDefinition' && operation === 'subscription';
				},
				wsLink,
				httpLink
			)
		]),
		cache: new InMemoryCache()
	});
}

export const withTaskMutations = compose(...[{
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
				[`${prefix}Task`]: dynamic ? props => mutate({variables: {...props}}) : mutate,
				[`${prefix}Result`]: result ? result.data : null
			})
		},
		options: props => ({variables: args(props)})
	}))
);

export const withQueryTasks = graphql(FETCH_TASKS, {
	props: ({data = {}}, ...rest) => ({...data, ...rest})
});

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
	options: ({filter, nextStatus}) => ({variables: {filter, status: nextStatus}})
});

export const defaultTaskUpdated = {
	timestamp: "0",
	[TASK_ALL]: 0,
	[TASK_CANCELLED]: 0,
	[TASK_COMPLETED]: 0,
	[TASK_CREATED]: 0
};

const defaultNotification = {
	timestamp: "0",
	action: 'DEFAULT',
	data: null
};

export const withNotificationAndTaskSubscription = compose(
	graphql(ON_SERVER_NOTIFICATION, {
		props: ({data: {[ON_NOTIFICATION]: notification = defaultNotification}}) => {
			const {data = null, timestamp, ...rest} = notification || {};
			console.log(`notification ${timestamp}`, notification);
			return {
				notification: {
					...rest,
					timestamp,
					data: data && JSON.parse(data)
				},
				timestamp
			};
		},
		options: () => ({shouldResubscribe: true})
	}),
	graphql(TASKS_UPDATED, {
		props: ({data: {[TASKS_CHANGED]: stats = defaultTaskUpdated}}) => {
			console.log(`stat ${stats.timestamp}`, stats);
			return {
				stats,
				timestamp: stats.timestamp
			};
		},
		options: () => ({shouldResubscribe: true})
	}),
);
