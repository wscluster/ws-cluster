#!/usr/bin/env node
var os = require('os');
var cluster = require('cluster');
var wsc = require('../');

var port = 6666;
var brokerPort = 6667;
var cpus = os.cpus();

function debug(message) {
	console.log('[pid: ' + process.pid + ']', message);
}

function startBrokerServer(callback) {
	wsc.createBrokerServer().listen(brokerPort, function () {
		debug('Broker Server Listening');
		callback();
	});
}

function startServer() {
	var server = wsc.createServer({
		broker: new wsc.Broker(brokerPort)
	}, function (session) {
		debug('Session Connected');
		session.on('close', function () {
			debug('Session Closed');
		});
	});
	server.on('listening', function () {
		debug('Server Listening');
	});
	server.listen(port);
}

if (cluster.isMaster && cpus.length > 1) {
	startBrokerServer(function () {
		for (var i = 0, l = cpus.length; i < l; ++i) {
			cluster.fork();
		}
	});
} else {
	startServer();
}
