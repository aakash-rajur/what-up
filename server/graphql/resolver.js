const {withFilter} = require('apollo-server-express');
const getPublisher = require('../modules/publisher');
const publisher = getPublisher();
const {
	TASKS_CHANGED,
	TASK_CANCELLED,
	ON_NOTIFICATION,
	decodeSession,
	createUser,
	getStats
} = require('../utils/library');

function hasSessionExpired(context) {
	const {token, isExpired} = context;
	if (isExpired) {
		publisher.notify(ON_NOTIFICATION, {
			action: 'SESSION_EXPIRED',
			data: JSON.stringify({
				message: 'Session Expired. Please Refresh!'
			}),
			token
		});
		return true;
	}
	return false;
}

function resolverGenerator(postgres) {
	return {
		Query: {
			hello: (root, {name}) => {
				return `hello ${name || 'world'}`;
			},
			tasks: async (root, {filter, timestamp}, context) => {
				if (hasSessionExpired(context)) return [];
				return postgres.getTasks(context.user, filter);
			},
			session: async (root, args, context) => {
				let {user, token, isExpired} = context;
				
				try {
					if (isExpired) {
						if ((await postgres.doesUserExist(user)).does_user_exist) {
							console.info(`attempting to nuke all data belonging to ${user}`);
							await postgres.deleteTasks(user);
							await postgres.deleteUser(user);
						}
						user = null;
					}
				} catch (e) {
					console.error(e);
				}
				
				let result = {
					token,
					action: 'SESSION_RESTORED'
				};
				if (!user) {
					let {user, token} = await createUser(),
						{add_user: userID} = await postgres.addUser(user);
					console.info(`adding user ${user} with id ${userID}`);
					result = {
						token,
						action: 'NEW_SESSION'
					};
				}
				return JSON.stringify(result);
			}
		},
		Mutation: {
			hello: (root, {name}) => `not hello ${name || 'world'}`,
			add: async (root, {description}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.addTask(context.user, description);
				publisher.notify(TASKS_CHANGED, {
					...await getStats(context.user),
					token: context.token
				});
				return result.add_task;
			},
			remove: async (root, {id}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.updateTask(id, TASK_CANCELLED);
				publisher.notify(TASKS_CHANGED, {
					...await getStats(context.user),
					token: context.token
				});
				return result.update_task;
			},
			edit: async (root, {id, description}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.editTask(id, description);
				publisher.notify(TASKS_CHANGED, {
					...await getStats(context.user),
					token: context.token
				});
				return result.edit_task;
			},
			update: async (root, {id, status}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.updateTask(id, status);
				publisher.notify(TASKS_CHANGED, {
					...await getStats(context.user),
					token: context.token
				});
				return result.update_task;
			},
			updateAll: async (root, {filter, status}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.updateAllTasks(context.user, filter, status);
				publisher.notify(TASKS_CHANGED, {
					...await getStats(context.user),
					token: context.token
				});
				return parseInt(result.update_all_tasks, 10);
			}
		},
		Subscription: {
			[TASKS_CHANGED]: {
				subscribe: withFilter(
					(_, {token}) => {
						try {
							const user = decodeSession(token);
							publisher.notifyDeferred(TASKS_CHANGED,
								async () => ({
									...await getStats(user),
									token
								})
							);
						} catch (e) {
							console.error(e);
						}
						return publisher.asyncIterator([TASKS_CHANGED]);
					},
					({[TASKS_CHANGED]: {token}}, {token: _token}) => token === _token
				)
			},
			[ON_NOTIFICATION]: {
				subscribe: withFilter(
					(_, {token}) => {
						try {
							const user = decodeSession(token);
							publisher.notifyDeferred(ON_NOTIFICATION, {
								action: 'NEW_SESSION',
								data: JSON.stringify({message: `Your UserID is ${user}`}),
								token
							});
						} catch (e) {
							console.error(e);
						}
						return publisher.asyncIterator([ON_NOTIFICATION]);
					},
					({[ON_NOTIFICATION]: {token}}, {token: _token}) => token === _token
				)
			}
		}
	}
}

module.exports = {
	resolverGenerator
};