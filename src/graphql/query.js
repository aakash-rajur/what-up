import gql from "graphql-tag";

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