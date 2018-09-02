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
		return formatQuery(await this.pool.query(`select * from add_task('${hash}', '${description}')`));
	}
	
	async updateTask(taskId, newStatus) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from update_task('${taskId}','${newStatus}')`));
	}
	
	async editTask(taskId, description) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from edit_task('${taskId}', '${description}')`));
	}
	
	async deleteTasks(user) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from delete_tasks('${user}')`));
	}
	
	async getTasks(hash, status) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from get_tasks('${hash}', '${status}')`), false);
	}
	
	async updateAllTasks(hash, selected, status) {
		this.checkConnection();
		return formatQuery(await this.pool.query(`select * from update_all_tasks('${hash}','${selected}','${status}')`));
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
