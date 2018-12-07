var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var request = require('request');
var http = require('http');
var socketIo = require('socket.io');
var init = require(__dirname+"/private/script/initServer");
var config = require("./data/config.json");


var PORT = config.PORT;
var HOST = config.DOMAIN;
var DATA = __dirname+"/data/"+config.DATA;
var OBOXLIST = config.OBOXLIST;

var app = express();
var server = http.createServer(app);
var io = socketIo(server);

init
app.io = io;

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

init.initSetup(DATA, OBOXLIST).then(function(result){
  server.listen(PORT, function() {
    console.log("Server address is " + "http://" + HOST + ":" + PORT);
  });
});

var router = require('./router/main')(HOST, app);
