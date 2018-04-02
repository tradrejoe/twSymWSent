//pfTwSymWSent.js
var port = (process.env.VCAP_APP_PORT || 3000);
var express = require("express");
var app = express();
var server = require('http').createServer(app);

app.use(express.static(__dirname + '/view'));

app.get('/hello', function(req, res){
	res.send("Hello world.");
});

var twitter = require('ntwitter');
var twit = new twitter({
	consumer_key: 'crjpNliyK2Op2d7BmymruIIXG',
	consumer_secret: 'kKCcSRS33Wdg4pVVSS2AFqvkxCzkrr6zJKYUtzpprs2mR4vWGP',
	access_token_key: '205627891-go8D0tscLd88VTbZV0b0bGe6C1cADGi4eeMWbIvv',
	access_token_secret: '8uIalSSQS2HK6WHejx7vNk6xfD7EEIiHY08pKyu9zMg5g'	
});
twit.verifyCredentials(function(err, data){
	if (err) {
		console.log('twit.verifyCredentials err: ' + err);
	} else {
		console.log('twit.verifyCredentials data: ' + data);
	}
});


app.get('/twitterCheck', function(req, res){
	twit.verifyCredentials(function(err, data){
		if (err) {
			res.send('err: ' + err);
		} else {
			res.send('data: ' + data.name);
		}
	});
});

app.get('/watchTwitter', function (req, res) {
	var stream;
	var testTweetCount = 0;
	var phrase = req.query.phrase;
	twit.verifyCredentials(function (error, data) {
		if (error) {
			res.send("Error connecting to Twitter: " + error);
			}
		stream = twit.stream('statuses/filter', {
		'track': phrase
		}, function (stream) {
				res.send("Monitoring Twitter for \'" + phrase + "\'... Logging Twitter traffic.");
				stream.on('data', function (data) {
					testTweetCount++;
					// Update the console every 50 analyzed tweets
					//if (testTweetCount % 50 === 0) {
						console.log("Tweet #" + testTweetCount + ": " + data.text);
					//}
			});
		});
	});
});

server.listen(port);
console.log("Server listening on port " + port);

var pfmsocktws = new Map();
var io = require('socket.io')(server);
var nsppftwsym = io.of('/pftwsym');
nsppftwsym.on('connection', function(socket) {
	console.log('connected to socket.io server, socket id:' + socket.id);
	socket.on('w', function(data){
		console.log('event w emitted, sym: %s' + data.sym);
		if (typeof data === 'undefined' || !data ||
				typeof data.sym === 'undefined' || !data.sym) return;
		closeTw(pfmsocktws, socket);
		twit.stream('statuses/filter', {
			'track': data.sym,
			}, function (strm) {
				console.log("Monitoring Twitter for \'" + data.sym + "\'... Logging Twitter traffic.");
				pfmsocktws.set(socket.id, strm);
				strm.on('data', function (twdata) {
					//console.log(twdata.text);
					try {
						socket.emit('epftwsym', {'sym': data.sym, 'txt': twdata.text});
					} catch(e) {
						console.trace('Error emitting twitts on ' + data.sym);
					} 
				});
			});
	});
	socket.on('forceDisconnect', function() {
		try {
			console.log('destroying tweeter stream for socket with id:' + socket.id);
			closeTw(pfmsocktws, socket);
			console.log('disconnecting client with socket id:' + socket.id);
		    socket.disconnect();
		} catch(e) {
			console.trace('Error emitting twitts on ' + data.sym);
		}	    
	});
});

function closeTw(map, sock) {
	console.log('closeTw(), map=' + map + '; sock=' + sock + '; typeof map=' + (typeof map) + '; typeof sock=' + (typeof sock));
	if (typeof map === 'undefined' || !map || typeof sock === 'undefined' || !sock) return;
	console.log('closeTw(), typeof map.get(sock.id)=' + (typeof map.get(sock.id)));
	if (map.has(sock.id) && typeof map.get(sock.id) === 'object') {
		console.log('destroyng twitter stream for socket: ' + sock.id);
		try {
			map.get(sock.id).destroy();
		} catch(e) {
			console.trace('Error emitting twitts on ' + data.sym);
		}		
		map.delete(sock.id);
	}	
}






