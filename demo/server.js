#!/usr/bin/env node
var os = require('os');
var cluster = require('cluster');
var broker = require('wsc-simple-broker');
var wsc = require('../');

var port = 6666;
var cpus = os.cpus();

function debug(message) {
	console.log('[pid: ' + process.pid + ']', message);
}

function startServer() {
	var server = wsc.createServer({
		broker: broker(6667)
	}, function (session) {
		session.on('end', function (code, reason) {
			debug('close:', code, reason);
		});
	});
	server.on('listening', function () {
		debug('Listening');
	});
	server.listen(port);
}

if (cluster.isMaster && cpus.length > 1) {
	for (var i = 0, l = cpus.length; i < l; ++i) {
		cluster.fork();
	}
} else {
	startServer();
}
