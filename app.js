/**
 * Module dependencies.
 */

var express = require('express');
var MongoStore = require('connect-mongo')(express);
var http = require('http');
var path = require('path');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var request = require('request');
var moment = require('moment');
var hbs = require('hbs');
var flash = require('connect-flash');

// the ExpressJS App
var app = express();

// configuration of port, templates (/views), static files (/public)
// and other expressjs settings for the web server.

// server port number
app.set('port', process.env.PORT || 5000);

//  templates directory to 'views'
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());

var mongoUri = 'mongodb://localhost/ubiq';

app.configure('production', function() {
  app.set('isProduction', true);
  mongoUri = process.env.MONGOLAB_URI;
});

app.db = mongoose.connect(mongoUri);

app.use(express.session({
  secret: 'highiurgbuiarhb',
  cookie: {
    maxAge: 35000000000
  },
  store: new MongoStore({
    mongoose_connection: mongoose.connection
  })
}));

app.use(flash());

app.use(function(req, res, next) {
  res.locals.isProduction = app.get('isProduction') || false;
  next();
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var documentModel = require("./models/document.js"); //db model

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.configure('production', function() {
  app.use(function(err, req, res, next) {
    console.error(err);
    res.send(500, 'Sorry, there\'s been an error!');
  });
});

// ROUTES

var routes = require('./routes/index.js');

app.get('/', routes.index);
app.post('/new', routes.new);
app.get('/q/:id', routes.get);

app.use(function(req, res) {
  res.render('404.html');
});

// create NodeJS HTTP server using 'app'
http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});