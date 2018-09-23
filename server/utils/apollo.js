const {ApolloServer, gql, withFilter} = require('apollo-server-express');
const getPublisher = require('./publisher');
const publisher = getPublisher();
const {
	TASKS_CHANGED,
	TASK_CANCELLED,
	ON_NOTIFICATION,
	verifySession,
	createUser,
	getStats
} = require('./library');

const typeDefs = gql`
    enum TASK_STATUS {
        CREATED,
        COMPLETED,
        CANCELLED
    }

    type Task {
        id: String!,
        description: String!,
        status: TASK_STATUS
        created: String!,
        updated: String!
    }

    type Stat {
        timestamp: String!,
        CREATED: Int,
        COMPLETED: Int,
        CANCELLED: Int,
        ALL: Int
    }

    type Notification {
        timestamp: String!,
        action: String!,
        data: String!
    }

    type Query {
        hello(name: String): String!,
        tasks(filter: String, timestamp: String): [Task],
        session:String!
    }

    type Mutation {
        hello(name: String): String!,
        add(description: String!): String!,
        remove(id: String!): String!,
        edit(id: String!, description: String!): String!
        update(id: String!, status: String!): String!,
        updateAll(filter:String!, status: String!): Int
    }

    type Subscription {
        TASKS_CHANGED(token: String): Stat!,
        ON_NOTIFICATION(token: String): Notification!
    }
`;

function hasSessionExpired(context) {
	const {user, token} = context;
	if (!user) {
		publisher.notify(ON_NOTIFICATION, {
			action: 'SESSION_EXPIRED',
			data: JSON.stringify({
				message: 'Session Expired. Please Refresh!',
				token
			})
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
				let {user, token} = context;
				
				try {
					if (token === 'EXPIRED') {
						if ((await postgres.doesUserExist(user)).does_user_exist) {
							console.info(`attempting to nuke all data belonging to ${user}`);
							await postgres.deleteTasks(user);
							await postgres.deleteUser(user);
						}
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
							const user = verifySession(token);
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
							const user = verifySession(token);
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

function getApolloServer(postgres) {
	return new ApolloServer({
		typeDefs,
		resolvers: resolverGenerator(postgres),
		subscriptions: {
			onConnect: async (connectionParams, webSocket) => {
				let {remoteAddress, remotePort} = webSocket._socket;
				console.info(`websocket connected to ${remoteAddress}:${remotePort}`);
			},
			onDisconnect: webSocket => {
				let {remoteAddress, remotePort} = webSocket._socket;
				console.info(`websocket disconnected from ${remoteAddress}:${remotePort}`);
			}
		},
		context: ({req, payload}) => {
			if (payload) {
				const {variables} = payload;
				return {...variables};
			}
			const {token, user, guid} = req;
			return {token, user, guid};
		}
	});
}

module.exports = {
	getApolloServer
};
