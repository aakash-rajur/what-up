import {configure, shallow, mount, render} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {stub} from 'sinon';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import 'jest-enzyme';

configure({adapter: new Adapter()});

global.shallow = shallow;
global.render = render;
global.mount = mount;
global.stub = stub;
global.WebSocket = WebSocket;
global.fetch = fetch;
