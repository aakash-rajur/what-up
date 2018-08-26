const {ApolloServer, gql, PubSub} = require('apollo-server-express');
const cookie = require('cookie');
const notifier = new PubSub();
const {TASKS_CHANGED, TASK_CANCELLED, TASK_CREATED, createPublisher, verifySession, getStats} = require('./utils/library');
const notify = createPublisher(notifier);

function resolverGenerator(DB, postgres) {
	return {
		Query: {
			hello: (root, {name}) => {
				return `hello ${name || 'world'}`;
			},
			tasks: async (root, {filter, timestamp}, context) => {
				return postgres.getTasks(context.user, filter);
			}
		},
		Mutation: {
			hello: (root, {name}) => `not hello ${name || 'world'}`,
			add: async (root, {description}, context) => {
				let result = await postgres.addTask(context.user, description);
				notify(TASKS_CHANGED, await getStats(context.user));
				return result;
			},
			remove: async (root, {id}, context) => {
				let result = await postgres.updateTask(id, TASK_CANCELLED);
				notify(TASKS_CHANGED, await getStats(context.user));
				return result;
			},
			edit: async (root, {id, description}, context) => {
				let result = await postgres.editTask(id, description);
				notify(TASKS_CHANGED, await getStats(context.user));
				return result;
			},
			update: async (root, {id, status}, context) => {
				let result = await postgres.updateTask(id, status);
				notify(TASKS_CHANGED, await getStats(context.user));
				return result;
			},
			updateAll: async (root, {filter, status}, context) => {
				let result = await postgres.updateAllTasks(context.user, filter, status);
				notify(TASKS_CHANGED, await getStats(context.user));
				return result;
			}
		},
		Subscription: {
			tasksChanged: {
				subscribe: () => notifier.asyncIterator([TASKS_CHANGED]),
			}
		},
	}
}

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

    type Event {
        timestamp: String!,
        CREATED: Int,
        COMPLETED: Int,
        CANCELLED: Int,
        ALL: Int,
    }

    type Query {
        hello(name: String): String!,
        tasks(filter: String, timestamp: String): [Task]
    }

    type Mutation {
        hello(name: String):String!,
        add(description: String!):String!,
        remove(id: String!):String!,
        edit(id: String!, description: String!):String!
        update(id: String!, status: String!):String!,
        updateAll(filter:String!, status: String!): Int
    }

    type Subscription {
        tasksChanged: Event!
    }
`;

function getApolloServer(DB = {}, postgres) {
	return new ApolloServer({
		cors: false,
		typeDefs,
		resolvers: resolverGenerator(DB, postgres),
		subscriptions: {
			onConnect: async (connectionParams, webSocket) => {
				let {remoteAddress, remotePort} = webSocket._socket;
				console.log(`websocket connected to ${remoteAddress}:${remotePort}`);
				let {session} = cookie.parse(webSocket.upgradeReq.headers.cookie);
				try {
					let user = verifySession(session);
					console.log(user);
					if (user) setImmediate(notify, TASKS_CHANGED, await getStats(user));
				} catch (e) {
					console.error(e);
				}
			}
		},
		context: ({req}) => ({...req})
	});
}

module.exports = {
	getApolloServer
};
