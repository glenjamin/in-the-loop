
/**
 * Module dependencies.
 */

var os = require('os');
var fs = require('fs');

var express = require('express');
var socketio = require('socket.io');
var jade = require('jade');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

io = socketio.listen(app);
io.set('log level', 2);

var POSTS_DATA = __dirname + '/data.json';
var posts;
try {
  posts = require(POSTS_DATA);
} catch (ex) {
  posts = [];
}
posts.save = function(item) {
  this.push(item);
  fs.writeFileSync(POSTS_DATA, JSON.stringify(this));
}

app.get('/', function(req, res){
  //res.partial('index', {title: 'Express'});
  res.render('index', {
    host: process.env.HOST || os.hostname(),
    title: 'SkyBet Hackday 29/06',
    posts: posts
  });
});

var post_template = fs.readFileSync(__dirname + '/views/post.jade', 'utf8');
var post_template = jade.compile(post_template);
io.sockets.on('connection', function (socket) {
  socket.on('post', function(data) {
    console.log("Message received: " + JSON.stringify(data));
    io.sockets.emit('post', post_template({post: data}));
    posts.save(data);
  })
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
