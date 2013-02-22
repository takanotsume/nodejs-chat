try {

var config = require('./config')
  , express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , redis = require("redis").createClient(config.redis.port, config.redis.ip);

redis.auth(config.redis.password);

server.listen(3000);

// https://github.com/LearnBoost/socket.io/wiki/Authorizing

io.configure(function (){
  
  io.set('authorization', function (handshakeData, callback) {
    
    redis.get(config.redis.prefix+handshakeData.query.user, function (err, reply) {
     if (handshakeData.query.token == reply) {
        console.log('Authorized');
        callback(null, true);
     } else {
        console.log('Not authorized');
        callback(null, false);
     }
     // invalidate token
     redis.del(config.redis.prefix+handshakeData.query.user);

    });

  });

});

io.sockets.on('connection', function (socket) {

  // console.log(socket.handshake.headers);  

  socket.on('messageSent', function (data) {

    console.log(data.to);
    console.log(data.message);
    
    if(data.to=='all') {
       io.sockets.broadcast.emit({ token: data.token, from: data.from, to: data.to, message: data.message });
    } else {
       console.log('Emit to '+ data.to);
       io.sockets.volatile.emit(data.to, { token: data.token, from: data.from, to: data.to, message: data.message });
    }

  });

});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

} catch (e) {

  console.log(e);

}
