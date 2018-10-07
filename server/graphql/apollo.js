const {ApolloServer} = require("apollo-server-express");
const {resolverGenerator} = require("./resolver");
const {typeDefs} = require("./query");

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
        console.info(
          `websocket disconnected from ${remoteAddress}:${remotePort}`
        );
      }
    },
    context: ({req, payload}) => {
      if (payload) {
        const {variables} = payload;
        return {...variables};
      }
      const {token, user, isExpired = false} = req;
      return {token, user, isExpired};
    }
  });
}

module.exports = {
  getApolloServer
};
