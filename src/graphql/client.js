import {InMemoryCache} from "apollo-cache-inmemory";
import ApolloClient from "apollo-client/ApolloClient";
import {ApolloLink, split} from "apollo-link";
import {onError} from "apollo-link-error";
import {createHttpLink} from "apollo-link-http";
import {WebSocketLink} from "apollo-link-ws";
import {getMainDefinition} from "apollo-utilities";
import {API_URL, WS_URL} from "../utils/constants";
import {parseCookie} from "../utils/library";

export default function getApolloClient() {
  const wsLink = new WebSocketLink({
      uri: WS_URL,
      options: {
        timeout: 600000,
        inactivityTimeout: 0,
        reconnect: true,
        reconnectionAttempts: 3
      }
    }),
    httpLink = createHttpLink({
      uri: API_URL,
      credentials: "include"
    }),
    authMiddlewareHttp = new ApolloLink((operation, forward) => {
      operation.setContext(({headers = {}}) => {
        const {session} = parseCookie();
        if (!session) return headers;
        return {
          headers: {
            ...headers,
            session
          }
        };
      });
      return forward(operation);
    }),
    {subscriptionClient} = wsLink;

  subscriptionClient.maxConnectTimeGenerator.duration = () =>
    subscriptionClient.maxConnectTimeGenerator.max;

  return new ApolloClient({
    link: ApolloLink.from([
      onError(({graphQLErrors, networkError}) => {
        if (graphQLErrors)
          graphQLErrors.map(({message, locations, path}) =>
            console.error(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          );
        if (networkError) {
          console.error(networkError);
        }
      }),
      authMiddlewareHttp,
      split(
        ({query}) => {
          const {kind, operation} = getMainDefinition(query);
          return kind === "OperationDefinition" && operation === "subscription";
        },
        wsLink,
        httpLink
      )
    ]),
    cache: new InMemoryCache()
  });
}
