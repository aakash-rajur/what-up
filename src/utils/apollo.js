import {InMemoryCache} from 'apollo-cache-inmemory';
import {ApolloClient} from 'apollo-client';
import {ApolloLink, split} from 'apollo-link';
import {onError} from 'apollo-link-error';
import {createHttpLink} from 'apollo-link-http';
import {WebSocketLink} from 'apollo-link-ws';
import {getMainDefinition} from "apollo-utilities";
import gql from 'graphql-tag';
import PropTypes from "prop-types";
import React, {Component} from 'react';
import {compose, graphql, withApollo} from 'react-apollo';
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
import {parseCookie} from "./library";

export const CREATE_SESSION = gql`
    query createSession{
        session
    }
`;

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
    subscription onTasksChanged($token: String!) {
        TASKS_CHANGED(token: $token) {
            timestamp,
            CREATED,
            COMPLETED,
            CANCELLED,
            ALL
        }
    }
`;

export const ON_SERVER_NOTIFICATION = gql`
    subscription onServerNotification($token: String!) {
        ON_NOTIFICATION(token: $token) {
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
		}),
		authMiddlewareHttp = new ApolloLink((operation, forward) => {
			operation.setContext(({headers = {}}) => {
				const {session} = parseCookie();
				if (!session) return headers;
				return {
					headers: {
						...headers,
						session
					}
				};
			});
			return forward(operation);
		}),
		{subscriptionClient} = wsLink;
	
	subscriptionClient.maxConnectTimeGenerator.duration = () =>
		subscriptionClient.maxConnectTimeGenerator.max;
	
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
					if (networkError) {
						console.error(networkError);
					}
				}
			),
			authMiddlewareHttp,
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

const DEFAULT_SESSION = "{}";

export const sessionCreator = graphql(CREATE_SESSION, {
	props: ({data: {session = DEFAULT_SESSION}}) => {
		session = JSON.parse(session);
		return {...session};
	}
});

export const withQueryTasks = graphql(FETCH_TASKS, {
	props: ({data = {}}, ...rest) => ({...data, ...rest})
});

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
})));

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

function graphQLSubscribe(client, cb, query, variables) {
	client.subscribe({
		query,
		variables,
		shouldResubscribe: true
	}).subscribe({next: cb, error: console.error});
}

function parseNotification(cb) {
	return ({data}) => {
		const {
			[ON_NOTIFICATION]: {
				action,
				data: payload,
				timestamp
			}
		} = data;
		return cb({
			action,
			timestamp,
			data: JSON.parse(payload)
		});
	};
}

function parseTasksChanged(cb) {
	return ({data}) => {
		const {[TASKS_CHANGED]: stat} = data;
		return cb(stat);
	};
}

export function withSession(Child) {
	return sessionCreator(withApollo(
		class Session extends Component {
			static propTypes = {
				token: PropTypes.string,
				action: PropTypes.string,
				client: PropTypes.object
			};
			
			constructor(props) {
				super(props);
				this.state = {};
			}
			
			componentDidUpdate(prevProps) {
				if (prevProps.action !== this.props.action) {
					const {action, token, client} = this.props;
					if (action === 'NEW_SESSION') {
						document.cookie = `session=${token};`;
					}
					graphQLSubscribe(
						client,
						parseNotification(this.onSubscriptionData('notification')),
						ON_SERVER_NOTIFICATION, {
							token
						}
					);
					graphQLSubscribe(
						client,
						parseTasksChanged(this.onSubscriptionData('stat')),
						TASKS_UPDATED, {
							token
						}
					);
				}
			}
			
			render() {
				const {props, state} = this;
				return <Child {...props} {...state}/>;
			}
			
			onSubscriptionData(key) {
				return (data) => this.setState({[key]: data});
			}
		}
	));
}
