/*!
 * WebSocket Cluster
 * @author Lanfei
 * @module wsc
 */
exports.Broker = require('./lib/broker');
exports.Server = require('./lib/server');
exports.Client = require('./lib/client');
exports.Session = require('./lib/session');

/**
 * Create a WebSocket Cluster Broker Server.
 * @method createBrokerServer
 * @param   {Object}   [options]
 * @param   {Object}   [options.httpServer]        see {@link Server#httpServer}
 * @param   {Boolean}  [options.autoAccept = true] see {@link Server#autoAccept}
 * @return {Server}
 */
exports.createBrokerServer = function (options) {
	return new exports.Broker.Server(options);
};

/**
 * Create a WebSocket Cluster Server.
 * @method createServer
 * @param  {Object}   [options]
 * @param  {Object}   [options.httpServer]        see {@link Server#httpServer}
 * @param  {Boolean}  [options.autoAccept = true] see {@link Server#autoAccept}
 * @param  {Function} [sessionListener]           A listener for the 'session' event.
 * @return {Server}
 */
exports.createServer = function (options, sessionListener) {
	return new exports.Server(options, sessionListener);
};

/**
 * Create a connection to the WebSocket Cluster Server.
 * @param  {String|Object} [options]                  If options is a string, it is automatically parsed with url.parse().
 * @param  {String}        [options.host = localhost] A domain name or IP address of the server.
 * @param  {Number}        [options.port = 80|443]    Port of remote server.
 * @param  {Object}        [options.headers]          Headers to be sent to the server.
 * @param  {String|Array}  [options.subProtocols]     The list of WebSocket sub-protocols.
 * @param  {Function}      [connectListener]          A one time listener for the 'connect' event.
 * @return {Client}
 */
exports.connect = function (options, connectListener) {
	return new exports.Client(options, connectListener);
};
