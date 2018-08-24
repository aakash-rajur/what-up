const {ApolloServer, gql, PubSub} = require('apollo-server-express');
const TASKS_CHANGED = process.env.REACT_APP_TASKS_CHANGED;
const notifier = new PubSub();
const {TASK_CANCELLED, TASK_CREATED, createPublisher, getTimestamp, findTask, getStats} = require('./utils/library');
const notify = createPublisher(notifier);

function resolverGenerator(DB, postgres) {
	return {
		Query: {
			hello: (root, {name}) => {
				return `hello ${name || 'world'}`;
			},
			tasks: async (root, {filter, timestamp}, context) => {
				console.log('user-hash', context.user);
				timestamp && console.log(`requesting data for ${timestamp}`);
				return postgres.getTasks(context.user, filter);
			}
		},
		Mutation: {
			hello: (root, {name}) => `not hello ${name || 'world'}`,
			add: (root, {description}, context) => {
				console.log('user-hash', context.user);
				let {data = []} = DB;
				notify(TASKS_CHANGED, getStats(data));
				return postgres.addTask(context.user, description);
			},
			remove: (root, {id}) => {
				let {data = []} = DB;
				notify(TASKS_CHANGED, getStats(data));
				return postgres.updateTask(id, TASK_CANCELLED);
			},
			edit: (root, {id, description}) => {
				let {data = []} = DB;
				notify(TASKS_CHANGED, getStats(data));
				return postgres.editTask(id, description);
			},
			update: (root, {id, status}) => {
				let {data = []} = DB;
				notify(TASKS_CHANGED, getStats(data));
				return postgres.updateTask(id, status);
			},
			updateAll: (root, {status}) => {
				let {data = []} = DB,
					updated = getTimestamp();
				data.forEach(task => {
					task.status = status;
					task.updated = updated;
					
				});
				notify(TASKS_CHANGED, getStats(data));
				
				return data.length;
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
			onConnect: (connectionParams, webSocket) => {
				let {remoteAddress, remotePort} = webSocket._socket;
				console.log(`websocket connected to ${remoteAddress}:${remotePort}`);
				setTimeout(notify, 10, TASKS_CHANGED, getStats(DB.data))
			}
		},
		context: ({req}) => ({...req})
	});
}

module.exports = {
	getApolloServer
};
