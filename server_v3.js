var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);


var server = app.listen(3000, function() {
  console.log("Express server has started on port 3000")
});

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


var router = require('./router/main_v3')(app);
