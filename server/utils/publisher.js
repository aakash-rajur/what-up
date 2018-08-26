const {PubSub} = require('apollo-server-express');
const {getTimestamp} = require('./library');

let instance = null;

class Publisher {
	constructor() {
		this.pubsub = new PubSub();
	}
	
	notify(event, data = {}) {
		this.pubsub.publish(event, {
			[event]: {
				...data,
				timestamp: getTimestamp()
			}
		});
	}
	
	asyncIterator(...args) {
		return this.pubsub.asyncIterator(...args);
	}
}

function getPublisher() {
	if (!instance)
		instance = new Publisher();
	return instance;
}

module.exports = {getPublisher};
