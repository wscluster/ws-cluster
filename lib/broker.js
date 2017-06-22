/*!
 * Broker Module
 * @author Lanfei
 * @module broker
 */
var EventEmitter = require('events').EventEmitter;

module.exports = function () {
	var broker = new EventEmitter();
	var subscriptions = [];

	broker.subscribe = function (channel) {
		if (subscriptions.indexOf(channel) < 0) {
			subscriptions.push(channel);
		}
	};

	broker.unsubscribe = function (channel) {
		var index = subscriptions.indexOf(channel);
		if (index >= 0) {
			subscriptions.splice(index, 1);
		}
	};

	broker.publish = function (channel, data) {
		process.send({event: 'publish', channel: channel, data: data});
	};

	process.on('message', function (message) {
		if (message['event'] === 'publish') {
			var channel = message['channel'];
			var data = message['data'];
			if (subscriptions.indexOf(channel) >= 0) {
				broker.emit('message', channel, data);
			}
		}
	});

	return broker;
};
