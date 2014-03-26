var exec = require('child_process').exec;
var fs = require('fs');
var express = require('express');
var config = require('./config');

var app = express();

function getHar(url, callback) {
  var encodedUrl = new Buffer(url).toString('base64');
  var harFilePath = config.CACHE_PATH + '/' + encodedUrl + '.txt';
  if (fs.existsSync(harFilePath)) {
    fs.readFile(harFilePath, { encoding: 'utf-8' }, callback);
  }
  else {
    generateHar(url, harFilePath, callback);
  }
}

function generateHar(url, harFilePath, callback) {
  var args = [
    config.PHANTOM_PATH + '/bin/phantomjs',
    config.PHANTOM_PATH + '/examples/netsniff.js',
    url,
    '>',
    harFilePath
  ];
  var cmd = args.join(' ');
  var child = exec(cmd);
  child.on('close', function(err, msg) {
    if (err) {
      callback(err, null);
    }
    else {
      if (fs.existsSync(harFilePath)) {
        fs.readFile(harFilePath, { encoding: 'utf-8' }, callback);
      }
      else {
        callback(err, null);
      }
    }
  });
}

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://marcinignac.com,http://localhost');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
};

app.configure(function() {
  app.use(allowCrossDomain);
});

app.get('/:url', function(req, res){
  url = req.params.url ? req.params.url : 'http://google.com';
  console.log('Requesting', url);
  getHar(req.params.url, function(err, har) {
    res.setHeader('Content-Type', 'application/json');
    var json = har;
    if (err) {
      console.log('ERROR', err);
      json = JSON.stringify({ error: err });
    }
    res.setHeader('Content-Length', json.length);
    res.end(json);
  });
});

app.listen(1337);
console.log('Listening on port 1337');
