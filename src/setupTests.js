import {configure, mount, render, shallow} from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import "jest-enzyme";
import {JSDOM} from "jsdom";
import fetch from "node-fetch";
import {spy, stub} from "sinon";
import WebSocket from "ws";

const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
const {window} = jsdom;

function copyProps(src, target) {
  const props = Object.getOwnPropertyNames(src)
    .filter(prop => typeof target[prop] === "undefined")
    .reduce(
      (result, prop) => ({
        ...result,
        [prop]: Object.getOwnPropertyDescriptor(src, prop)
      }),
      {}
    );
  Object.defineProperties(target, props);
}

global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: "node.js"
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

global.matchSnapshot = function(component) {
  it("match snapshot", () => expect(component).toMatchSnapshot());
};
global.checkDOM = function(component, config = []) {
  return () => {
    if (!component) throw new Error("component not provided");
    config.forEach(({selector, props, children, text}) => {
      let el = component.find(selector);
      props &&
        Object.entries(([key, value]) => expect(el.prop(key)).toBe(value));
      children &&
        children.forEach(({selector, length}) =>
          expect(el.find(selector).length).toBe(length)
        );
      text && expect(el.text()).toBe(text);
    });
  };
};
global.checkEvents = function(component, config = []) {
  return () => {
    if (!component) throw new Error("component not provided");
    config.forEach(
      ({
        selector,
        event,
        args = [],
        callback,
        cArgs = [],
        count = 1,
        custom
      }) => {
        let el = component.find(selector),
          isCalled = Boolean(count);
        custom ? el.prop(event)(...args) : el.simulate(event, ...args);
        expect(callback.called).toBe(isCalled);
        if (!isCalled) return;
        expect(callback.callCount).toBe(count);
        cArgs && expect(callback.calledWith(...cArgs)).toBe(true);
      }
    );
  };
};
