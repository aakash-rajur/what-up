require('dotenv').config();
const {startServer, stopServer} = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const {expect} = chai;
const should = chai.should();
const jwt = require('jsonwebtoken');
const {getDB} = require('../utils/library');

chai.use(chaiHttp);
const SERVER_URL = `http://localhost:${process.env.SERVER_PORT}`;
const API_URL = `${SERVER_URL}/graphql`;
const graphql = chai.request(API_URL);
let cookies = null;

function testSession() {
	it('api should create a session', async () => {
		let res = await chai.request(SERVER_URL).get('/');
		await res.should.have.status(200);
		await expect(res.text).to.equal('hello world');
		await res.headers['set-cookie'].should.be.an('array');
		cookies = res.headers['set-cookie'];
		return res;
	});
}

function testAPI() {
	let task1ID = -1,
		task2ID = -1,
		task3ID = -1,
		tests = [{
			name: 'add new task1',
			query: () => "mutation{add(description:\"new task1\")}",
			test: async res => {
				await res.body.data.should.have.property('add');
				await res.body.data.add.should.be.a('string');
				task1ID = parseInt(res.body.data.add, 10);
			}
		}, {
			name: 'add new task2',
			query: () => "mutation{add(description:\"new task2\")}",
			test: async res => {
				await res.body.data.should.have.property('add');
				await res.body.data.add.should.be.a('string');
				task2ID = parseInt(res.body.data.add, 10);
			}
		}, {
			name: 'add new task3',
			query: () => "mutation{add(description:\"new task3\")}",
			test: async res => {
				await res.body.data.should.have.property('add');
				await res.body.data.add.should.be.a('string');
				task3ID = parseInt(res.body.data.add, 10);
			}
		}, {
			name: 'update all tasks',
			query: () => `mutation{updateAll(filter:"ALL",status:"COMPLETED")}`,
			test: async res => {
				await res.body.data.should.have.property('updateAll');
				await res.body.data.updateAll.should.be.a('number');
				await expect(res.body.data.updateAll).to.equal(3);
			}
		}, {
			name: 'edit task description',
			query: () => `mutation {edit(id:"${task1ID}", description:"helloworld")}`,
			test: async res => {
				await res.body.data.should.have.property('edit');
				await res.body.data.edit.should.be.a('string');
				let date = new Date(res.body.data.edit);
				await expect(isNaN(date)).to.be.false;
			}
		}, {
			name: 'update task',
			args: {newStatus: 'COMPLETED'},
			query: () => `mutation{update(id:"${task2ID}" status:"CREATED")}`,
			test: async res => {
				await res.body.data.should.have.property('update');
				await res.body.data.update.should.be.a('string');
				let date = new Date(res.body.data.update);
				await expect(isNaN(date)).to.be.false;
			}
		}, {
			name: 'cancel task',
			query: () => `mutation{remove(id:"${task3ID}")}`,
			test: async res => {
				await res.body.data.should.have.property('remove');
				await res.body.data.remove.should.be.a('string');
				let date = new Date(res.body.data.remove);
				await expect(isNaN(date)).to.be.false;
			}
		}, {
			name: 'fetch tasks',
			query: () => `query{tasks(filter:"ALL", timestamp:"${new Date().valueOf()}"){id, description, status, created, updated}}`,
			test: async res => {
				await res.body.data.should.have.property('tasks');
				await res.body.data.tasks.should.be.a('array');
				await expect(res.body.data.tasks.length).to.equal(3);
				let {tasks} = res.body.data,
					fields = ['id', 'description', 'created', 'updated'],
					template = [{
						task: tasks[0],
						id: task3ID,
						status: 'CANCELLED'
					}, {
						task: tasks[1],
						id: task2ID,
						status: 'CREATED'
					}, {
						task: tasks[2],
						id: task1ID,
						status: 'COMPLETED'
					}];
				await Promise.all(template.map(async ({task, id, status}) => {
					await Promise.all(fields.map(field => task.should.have.property(field)));
					await expect(parseInt(task.id, 10)).to.equal(id);
					await expect(task.status).to.equal(status);
				}));
			}
		}];
	
	tests.forEach(({name, query, test}) =>
		it(name, async () => {
			let res = await graphql
				.post('/graphql')
				.set('Cookie', cookies)
				.type("json")
				.send({query: query()});
			await res.should.have.status(200);
			await res.should.be.json;
			await test(res);
			return res;
		}));
}

async function cleanUp() {
	let postgres = getDB(),
		session = cookies[0].substring(cookies[0].indexOf('=') + 1,
			cookies[0].indexOf(';')),
		{user} = jwt.decode(session);
	await postgres.deleteTasks(user);
	await postgres.deleteUser(user);
	return await stopServer();
}

describe('hooks', () => {
	
	before(startServer);
	
	after(cleanUp);
	
	describe('check session', testSession);
	
	describe('graphql api', testAPI);
});
