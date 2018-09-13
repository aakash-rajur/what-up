require('dotenv').config();
const {getApolloServer} = require("./utils/apollo");
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const http = require('http');
const {authenticateUser, getDB} = require('./utils/library');
const {
	SERVER_PORT,
	NODE_ENV,
	FRONTEND_URL,
	PORT: HEROKU_PORT
} = process.env;

const PORT = SERVER_PORT || HEROKU_PORT || 8080;
const TESTING = NODE_ENV === 'test';
let server = null, postgres = null;

async function stopServer() {
	if (!server) return;
	console.info('shutting down server');
	postgres && await postgres.disconnect();
	server.close();
	console.info('server shut down');
	process.exit(0);
}

function startServer() {
	return new Promise((resolve, reject) => {
		console.info('starting server');
		let apollo = null,
			app = express(),
			corsConfig = {
				origin: FRONTEND_URL.split(','),
				credentials: true,
				allowedHeaders: [
					'action',
					'session',
					'content-type'
				],
				exposedHeaders: [
					'Access-Control-Allow-Methods',
					'Access-Control-Allow-Headers'
				],
				optionsSuccessStatus: 200
			};
		
		postgres = getDB();
		apollo = getApolloServer(postgres);
		
		//NODE_ENV === 'production' && app.use(morgan('combined'));
		if (NODE_ENV === 'production') {
			process.on('SIGINT', stopServer);
			process.on('SIGUSR1', stopServer);
			process.on('SIGUSR2', stopServer);
		}
		
		app.use(cors(corsConfig));
		app.use(cookieParser());
		app.options('*', cors(corsConfig));
		app.use('*', authenticateUser);
		apollo.applyMiddleware({cors: corsConfig, app});
		
		server = http.createServer(app);
		apollo.installSubscriptionHandlers(server);
		
		app.get('/', async (req, res) => res.send('hello world'));
		
		server.listen(PORT, err => {
			if (err) return reject(err);
			resolve(`🚀 Server ready at http://localhost:${PORT}${apollo.graphqlPath}\n🚀 Subscriptions ready at ws://localhost:${PORT}${apollo.subscriptionsPath}`);
		})
	});
}

module.exports = {
	startServer,
	stopServer
};

!TESTING && startServer().then(console.log).catch(console.error);
