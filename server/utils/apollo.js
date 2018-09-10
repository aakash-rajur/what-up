const {ApolloServer, gql} = require('apollo-server-express');
const getPublisher = require('./publisher');
const publisher = getPublisher();
const {
	TASKS_CHANGED,
	TASK_CANCELLED,
	ON_NOTIFICATION,
	createSession,
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
        tasks(filter: String, timestamp: String): [Task]
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
        TASKS_CHANGED: Stat!,
        ON_NOTIFICATION: Notification!
    }
`;

function hasSessionExpired(context) {
	if (!context.connection) return true;
	if (!context.user) {
		publisher.notify(ON_NOTIFICATION, {
			action: 'SESSION_EXPIRED',
			data: JSON.stringify({
				message: 'Session Expired. Please Refresh!',
				srouce:'XHR'
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
			}
		},
		Mutation: {
			hello: (root, {name}) => `not hello ${name || 'world'}`,
			add: async (root, {description}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.addTask(context.user, description);
				publisher.notify(TASKS_CHANGED, await getStats(context.user));
				return result.add_task;
			},
			remove: async (root, {id}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.updateTask(id, TASK_CANCELLED);
				publisher.notify(TASKS_CHANGED, await getStats(context.user));
				return result.update_task;
			},
			edit: async (root, {id, description}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.editTask(id, description);
				publisher.notify(TASKS_CHANGED, await getStats(context.user));
				return result.edit_task;
			},
			update: async (root, {id, status}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.updateTask(id, status);
				publisher.notify(TASKS_CHANGED, await getStats(context.user));
				return result.update_task;
			},
			updateAll: async (root, {filter, status}, context) => {
				if (hasSessionExpired(context)) throw new Error('UNAUTHORIZED');
				let result = await postgres.updateAllTasks(context.user, filter, status);
				publisher.notify(TASKS_CHANGED, await getStats(context.user));
				return parseInt(result.update_all_tasks, 10);
			}
		},
		Subscription: {
			[TASKS_CHANGED]: {
				subscribe: () => publisher.asyncIterator([TASKS_CHANGED])
			},
			[ON_NOTIFICATION]: {
				subscribe: () => publisher.asyncIterator([ON_NOTIFICATION])
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
				createSession(webSocket.upgradeReq.headers.cookie, publisher);
			},
			onDisconnect: webSocket => {
				let {remoteAddress, remotePort} = webSocket._socket;
				console.info(`websocket disconnected from ${remoteAddress}:${remotePort}`);
			}
		},
		context: ({req}) => ({...req})
	});
}

module.exports = {
	getApolloServer
};
