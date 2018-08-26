const {
	REACT_APP_TASK_CREATED: TASK_CREATED,
	REACT_APP_TASK_COMPLETED: TASK_COMPLETED,
	REACT_APP_TASK_CANCELLED: TASK_CANCELLED,
	REACT_APP_TASK_ALL: TASK_ALL,
	SESSION_SECRET,
	SESSION_TIMEOUT,
	PG_URL
} = process.env;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const connectDB = require('../db');

function getDB() {
	return connectDB(PG_URL);
}

function getTimestamp() {
	return Date.now().toString(10);
}

function createPublisher(pubsub) {
	return (event, data = {}) => {
		pubsub.publish(event, {
			tasksChanged: {
				...data,
				timestamp: getTimestamp()
			}
		})
	}
}

async function getStats(hash) {
	const postgres = getDB();
	let stats = await postgres.getStats(hash);
	stats = stats.reduce((acc, {status, count}) => {
		acc[TASK_ALL] += (acc[status] = parseInt(count, 10));
		return acc;
	}, {
		[TASK_ALL]: 0,
		[TASK_CREATED]: 0,
		[TASK_COMPLETED]: 0,
		[TASK_CANCELLED]: 0
	});
	return stats;
}

function findTask(tasks = [], id) {
	let task = tasks.find(({id: ID}) => ID === id);
	if (!task) throw new Error(`task with ${id} doesn't exist`);
	return task;
}

function sha1(text) {
	return crypto.createHash('sha256')
		.update(text, 'utf8')
		.digest('hex');
}

function createUser() {
	let session = {
		user: sha1(JSON.stringify({
			random: Math.random(),
			timestamp: Date.now()
		}))
	};
	return {
		user: session.user,
		token: jwt.sign(session, SESSION_SECRET, {expiresIn: SESSION_TIMEOUT})
	};
}

function verifySession(session) {
	return jwt.verify(session, SESSION_SECRET).user;
}

async function authenticateUser(req, res, next) {
	let {session} = req.cookies;
	if (!session) {
		let {user, token} = createUser();
		res.cookie('session', token, {httpOnly: false});
		const postgres = getDB();
		await postgres.addUser(user);
		req.user = user;
	} else {
		try {
			req.user = verifySession(session);
		} catch ({name, message}) {
			const postgres = getDB();
			let status = 500,
				error = JSON.stringify({type: 'JWT_ERROR', name, message});
			if (name === 'TokenExpiredError') {
				//publish to show a message;
				status = 401;
				error = 'UNAUTHORIZED';
				try {
					let {user} = jwt.decode(session);
					await postgres.deleteUser(user);
				} catch (e) {
					console.error(e);
				}
			}
			return res.status(status).send(error);
		}
	}
	next();
}

module.exports = {
	TASK_CREATED,
	TASK_COMPLETED,
	TASK_CANCELLED,
	TASK_ALL,
	verifySession,
	createPublisher,
	getStats,
	authenticateUser,
	getDB
};
