/*!
 * Bridge Module
 * @author Lanfei
 * @module bridge
 */
function Bridge(broker) {
	var self = this;
	this.broker = broker;
	this.subscribers = {};
	if (broker) {
		broker.on('message', function (channel, data) {
			self.publish(channel, data);
		});
	}
}

Bridge.prototype.attach = function (session) {
	var self = this;
	var broker = this.broker;
	var subscribers = this.subscribers;

	function onSubscribe(channel) {
		var sessions = subscribers[channel];
		if (!sessions) {
			sessions = subscribers[channel] = [];
		}
		var index = sessions.indexOf(session);
		if (index >= 0) {
			return;
		}
		if (broker && !sessions.length) {
			broker.subscribe(channel);
		}
		sessions.push(session);
	}

	function onUnsubscribe(channel) {
		var sessions = subscribers[channel];
		if (!sessions) {
			return;
		}
		var index = sessions.indexOf(session);
		if (index < 0) {
			return;
		}
		sessions.splice(index, 1);
		if (!sessions.length) {
			delete subscribers[channel];
			if (broker) {
				broker.unsubscribe(channel);
			}
		}
	}

	function onMessage(channel, data) {
		if (broker) {
			broker.publish(channel, data);
		} else {
			self.publish(channel, data);
		}
	}

	function onClose() {
		session.removeListener('subscribe', onSubscribe);
		session.removeListener('unsubscribe', onUnsubscribe);
		session.removeListener('message', onMessage);
		session.removeListener('close', onClose);
		session.subscriptions().forEach(onUnsubscribe);
	}

	session.on('subscribe', onSubscribe);
	session.on('unsubscribe', onUnsubscribe);
	session.on('message', onMessage);
	session.on('close', onClose);
};

Bridge.prototype.publish = function (channel, data) {
	var sessions = this.subscribers[channel];
	if (!sessions) {
		return;
	}
	sessions.forEach(function (session) {
		session.publish(channel, data);
	});
};

module.exports = Bridge;
Bridge.Bridge = Bridge;
