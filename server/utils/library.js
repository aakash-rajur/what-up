const {
	REACT_APP_TASK_CREATED: TASK_CREATED,
	REACT_APP_TASK_COMPLETED: TASK_COMPLETED,
	REACT_APP_TASK_CANCELLED: TASK_CANCELLED,
	REACT_APP_TASK_ALL: TASK_ALL,
	REACT_APP_TASKS_CHANGED: TASKS_CHANGED,
	REACT_APP_SESSION_CHANGE: SESSION_CHANGE,
	REACT_APP_ON_NOTIFICATION: ON_NOTIFICATION,
	SESSION_SECRET,
	SESSION_TIMEOUT,
	PG_URL,
	DATABASE_URL
} = process.env;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const connectDB = require('../modules/db');

function getDB() {
	let url = DATABASE_URL || PG_URL;
	return connectDB(url);
}

function getTimestamp() {
	return Date.now().toString(10);
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

function verifySession(session = "") {
	return jwt.verify(session, SESSION_SECRET).user;
}

function decodeSession(session=""){
	return jwt.decode(session).user;
}

async function authenticateUser(req, res, next) {
	let {session, action = 'NONE'} = req.headers;
	req.token = session;
	req.action = action;
	req.isExpired = false;
	if (!session) return next();
	try {
		let user = verifySession(session);
		const postgres = getDB();
		if ((await postgres.doesUserExist(user)).does_user_exist)
			req.user = user;
	} catch (e) {
		if (e.name === 'TokenExpiredError') {
			req.user = jwt.decode(session).user;
			req.isExpired = true;
		} else console.error(e);
	}
	next();
}

module.exports = {
	TASK_CREATED,
	TASK_COMPLETED,
	TASK_CANCELLED,
	TASK_ALL,
	TASKS_CHANGED,
	SESSION_CHANGE,
	ON_NOTIFICATION,
	createUser,
	getStats,
	decodeSession,
	authenticateUser,
	getDB,
	getTimestamp
};
