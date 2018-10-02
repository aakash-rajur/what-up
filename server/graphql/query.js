const gql = require('graphql-tag');

const typeDefs = gql`
    "possible states any task can be in"
    enum TASK_STATUS {
        CREATED,
        COMPLETED,
        CANCELLED
    }
    
    "data structure to represent a task"
    type Task {
        "task generated ID"
        id: String!,
        "task description set by user"
        description: String!,
        "status of the task, can be any one of TASK_STATUS"
        status: TASK_STATUS
        "timestamp when this task was created"
        created: String!,
        "timestamp when this task was last updated"
        updated: String!
    }

    "data structure to represent statistics of user's tasks"
    type Stat {
        "timestamp when this any stat was calculated"
        timestamp: String!,
        "no of tasks that are in unfinished state"
        CREATED: Int,
        "no of tasks that have been completed"
        COMPLETED: Int,
        "no of tasks that have been cancelled"
        CANCELLED: Int,
        "total no of tasks"
        ALL: Int
    }
    
    "data structure to represent a notification"
    type Notification {
        "timestamp when this notification was sent"
        timestamp: String!,
        "what this notification represents"
        action: String!,
        "any additional data that needs to sent over, can be stringified JSON"
        data: String!
    }

    "root query schema"
    type Query {
        "stub query, if name arg is provided, say hello {name}"
        hello(name: String): String!,
        "list of all tasks belonging to the user"
        tasks(
            "task filter, can be on of TASK_STATUS"
            filter: String,
            "timestamp to invalidate cache"
            timestamp: String
        ): [Task],
        "create or restore user session"
        session: String!
    }

    type Mutation {
        "stub query, if name arg is provided, say hello {name}"
        hello(name: String): String!,
        "add new task for the user, returns the taskID"
        add(
            "description of the new task"
            description: String!
        ): String!,
        "remove a particular task, returns update timestamp"
        remove(
            "id of the task that needs to be cancelled/removed, won't be removed from DB"
            id: String!
        ): String!,
        "edit task description, returns update timestamp of that task"
        edit(
            "id of the task whose description needs to be updated"
            id: String!,
            "new description for the selected task"
            description: String!
        ): String!
        "update task status, returns update timestamp of that task"
        update(
            "id of the task whose status needs to be updated"
            id: String!,
            "new status of the selected task"
            status: String!
        ): String!,
        "updated the task status for all task, returns the update count"
        updateAll(
            "filter of tasks whose status needs to be updated"
            filter:String!,
            "new status of those tasks"
            status: String!
        ): Int
    }

    type Subscription {
        "subscription to listen to user task stat changes"
        TASKS_CHANGED(
            "session token to create a unique channel"
            token: String
        ): Stat!,
        "subscription to listen to notifications"
        ON_NOTIFICATION(
            "session token to create a unique channel"
            token: String
        ): Notification!
    }
`;

module.exports = {
	typeDefs
};