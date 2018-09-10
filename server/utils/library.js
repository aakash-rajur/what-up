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
const cookieParser = require('cookie');
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
	let {session, connection = false} = req.cookies;
	req.connection = connection;
	console.log(req.cookies);
	if (!session) return next();
	try {
		let user = verifySession(session);
		const postgres = getDB();
		if ((await postgres.doesUserExist(user)).does_user_exist)
			req.user = user;
	} catch (e) {
		console.error(e);
	}
	next();
}

async function createSession(cookie = '', publisher) {
	const postgres = getDB();
	let {session} = cookieParser.parse(cookie), user = null;
	if (session) {
		let shouldRefresh = false;
		try {
			user = verifySession(session);
			if (!user || !((await postgres.doesUserExist(user)).does_user_exist))
				shouldRefresh = true;
			else setImmediate(async () => {
				publisher.notify(ON_NOTIFICATION, {
					action: 'SESSION_RESTORED',
					data: JSON.stringify({
						message: `Your UserID is ${user}`,
						source: 'WS'
					})
				});
				publisher.notify(TASKS_CHANGED, {...await getStats(user), source: 'WS'});
			});
		} catch (err) {
			const {name} = err;
			shouldRefresh = name === 'TokenExpiredError';
		}
		
		if (shouldRefresh) {
			if (session) {
				try {
					user = jwt.decode(session).user;
					if ((await postgres.doesUserExist(user)).does_user_exist) {
						console.info(`attempting to nuke all data belonging to ${user}`);
						await postgres.deleteTasks(user);
						await postgres.deleteUser(user);
					}
				} catch (e) {
					console.error(e);
				}
			}
			setImmediate(() =>
				publisher.notify(ON_NOTIFICATION, {
					action: 'SESSION_EXPIRED',
					data: JSON.stringify({
						message: 'Session Expired. Please Refresh!',
						source: 'WS'
					})
				}));
		}
	} else {
		let {user, token} = createUser(),
			{add_user: userID} = await postgres.addUser(user);
		console.info(`adding user ${user} with id ${userID}`);
		setImmediate(async () => {
			publisher.notify(ON_NOTIFICATION, {
				action: 'NEW_SESSION',
				data: JSON.stringify({
					token,
					message: `Your UserID is ${user}`,
					source: 'WS'
				})
			});
			publisher.notify(TASKS_CHANGED, {...await getStats(user), source: 'WS'});
		});
	}
}

module.exports = {
	TASK_CREATED,
	TASK_COMPLETED,
	TASK_CANCELLED,
	TASK_ALL,
	TASKS_CHANGED,
	SESSION_CHANGE,
	ON_NOTIFICATION,
	getStats,
	authenticateUser,
	getDB,
	getTimestamp,
	createSession
};
