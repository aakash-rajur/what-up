const {PubSub} = require('apollo-server-express');
const {getTimestamp} = require('../utils/library');

let instance = null;

class Publisher {
	constructor() {
		this.notify = this.notify.bind(this);
		this.notifyDeferred = this.notifyDeferred.bind(this);
		this.pubsub = new PubSub();
		this.asyncIterator = this.pubsub.asyncIterator.bind(this.pubsub);
	}
	
	async notify(event, data = {}) {
		if (data instanceof Function)
			data = await data();
		this.pubsub.publish(event, {
			[event]: {
				...data,
				timestamp: getTimestamp()
			}
		});
	}
	
	notifyDeferred(event, data = {}) {
		setImmediate(this.notify, event, data);
	}
}

function getPublisher() {
	if (!instance)
		instance = new Publisher();
	return instance;
}

module.exports = getPublisher;
