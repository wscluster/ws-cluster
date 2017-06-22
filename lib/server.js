/*!
 * Server Module
 * @author Lanfei
 * @module server
 */
var util = require('util');
var ws = require('websocket-lib');
var Bridge = require('./bridge');
var Session = require('./session');

function Server(options, sessionListener) {
	options = options || {};

	var bridge = new Bridge(options['broker']);

	this.on('session', bridge.attach.bind(bridge));
	ws.Server.call(this, options, sessionListener);
}

util.inherits(Server, ws.Server);

function ServerSession(request, socket) {
	this.request = request;
	this.socket = socket;
	this._wsSession = new ws.Server.Session(request, socket);
	Session.call(this);
}

ServerSession.prototype.accept = function (headers) {
	this._wsSession.accept(headers);
};

ServerSession.prototype.reject = function (statusCode, headers, body, encoding) {
	this._wsSession.reject(statusCode, headers, body, encoding);
};

ServerSession.prototype.setHeader = function (name, value) {
	this._wsSession.setHeader(name, value);
};

ServerSession.prototype.writeHead = function (statusCode, statusMessage, headers) {
	this.writeHead(statusCode, statusMessage, headers);
};

util.inherits(ServerSession, Session);

module.exports = Server;
Server.Session = ServerSession;
