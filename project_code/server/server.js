var exec = require('child_process').exec;
var fs = require('fs');
var express = require('express');
var config = require('./config');

var app = express();

function getHar(url, callback) {
  var encodedUrl = new Buffer(url).toString('base64');
  var harFilePath = config.CACHE_PATH + '/' + encodedUrl + '.txt';
  if (fs.existsSync(harFilePath)) {
    console.log('loading', harFilePath);
    fs.readFile(harFilePath, { encoding: 'utf-8' }, function(err, data) {
      if (!err) {
        try {
          var json = JSON.parse(data);
          if (json && json.log) {
            callback(null, data);
            return;
          }
        }
        catch (e) {
          generateHar(url, harFilePath, callback);
          return;
        }
        generateHar(url, harFilePath, callback);
      }
      else {
        callback(err, data);
      }
    });
  }
  else {
    generateHar(url, harFilePath, callback);
  }
}

function generateHar(url, harFilePath, callback) {
  console.log('generateHar', url);
  var args = [
    config.PHANTOM_PATH + '/bin/phantomjs',
    '--ignore-ssl-errors=yes',
    'lib/netsniff.js',
    url,
    '>',
    harFilePath
  ];
  var cmd = args.join(' ');
  console.log('generateHar', cmd);
  var child = exec(cmd);
  child.on('close', function(err, msg) {
    console.log('close');
    if (err) {
      callback(err, null);
    }
    else {
      if (fs.existsSync(harFilePath)) {
        fs.readFile(harFilePath, 'utf-8', callback);
      }
      else {
        callback(err, null);
      }
    }
  });
}

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost');
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
