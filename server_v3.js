var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var cors = require('cors');
var request = require('request');

var PORT = 3000;

app.use(cors());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);



app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

request('http://api.ipify.org', function(error, response, body){
  host_address = body;


  var server = app.listen(PORT, function() {
    console.log("Server address is "+"http://"+host_address+":"+PORT);
  });

  var router = require('./router/main_v3')(host_address, app);

});
