const {
	REACT_APP_TASK_CREATED: TASK_CREATED,
	REACT_APP_TASK_COMPLETED: TASK_COMPLETED,
	REACT_APP_TASK_CANCELLED: TASK_CANCELLED,
	REACT_APP_TASK_ALL: TASK_ALL,
	REACT_APP_TASKS_CHANGED: TASKS_CHANGED,
	REACT_APP_SESSION_CHANGE: SESSION_CHANGE,
	SESSION_SECRET,
	SESSION_TIMEOUT,
	PG_URL,
	DATABASE_URL
} = process.env;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');

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

function verifySession(session) {
	return jwt.verify(session, SESSION_SECRET).user;
}

async function authenticateUser(req, res, next) {
	let {session} = req.cookies;
	try {
		if (!session) {
			let {user, token} = createUser();
			res.cookie('session', token, {httpOnly: true});
			const postgres = getDB();
			console.log(`adding user ${user} with id ${(await postgres.addUser(user)).add_user}`);
			req.user = user;
		} else {
			try {
				req.user = verifySession(session);
			} catch ({name, message}) {
				let status = 500,
					error = JSON.stringify({type: 'JWT_ERROR', name, message});
				if (name === 'TokenExpiredError') {
					status = 401;
					error = 'UNAUTHORIZED';
				}
				res.clearCookie('session');
				req.authError = {status, error};
			}
		}
	} catch (e) {
		console.error(e);
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
	verifySession,
	getStats,
	authenticateUser,
	getDB,
	getTimestamp
};
