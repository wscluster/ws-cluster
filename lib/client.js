/*!
 * Client Module
 * @author Lanfei
 * @module server
 */
var util = require('util');
var ws = require('websocket-lib');
var Session = require('./session');

function Client(options, connectListener) {
	var self = this;
	options = options || {};

	this.ackTimeout = Number(options['ackTimeout']) || 1000;
	this.pingTimeout = Number(options['pingTimeout']) || 10000;
	this.pingInterval = Number(options['pingInterval']) || 60000;

	ws.Client.call(this, options, function (session) {
		session.ackTimeout = self.ackTimeout;
		session.setHeartbeat(self.pingInterval, self.pingTimeout);
		connectListener.apply(self, arguments);
	});
}

util.inherits(Client, ws.Client);

function ClientSession(request, socket) {
	this._wsSession = new ws.Client.Session(request, socket);
	Session.call(this);
}

util.inherits(ClientSession, Session);

ClientSession.prototype.subscribe = function (channel, callback) {
	var self = this;
	this.sendObject({
		type: 'subscribe',
		channel: channel
	}, function (err) {
		if (!err && channel) {
			self._handleSubscribe(channel);
		}
		if (callback) {
			callback.call(self, err);
		}
	});
};

ClientSession.prototype.unsubscribe = function (channel, callback) {
	var self = this;
	this.sendObject({
		type: 'unsubscribe',
		channel: channel
	}, function (err) {
		if (!err && channel) {
			self._handleUnsubscribe(channel);
		}
		if (callback) {
			callback.call(self, err);
		}
	});
};

ClientSession.prototype.setHeartbeat = function (interval, timeout) {
	this.on('close', this._stopHeartBeat);
	this.removeListener('pong', this._handlePong);
	this.pingInterval = interval;
	this.pingTimeout = timeout;
	if (interval && timeout) {
		this.on('pong', this._handlePong);
		this._heartbeat();
	}
};

ClientSession.prototype._heartbeat = function () {
	var self = this;
	this._wsSession.sendPing();
	clearTimeout(this._pingTimer);
	clearTimeout(this._pongTimer);
	this._pongTimer = setTimeout(function () {
		self.close();
	}, this.pingTimeout);
};

ClientSession.prototype._handlePong = function () {
	var self = this;
	clearTimeout(this._pingTimer);
	clearTimeout(this._pongTimer);
	this._pingTimer = setTimeout(function () {
		self._heartbeat();
	}, this.pingInterval);
};

ClientSession.prototype._stopHeartBeat = function () {
	clearTimeout(this._pingTimer);
	clearTimeout(this._pongTimer);
};

module.exports = Client;
Client.Session = ClientSession;
