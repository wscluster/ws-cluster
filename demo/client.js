var npc = require('../');
var readline = require('readline');

npc.connect('ws://localhost:6666', function (session) {
	session.subscribe('chat', function () {
		console.log('Type something and start your chatting:');
	});
	session.on('message', function (channel, data) {
		console.log(data);
	});
	session.on('close', function () {
		console.log('close');
	});

	var rl = readline.createInterface(process.stdin, process.stdout);
	rl.on('line', session.publish.bind(session, 'chat'));
});
