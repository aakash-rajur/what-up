import gql from 'graphql-tag';
import {ApolloClient} from 'apollo-client';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {HttpLink} from 'apollo-link-http';
import {onError} from 'apollo-link-error';
import {ApolloLink} from 'apollo-link';
import {WebSocketLink} from 'apollo-link-ws';
import {split} from 'apollo-link';
import {getMainDefinition} from "apollo-utilities";
import {API_URL, WS_URL} from "./constants";

const wsLink = new WebSocketLink({
    uri: WS_URL,
    options: {
        reconnect: true
    }
});

export default new ApolloClient({
    link: ApolloLink.from([
        onError(({graphQLErrors, networkError}) => {
            if (graphQLErrors)
                graphQLErrors.map(({message, locations, path}) =>
                    console.log(
                        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
                    ),
                );
            if (networkError) console.log(`[Network error]: ${JSON.stringify(networkError)}`);
        }),
        split(({query}) => {
                const {kind, operation} = getMainDefinition(query);
                return kind === 'OperationDefinition' && operation === 'subscription';
            },
            wsLink,
            new HttpLink({
                uri: API_URL,
                credentials: 'same-origin'
            }))
    ]),
    cache: new InMemoryCache()
});


export const FETCH_TASKS = gql`
    query fetchTasks($filter: String!, $timestamp: String){
        tasks(filter: $filter, timestamp: $timestamp){
            id,
            description,
            status,
            created,
            updated
        }
    }
`;

export const REMOVE_TASK = gql`
    mutation removeTask($id: String!) {
        remove(id: $id){
            description,
            status
        }
    }
`;

export const EDIT_TASK = gql`
    mutation editTask($id: String!, $description: String!){
        edit(id: $id, description: $description){
            description,
            status
        }
    }
`;

export const UPDATE_TASK = gql`
    mutation updateTask($id: String!, $status: String!){
        update(id: $id, status: $status){
            description,
            status
        }
    }
`;

export const UPDATE_ALL_TASKS = gql`
  mutation updateAll($status: String!){
      updateAll(status: $status)
  } 
`;

export const ADD_TASK = gql`
    mutation addTask($description: String!){
        add(description: $description)
    }
`;

export const TASKS_UPDATED = gql`
    subscription onTasksChanged {
        tasksChanged{
            timestamp,
            CREATED,
            COMPLETED,
            CANCELLED,
            ALL
        }
    }
`;