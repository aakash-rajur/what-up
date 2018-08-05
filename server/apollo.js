const {ApolloServer, gql, PubSub} = require('apollo-server-express');
const TASKS_CHANGED = process.env.REACT_APP_TASKS_CHANGED;
const notifier = new PubSub();
const {TASK_CANCELLED, TASK_CREATED, createPublisher, getTimestamp, findTask, getStats} = require('./utils/library');
const notify = createPublisher(notifier);

function resolverGenerator(DB) {
    return {
        Query: {
            hello: (root, {name}) => {
                return `hello ${name || 'world'}`;
            },
            tasks: (root, {filter, timestamp}) => {
                timestamp && console.log(`requesting data for ${timestamp}`);
                let {data = []} = DB, processed = data;
                if (filter && filter !== 'ALL')
                    processed = data.filter(({status}) =>
                        status === filter);
                return processed.sort(({created: t1}, {created: t2}) => t2 - t1);
            }
        },
        Mutation: {
            hello: (root, {name}) => `not hello ${name || 'world'}`,
            add: (root, {description}) => {
                let {data = []} = DB,
                    timestamp = getTimestamp(),
                    newTask = {
                        id: timestamp,
                        description,
                        status: TASK_CREATED,
                        created: timestamp,
                        updated: timestamp
                    };
                data.push(newTask);
                notify(TASKS_CHANGED, getStats(data));

                return newTask.id;
            },
            remove: (root, {id}) => {
                let {data = []} = DB,
                    task = findTask(data, id);
                task.status = TASK_CANCELLED;
                task.updated = getTimestamp();
                notify(TASKS_CHANGED, getStats(data));

                return task;
            },
            edit: (root, {id, description}) => {
                let {data = []} = DB,
                    task = findTask(data, id);
                if (task.description === description) return task;
                task.description = description;
                task.updated = getTimestamp();
                notify(TASKS_CHANGED, getStats(data));

                return task;
            },
            update: (root, {id, status}) => {
                let {data = []} = DB,
                    task = findTask(data, id);
                if (task.status === status) return task;
                task.status = status;
                task.updated = getTimestamp();
                notify(TASKS_CHANGED, getStats(data));

                return task;
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
        hello(name: String): String!,
        add(description: String!):String!,
        remove(id: String!):Task,
        edit(id: String!, description: String!): Task
        update(id: String!, status: String!): Task,
        updateAll(status: String!): Int
    }

    type Subscription {
        tasksChanged: Event!
    }
`;

function getApolloServer(DB = {}) {
    return new ApolloServer({
        typeDefs,
        resolvers: resolverGenerator(DB),
        subscriptions: {
            onConnect: (connectionParams, webSocket) => {
                let {remoteAddress, remotePort} = webSocket._socket;
                console.log(`websocket connected to ${remoteAddress}:${remotePort}`);
                setTimeout(notify, 10, TASKS_CHANGED, getStats(DB.data))
            }
        }
    });
}

module.exports = {
    getApolloServer
};
