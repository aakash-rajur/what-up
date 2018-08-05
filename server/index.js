require('dotenv').config();
const {getApolloServer} = require("./apollo");
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');

const PORT = process.env.SERVER_PORT;

function main() {
    return new Promise((resolve, reject) => {
        let DB = {data: require('../mock/tasks')},
            apollo = getApolloServer(DB),
            app = express();

        app.use(morgan('combined'));

        app.use('*', cors({origin: 'http://localhost:4000'}));

        apollo.applyMiddleware({app});

        app.get('/data', (req, res) => res.send(DB));

        const server = http.createServer(app);
        apollo.installSubscriptionHandlers(server);

        server.listen(PORT, err =>
        err ? reject(err): resolve(`🚀 Server ready at http://localhost:${PORT}${apollo.graphqlPath}\n🚀 Subscriptions ready at ws://localhost:${PORT}${apollo.subscriptionsPath}`))
    })
}


main().then(console.log).catch(console.error);
