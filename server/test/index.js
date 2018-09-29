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
const {createHttpLink} = require("apollo-link-http");
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

const TASKS_UPDATED = gql`
    subscription onTasksChanged($token: String!) {
        TASKS_CHANGED(token: $token) {
            timestamp,
            CREATED,
            COMPLETED,
            CANCELLED,
            ALL
        }
    }
`;

const CREATE_SESSION = gql`
    query createSession{
        session
    }
`;

const ADD_TASK = gql`
    mutation addTask($description: String!) {
        add(description: $description)
    }
`;

const UPDATE_ALL_TASKS = gql`
    mutation updateAll($filter: String!, $status: String!) {
        updateAll(filter: $filter,status: $status)
    }
`;

const UPDATE_TASK = gql`
    mutation updateTask($id: String!, $status: String!) {
        update(id: $id, status: $status)
    }
`;

const EDIT_TASK = gql`
    mutation editTask($id: String!, $description: String!) {
        edit(id: $id, description: $description)
    }
`;

const CANCEL_TASK = gql`
    mutation removeTask($id: String!) {
        remove(id: $id)
    }
`;

const FETCH_TASKS = gql`
    query fetchTasks($filter: String!, $timestamp: String){
        tasks(filter: $filter, timestamp: $timestamp) {
            id,
            description,
            status,
            created,
            updated
        }
    }
`;

let client = null,
	session = null;

async function setupServer() {
	console.info(await startServer());
	
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
		httpLink = createHttpLink({
			uri: API_URL,
			credentials: 'include',
			fetch
		}),
		authMiddlewareHttp = new ApolloLink((operation, forward) => {
			operation.setContext(({headers = {}}) => {
				if (!session) return headers;
				return {
					headers: {
						...headers,
						session: session.token
					}
				};
			});
			return forward(operation);
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
					if (networkError) {
						console.error(networkError);
					}
				}
			),
			authMiddlewareHttp,
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
	
	
	/*let notification = await new Promise((resolve, reject) => {
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
	console.info(session.message);*/
}

async function clearSession() {
	if (!session) return Promise.reject(`session doesn't exist`);
	let postgres = getDB(),
		{user} = jwt.decode(session.token);
	let res = await postgres.deleteTasks(user);
	res.should.have.property('delete_tasks');
	res.delete_tasks.should.be.a('number');
	res = await postgres.deleteUser(user);
	res.should.have.property('delete_user');
	res.delete_user.should.be.a('number');
	session = null;
	expect(session).to.equal(null);
}

function fetchSession() {
	it('should create new session', async () => {
		let res = await graphql
			.post('/graphql')
			.type('json')
			.send({query: "query{session}"});
		
		await res.should.have.status(200);
		await res.should.be.json;
		await res.body.should.have.property('data');
		await res.body.data.should.have.property('session');
		let {session: provided} = res.body.data;
		provided = JSON.parse(provided);
		provided.should.have.property('token');
		provided.should.have.property('action');
		expect(provided.action).to.equal('NEW_SESSION');
		session = provided;
		console.info(session);
		return res;
	});
	
	it('should restore session', async () => {
		let res = await graphql
			.post('/graphql')
			.type('json')
			.set('session', session.token)
			.send({query: "query{session}"});
		await res.should.have.status(200);
		await res.should.be.json;
		let {session: provided} = res.body.data;
		provided = JSON.parse(provided);
		provided.should.have.property('token');
		provided.should.have.property('action');
		expect(provided.action).to.equal('SESSION_RESTORED');
		expect(provided.token).to.equal(session.token);
		return res;
	});
}

function fetchAPI() {
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
				await Promise.all(
					template.map(
						async ({task, id, status}) => {
							await Promise.all(fields.map(field => task.should.have.property(field)));
							await expect(parseInt(task.id, 10)).to.equal(id);
							await expect(task.status).to.equal(status);
						}
					)
				);
			}
		}];
	
	tests.forEach(
		({name, query, test}) =>
			it(name, async () => {
				let res = await graphql
					.post('/graphql')
					.set('session', session.token)
					.type("json")
					.send({query: query()});
				await res.should.have.status(200);
				await res.should.be.json;
				await test(res);
				return res;
			})
	);
	
	it('clear session', clearSession);
}

function apolloSession() {
	it('should create session', async () => {
		let res = await client.query({
			query: CREATE_SESSION,
			fetchPolicy: 'network-only'
		});
		res.should.have.property('data');
		res.data.should.have.property('session');
		let {session: provided} = res.data;
		provided = JSON.parse(provided);
		provided.should.have.property('token');
		provided.should.have.property('action');
		expect(provided.action).to.equal('NEW_SESSION');
		session = provided;
		console.info(session);
		return res;
	});
	
	it('should restore session', async () => {
		let res = await client.query({
			query: CREATE_SESSION,
			fetchPolicy: 'network-only'
		});
		res.should.have.property('data');
		res.data.should.have.property('session');
		let {session: provided} = res.data;
		provided = JSON.parse(provided);
		provided.should.have.property('token');
		provided.should.have.property('action');
		expect(provided.action).to.equal('SESSION_RESTORED');
		expect(provided.token).to.equal(session.token);
	});
}

function apolloAPI() {
	let task1ID = -1,
		task2ID = -1,
		task3ID = -1,
		tests = [{
			name: 'add new task1',
			mutation: ADD_TASK,
			variables: {
				description: 'new task1'
			},
			test: async res => {
				res.data.should.have.property('add');
				res.data.add.should.be.a('string');
				task1ID = Number.parseInt(res.data.add);
				return task1ID;
			}
		}, {
			name: 'add new task2',
			mutation: ADD_TASK,
			variables: {
				description: 'new task2'
			},
			test: async res => {
				res.data.should.have.property('add');
				res.data.add.should.be.a('string');
				task2ID = Number.parseInt(res.data.add);
				return task2ID;
			}
		}, {
			name: 'add new task3',
			mutation: ADD_TASK,
			variables: {
				description: 'new task3'
			},
			test: async res => {
				res.data.should.have.property('add');
				res.data.add.should.be.a('string');
				task3ID = Number.parseInt(res.data.add);
				return task3ID;
			}
		}, {
			name: 'update all tasks',
			mutation: UPDATE_ALL_TASKS,
			variables: {filter: 'ALL', status: 'COMPLETED'},
			test: async res => {
				res.data.should.have.property('updateAll');
				res.data.updateAll.should.be.a('number');
				return res;
			}
		}, {
			name: 'edit task description',
			mutation: EDIT_TASK,
			variables: () => ({id: task1ID, description: 'helloworld'}),
			test: async res => {
				res.data.should.have.property('edit');
				res.data.edit.should.be.a('string');
				let date = new Date(res.data.edit);
				expect(isNaN(date)).to.equal(false);
				expect(isFinite(date)).to.equal(true);
				return res;
			}
		}, {
			name: 'update task',
			mutation: UPDATE_TASK,
			variables: () => ({id: task2ID, status: 'CREATED'}),
			test: async res => {
				res.data.should.have.property('update');
				res.data.update.should.be.a('string');
				let date = new Date(res.data.update);
				expect(isNaN(date)).to.equal(false);
				expect(isFinite(date)).to.equal(true);
			}
		}, {
			name: 'cancel task',
			mutation: CANCEL_TASK,
			variables: () => ({id: task3ID}),
			test: async res => {
				res.data.should.have.property('remove');
				res.data.remove.should.be.a('string');
				let date = new Date(res.data.remove);
				expect(isNaN(date)).to.equal(false);
				expect(isFinite(date)).to.equal(true);
			}
		}];
	
	tests.forEach(
		({name, mutation, variables, test}) =>
			it(name, async () => {
				if (variables instanceof Function)
					variables = variables();
				try {
					let res = await client.mutate({
						mutation,
						variables
					});
					res.should.have.property('data');
					return await test(res);
				} catch (e) {
					console.error(e);
					throw e;
				}
			})
	);
	
	it('fetch tasks', async () => {
		let res = await client.query({
			query: FETCH_TASKS,
			variables: {filter: 'ALL', timestamp: new Date().valueOf()}
		});
		res.should.have.property('data');
		res.data.should.have.property('tasks');
		expect(res.data.tasks).to.be.a('array');
		let {tasks} = res.data,
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
		return await Promise.all(
			template.map(
				async ({task, id, status}) => {
					await Promise.all(fields.map(field => task.should.have.property(field)));
					await expect(parseInt(task.id, 10)).to.equal(id);
					await expect(task.status).to.equal(status);
				}
			)
		);
	});
	
	it('clear session', clearSession);
}

before(setupServer);

after(stopServer);

describe('start server', () => {
	it('hello test world', () => {
		return new Promise(resolve =>
			setTimeout(resolve, 1500, 'setup complete')
		);
	});
});

describe('session sanity with fetch', fetchSession);

describe('api sanity with fetch', fetchAPI);

describe('session sanity with apollo', apolloSession);

describe('api sanity with apollo', apolloAPI);