import {configure, mount, render, shallow} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import 'jest-enzyme';
import fetch from 'node-fetch';
import {stub, spy} from 'sinon';
import WebSocket from 'ws';

configure({adapter: new Adapter()});

global.shallow = shallow;
global.render = render;
global.mount = mount;
global.stub = stub;
global.spy = spy;
global.WebSocket = WebSocket;
global.fetch = fetch;
