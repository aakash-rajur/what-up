import {configure, mount, render, shallow} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import 'jest-enzyme';
import {JSDOM} from 'jsdom';
import fetch from 'node-fetch';
import {spy, stub} from 'sinon';
import WebSocket from 'ws';

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

function copyProps(src, target) {
	const props = Object.getOwnPropertyNames(src)
		.filter(prop => typeof target[prop] === 'undefined')
		.reduce((result, prop) => ({
			...result,
			[prop]: Object.getOwnPropertyDescriptor(src, prop),
		}), {});
	Object.defineProperties(target, props);
}

global.window = window;
global.document = window.document;
global.navigator = {
	userAgent: 'node.js',
};
copyProps(window, global);

configure({adapter: new Adapter()});

global.shallow = shallow;
global.render = render;
global.mount = mount;
global.stub = stub;
global.spy = spy;

global.WebSocket = WebSocket;
global.fetch = fetch;