var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var request = require('request');
var http = require('http');
var socketIo = require('socket.io');

var PORT = 3000;

var app = express();
var server = http.createServer(app);
var io = socketIo(server);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.io = io;

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));



request('http://api.ipify.org', function(error, response, body) {
  host_address = body;


  server.listen(PORT, function() {
    console.log("Server address is " + "http://" + host_address + ":" + PORT);
  });

  var router = require('./router/main_v3')(host_address, app);

  io.on('connect', function(socket) {
    console.log('클라이언트 접속');
    socket.on('disconnect', function() {
      console.log('클라이언트 접속 종료');
    });
  });

});
