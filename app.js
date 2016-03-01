var app = require('express')();
var server = require('http').Server(app)
var io = require('socket.io').listen(server)

var mess = [];
var users = {};

app.get('/', function(req,res){
	res.sendFile(__dirname+'/index.html');
})

server.listen(process.env.PORT || 3000, function(){
	console.log("listening on *:3000")
})


io.sockets.on('connection', function(socket){

	socket.on('new message', function(data){
		if(data !== ""){
		var d = new Date();
		var time = d.getHours() + ":" + d.getMinutes()
		mess.push({message:data, nickname: socket.nickname, date:time})
		io.sockets.emit('load message', {message:data, nickname: socket.nickname, date:time });
		}
		if(mess.length>10){
			mess.shift()
		}
		
	})

	socket.on('init private convo', function(data, callback){
		if(data in users){
			//console.log(users[data])
			callback("start talking")
		}
		else{
			callback("Qu'avez vous fait ?!")
		}
	})

	socket.on('send private message', function(data,callback){
		console.log(data)
		var d = new Date();
		var time = d.getHours() + ":" + d.getMinutes()
		users[data.sender].emit('emit private message', {message: data.mess, sender: data.sender, receiver:data.receiver, date:time }); 
		users[data.receiver].emit('emit private message', {message: data.mess, sender: data.sender, receiver:data.receiver, date:time });
	})

	socket.on('new user', function(data, callback){
		//Si le username n'est pas utilisé
		if(!(data in users) && data !== ""){
		callback(true, data);
		socket.nickname = data
		users[socket.nickname] = socket;
		// Object.keys(users) renvoie toutes les propriétés propre a l'objet, 
		//qui ne sont pas herité des prototype 
		socket.broadcast.emit('alert connected', Object.keys(users))
		io.sockets.emit('create user', Object.keys(users));
		socket.emit('display messages', mess, data);
		}
		else{
			callback(false);
		}
	})

	socket.on("disconnect", function(){
		if(!socket.nickname) return;
		delete users[socket.nickname]
		io.sockets.emit('create user', Object.keys(users));

	})
})

