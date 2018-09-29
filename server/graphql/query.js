const gql = require('graphql-tag');

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

module.exports = {
	typeDefs
};