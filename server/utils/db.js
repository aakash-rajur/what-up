require('dotenv').config();
const {NODE_ENV} = process.env;
const {Pool} = require('pg');

let instance = null;

function formatQuery(result, reduce = true) {
	let {
		rowCount,
		rows
	} = result;
	if (reduce && rowCount === 1) return rows[0];
	return rows;
}

class Postgres {
	constructor(uri = null) {
		if (!uri) throw new Error('uri not provided');
		this.uri = uri;
		this.pool = new Pool({
			connectionString: uri,
			ssl: NODE_ENV === 'production'
		});
	}
	
	checkConnection() {
		if (!this.uri) throw new Error('uri not provided');
		if (!this.pool) throw new Error('pool not instantiated');
	}
	
	disconnect() {
		this.checkConnection();
		return this.pool.end();
	}
	
	async addUser(hash) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from add_user('${hash}')`));
	}
	
	async deleteUser(hash) {
		this.checkConnection();
		await this.pool.query(`select * from delete_tasks('${hash}')`);
		return formatQuery(await this.pool.query(`select * from delete_user('${hash}')`));
	}
	
	async addTask(hash, description) {
		this.checkConnection();
		let result = formatQuery(await this.pool.query(`select * from add_task('${hash}', '${description}')`));
		return result.add_task;
	}
	
	async updateTask(taskId, newStatus) {
		this.checkConnection();
		let result = formatQuery(await this.pool.query(`select * from update_task('${taskId}','${newStatus}')`));
		return result.update_task;
	}
	
	async editTask(taskId, description) {
		this.checkConnection();
		let result = formatQuery(await this.pool.query(`select * from edit_task('${taskId}', '${description}')`));
		return result.edit_task;
	}
	
	async deleteTasks(user) {
		this.checkConnection();
		let result = formatQuery(await this.pool.query(`select * from delete_tasks('${user}')`));
		return result.delete_tasks;
	}
	
	async getTasks(hash, status) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from get_tasks('${hash}', '${status}')`), false);
	}
	
	async updateAllTasks(hash, selected, status) {
		this.checkConnection();
		let result = formatQuery(await this.pool.query(`select * from update_all_tasks('${hash}','${selected}','${status}')`));
		return parseInt(result.update_all_tasks, 10);
	}
	
	async getStats(hash) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from get_stats('${hash}')`), false);
	}
	
	query(...args) {
		return this.pool.query(...args);
	}
}

function getDB(uri) {
	if (!instance){
		console.log('environment', NODE_ENV);
		instance = new Postgres(uri);
	}
	return instance;
}

module.exports = getDB;
