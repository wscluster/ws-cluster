/*!
 * Session Module
 * @author Lanfei
 * @module session
 */
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var utils = require('./utils');

var events = [
	'newListener', 'removeListener',
	'ping', 'pong', 'end', 'close', 'error',
	'raw', 'subscribe', 'unsubscribe', 'message'
];

function Session() {
	this._channels = [];
	this._middlewares = [];
	this._ackTimers = {};
	this._ackCallbacks = {};
	this._ackEventCounter = 0;

	this.ackTimeout = 10000;
	this.pingTimeout = 10000;
	this.pingInterval = 60000;

	EventEmitter.call(this);
	this._wsSession.on('data', this._handleData.bind(this));
	['ping', 'pong', 'end', 'close', 'error'].forEach(function (event) {
		this._wsSession.on(event, EventEmitter.prototype.emit.bind(this, event));
	}, this);
}

util.inherits(Session, EventEmitter);

Session.prototype.setEncoding = function (encoding) {
	this._wsSession.setEncoding(encoding);
};

Session.prototype.subscriptions = function () {
	return this._channels.concat();
};

Session.prototype.isSubscribed = function (channel) {
	return this._channels.indexOf(channel) >= 0;
};

Session.prototype.use = function (fn) {
	this._middlewares.push(fn);
};

Session.prototype.sendObject = function (event, callback) {
	if (callback) {
		var self = this;
		var eid = ++this._ackEventCounter;
		event.eid = eid;
		this._ackCallbacks[eid] = callback;
		this._ackTimers[eid] = setTimeout(function () {
			delete self._ackCallbacks[eid];
			delete self._ackTimers[eid];
			callback(new Error('Acknowledgement timeout'));
		}, this.ackTimeout);
	}
	this._wsSession.sendText(JSON.stringify(event));
};

Session.prototype.emit = function (event, data, callback) {
	if (events.indexOf(event) >= 0) {
		EventEmitter.prototype.emit.apply(this, arguments);
	} else {
		this.sendObject({
			type: event,
			data: data
		}, callback);
	}
};

Session.prototype.off = EventEmitter.prototype.removeListener;

Session.prototype.publish = function (channel, data, callback) {
	this.sendObject({
		type: 'message',
		channel: channel,
		data: data
	}, callback);
};

Session.prototype.close = function (code, reason) {
	this._wsSession.close(code, reason);
};

Session.prototype.end = function () {
	this._wsSession.end();
};

Session.prototype.destroy = function () {
	this._wsSession.destroy();
};

Session.prototype._error2Object = function (error) {
	if (error instanceof Error) {
		var object = {};
		object['message'] = error.message;
		Object.keys(error).forEach(function (key) {
			object[key] = error[key];
		});
		return object;
	} else {
		return error;
	}
};

Session.prototype._object2Error = function (object) {
	if (utils.isObject(object)) {
		var error = new Error();
		Object.keys(object).forEach(function (key) {
			error[key] = object[key];
		});
		return error;
	} else {
		return object;
	}
};

Session.prototype._runMiddlewares = function (event, callback) {
	var self = this;
	var middlewares = this._middlewares;

	function run(i) {
		var fn = middlewares[i];
		if (fn) {
			fn.call(self, event, function (err) {
				if (err) {
					callback.call(self, err);
				} else {
					run(i + 1);
				}
			});
		} else {
			callback.call(self);
		}
	}

	run(0);
};

Session.prototype._handleData = function (data) {
	// if (!utils.isString(data)) {
	// 	this.emit('raw', data);
	// 	return;
	// }
	try {
		var event = JSON.parse(data);
		var type = event['type'];
		var rid = event['rid'];
		if (rid) {
			var callback = this._ackCallbacks[rid];
			clearTimeout(this._ackTimers[rid]);
			callback && callback.call(this, this._object2Error(event['data']));
			delete this._ackTimers[rid];
			delete this._ackCallbacks[rid];
			return;
		}
		this._runMiddlewares(event, function (err) {
			var eid = event['eid'];
			if (eid) {
				this.sendObject({
					data: this._error2Object(err),
					rid: eid
				});
			}
			if (!err) {
				var channel = event['channel'];
				var data = event['data'];
				if (type === 'subscribe') {
					this._handleSubscribe(channel);
				} else if (type === 'unsubscribe') {
					this._handleUnsubscribe(channel);
				} else if (type === 'message') {
					EventEmitter.prototype.emit.call(this, 'message', channel, data);
				} else {
					EventEmitter.prototype.emit.call(this, type, data);
				}
			}
		});
	} catch (e) {
	}
};

Session.prototype._handleSubscribe = function (channel) {
	channel = String(channel).trim();
	var index = this._channels.indexOf(channel);
	if (channel && index < 0) {
		this.emit('subscribe', channel);
		this._channels.push(channel);
	}
};

Session.prototype._handleUnsubscribe = function (channel) {
	channel = String(channel).trim();
	var index = this._channels.indexOf(channel);
	if (index >= 0) {
		this.emit('unsubscribe', channel);
		this._channels.splice(index, 1);
	}
};

module.exports = Session;
