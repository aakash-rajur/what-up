require('dotenv').config();
const {Pool} = require('pg');

let instance = null;

function formatQuery(result) {
	let {
		rowCount,
		rows
	} = result;
	if (rowCount === 1) return rows[0];
	return rows;
}

class Postgres {
	constructor(uri = null) {
		if (!uri) throw new Error('uri not provided');
		this.uri = uri;
		this.pool = new Pool({connectionString: uri});
	}
	
	checkConnection() {
		if (!this.uri) throw new Error('uri not provided');
		if (!this.pool) throw new Error('pool not instantiated');
	}
	
	disconnect() {
		this.checkConnection();
		return this.pool.end();
	}
	
	addUser(hash) {
		this.checkConnection();
		return formatQuery(this.pool.query(`select * from add_user('${hash}')`));
	}
	
	async deleteUser(hash) {
		this.checkConnection();
		await this.pool.query(`select * from delete_tasks('${hash}')`);
		return formatQuery(await this.pool.query(`select * from delete_user('${hash}')`));
	}
	
	async addTask(hash, description) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from add_task('${hash}', '${description}')`));
	}
	
	async updateTask(taskId, newStatus) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from update_task('${taskId}','${newStatus}')`));
	}
	
	async editTask(taskId, newDescription) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from edit_task('${taskId}', '${newDescription}')`));
	}
	
	async getTasks(hash) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from get_tasks('${hash}')`));
	}
}

function getDB(uri) {
	if (!instance)
		instance = new Postgres(uri);
	return instance;
}

module.exports = getDB;
