require('dotenv').config();
const {getApolloServer} = require("./apollo");
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const connectDB = require('./db');

const {
	SERVER_PORT: PORT,
	PG_URL,
	NODE_ENV
} = process.env;
const TESTING = NODE_ENV === 'test';
let server = null, postgres = null;

async function stopServer() {
	if (!server) return;
	console.log('\nshutting down server');
	postgres && await postgres.disconnect();
	server.close();
	console.log('server shut down');
	process.exit(0);
}

function startServer() {
	return new Promise((resolve, reject) => {
		let DB = {data: [...require('../mock/tasks')]},
			apollo = getApolloServer(DB),
			app = express();
		
		postgres = connectDB(PG_URL);
		
		!TESTING && app.use(morgan('combined'));
		if (NODE_ENV === 'production') {
			process.on('SIGINT', stopServer);
			process.on('SIGUSR1', stopServer);
			process.on('SIGUSR2', stopServer);
		}
		
		app.use('*', cors({origin: '*'}));
		
		apollo.applyMiddleware({app});
		
		app.get('/data', (req, res) => res.send(DB));
		
		app.get('/reset', (req, res) => {
			DB.data = [...require('../mock/tasks')];
			res.send(DB);
		});
		
		app.get('/', async (req, res) => {
			res.send(await postgres.getTasks('hello'))
		});
		
		server = http.createServer(app);
		apollo.installSubscriptionHandlers(server);
		
		server.listen(PORT, err => {
			if (err) return reject(err);
			let greet = `🚀 Server ready at http://localhost:${PORT}${apollo.graphqlPath}\n🚀 Subscriptions ready at ws://localhost:${PORT}${apollo.subscriptionsPath}`;
			if (TESTING) console.log(greet);
			resolve(greet);
		})
	});
}

module.exports = {
	startServer,
	stopServer
};

!TESTING && startServer().then(console.log).catch(console.error);
