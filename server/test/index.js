require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const {expect} = chai;
const should = chai.should();
const SERVER_HOST = `localhost:${process.env.SERVER_PORT}`;
const API_URL = `http://${SERVER_HOST}/graphql`;
const WS_URL = `ws://${SERVER_HOST}/graphql`;
const graphql = chai.request(API_URL);

const {ApolloClient} = require("apollo-client");
const WebSocket = require('ws');
const {split} = require("apollo-link");
const {onError} = require("apollo-link-error");
const {HttpLink} = require("apollo-link-http");
const {WebSocketLink} = require('apollo-link-ws');
const {getMainDefinition} = require("apollo-utilities");
const {InMemoryCache} = require("apollo-cache-inmemory");
const {ApolloLink} = require("apollo-link");
const gql = require('graphql-tag');
const fetch = require("node-fetch");

const jwt = require('jsonwebtoken');
const {startServer, stopServer} = require('../index');
const {getDB} = require('../utils/library');

const ON_SERVER_NOTIFICATION = gql`
    subscription onServerNotification {
        ON_NOTIFICATION {
            timestamp,
            action,
            data
        }
    }
`;

let client = null,
	session = null,
	cookies = null;

async function setupServer() {
	console.log(await startServer());
	
	const wsLink = new WebSocketLink({
			uri: WS_URL,
			options: {
				timeout: 600000,
				inactivityTimeout: 0,
				reconnect: true,
				reconnectionAttempts: 3
			},
			webSocketImpl: WebSocket
		}),
		httpLink = new HttpLink({
			uri: API_URL,
			credentials: 'include',
			fetch
		});
	
	wsLink.subscriptionClient.maxConnectTimeGenerator.duration = () =>
		wsLink.subscriptionClient.maxConnectTimeGenerator.max;
	
	client = new ApolloClient({
		link: ApolloLink.from([
			onError(
				({graphQLErrors, networkError}) => {
					if (graphQLErrors)
						graphQLErrors.map(({message, locations, path}) =>
							console.error(
								`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
							),
						);
					if (networkError) console.error(`[Network error]: ${JSON.stringify(networkError)}`);
				}
			),
			split(
				({query}) => {
					const {kind, operation} = getMainDefinition(query);
					return kind === 'OperationDefinition' && operation === 'subscription';
				},
				wsLink,
				httpLink
			)
		]),
		cache: new InMemoryCache()
	});
	
	
	let notification = await new Promise((resolve, reject) => {
		client.subscribe({
			query: ON_SERVER_NOTIFICATION
		}).subscribe({
			next: resolve,
			error: reject
		})
	});
	
	const {
		data: {
			ON_NOTIFICATION: {
				timestamp,
				action,
				data
			}
		}
	} = notification;
	
	if (!timestamp || !action || !data || action !== 'NEW_SESSION')
		return Promise.reject('session object is invalid!');
	const {token, message} = JSON.parse(data);
	session = {
		timestamp,
		token,
		message
	};
	console.info(session.message);
	cookies = [`session=${token}`];
}

async function cleanUp() {
	if (!session) return Promise.reject(`session doesn't exist`);
	let postgres = getDB(),
		{user} = jwt.decode(session.token);
	await postgres.deleteTasks(user);
	await postgres.deleteUser(user);
	return await stopServer();
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

describe('GraphQL tests', () => {
	
	before(setupServer);
	
	after(cleanUp);
	
	it('hello test world', () => {
		return new Promise(resolve =>
			setTimeout(resolve, 1500, 'setup complete')
		);
	});
	
	
	describe('graphql api', testAPI);
});
