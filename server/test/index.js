require('dotenv').config();
const {startServer, stopServer} = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const {expect} = chai;
const should = chai.should();

chai.use(chaiHttp);
const SERVER_URL = `http:\\\\localhost:${process.env.SERVER_PORT}`;
const API_URL = process.env.REACT_APP_API_URL;
const graphql = chai.request(API_URL);
let DB = null;

function testDate() {
    it('data should not be null', done => {
        DB = {data: require('../../mock/tasks')};
        expect(DB.data).to.not.be.null;
        done();
    });

    it('api should return valid data', async () => {
        let res = await chai.request(SERVER_URL).get('/data');
        res.should.have.status(200);
        res.should.be.json;
        res.body.data.should.be.an('array');
        res.body.should.be.deep.equal(DB);
        return res;
    });
}

function testQuery() {
    it('query tasks', async () => {
        let res = await graphql.post('/graphql')
            .send({query: "query{tasks{id, description, status, created, updated}}"});
        res.should.have.status(200);
        res.should.be.json;
        let {tasks: [task]} = res.body.data;
        ['id', 'description', 'status', 'created', 'updated']
            .forEach(property => {
                task.should.have.property(property);
                task[property].should.be.a('string');
            });
        return res;
    });
}

function testMutation() {
    let newTaskID = null,
        tests = [{
            name: 'add new task',
            args: null,
            query: () => "mutation{  add(description:\"new task\")}",
            test: (args, res) => {
                res.body.data.should.have.property('add');
                newTaskID = res.body.data.add;
                newTaskID.should.be.a('string');
            }
        }, {
            name: 'edit description',
            args: {description: 'hello world'},
            query: ({description}) => `mutation {edit(id:"${newTaskID}", description:"${description}"){id, description, status, updated}}`,
            test: ({description}, res) => {
                let {edit} = res.body.data;
                ['id', 'description', 'status', 'updated']
                    .forEach(property => {
                        edit.should.have.property(property);
                        edit[property].should.be.a('string');
                    });
                edit.id.should.equal(newTaskID);
                edit.description.should.equal(description);
                edit.status.should.equal('CREATED');
            }
        }, {
            name: 'update status',
            args: {newStatus: 'COMPLETED'},
            query: ({newStatus}) => `mutation{update(id:"${newTaskID}" status:"${newStatus}"){id, description, status, updated, created}}`,
            test: ({newStatus}, res) => {
                let {update} = res.body.data;
                ['id', 'description', 'status', 'updated', 'created']
                    .forEach(property => {
                        update.should.have.property(property);
                        update[property].should.be.a('string');
                    });
                update.id.should.equal(newTaskID);
                update.status.should.equal(newStatus);
            }
        }, {
            name: 'remove task',
            args: null,
            query: () => `mutation {remove(id:"${newTaskID}"){id, description, status, updated, created}}`,
            test: (args, res) => {
                let {remove} = res.body.data;
                ['id', 'description', 'status', 'updated', 'created']
                    .forEach(property => {
                        remove.should.have.property(property);
                        remove[property].should.be.a('string');
                    });
                remove.id.should.equal(newTaskID);
                remove.status.should.equal('CANCELLED');
            }
        }];

    tests.forEach(({name, args, query, test}) =>
        it(name, async () => {
            try {
                let res = await graphql.post('/graphql')
                    .send({query: query(args)});
                res.should.have.status(200);
                res.should.be.json;
                test(args, res);
            } catch (e) {
                console.error(e);
            }
        }));
}

describe('hooks', () => {

    before(startServer);

    after(stopServer);

    describe('load data', testDate);

    describe('graphql query', testQuery);

    describe('graphql mutation', testMutation);

});
