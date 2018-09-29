import PropTypes from "prop-types";
import React, {Component} from 'react';
import {compose, graphql, withApollo} from 'react-apollo';
import {
	ADD_TASK,
	CANCEL_TASK,
	CREATE_SESSION,
	EDIT_TASK,
	FETCH_TASKS,
	ON_SERVER_NOTIFICATION,
	TASKS_UPDATED,
	UPDATE_ALL_TASKS,
	UPDATE_TASK
} from "./query";
import {TASK_ALL, TASK_CANCELLED, TASK_COMPLETED, TASK_CREATED} from "../utils/constants";
import {graphQLSubscribe, parseNotification, parseTasksChanged} from "../utils/library";

const DEFAULT_SESSION = "{}";

export const sessionCreator = graphql(CREATE_SESSION, {
	options: () => ({fetchPolicy: 'network-only'}),
	props: ({data: {session = DEFAULT_SESSION}}) => {
		session = JSON.parse(session);
		return {...session};
	}
});

export const withQueryTasks = graphql(FETCH_TASKS, {
	props: ({data = {}}, ...rest) => ({...data, ...rest}),
	skip:({action}) => (action === 'SESSION_EXPIRED')
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
