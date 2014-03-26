var exec = require('child_process').exec;
var fs = require('fs');

var PHANTOM_PATH = '/Users/vorg/Dev/phantomjs';
var CACHE_PATH = 'cache';

function getHar(url, callback) {
  var encodedUrl = new Buffer(url).toString('base64');
  var harFilePath = CACHE_PATH + '/' + encodedUrl + '.txt';
  if (fs.existsSync(harFilePath)) {
    console.log('reading file');
    fs.readFile(harFilePath, { encoding: 'utf-8' }, callback);
  }
  else {
    generateHar(url, harFilePath, callback);
  }
}

function generateHar(url, harFilePath, callback) {
  var args = [
    PHANTOM_PATH + '/bin/phantomjs',
    PHANTOM_PATH + '/examples/netsniff.js',
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
        console.log('reading generated file');
        fs.readFile(harFilePath, { encoding: 'utf-8' }, callback);
      }
      else {
        callback(err, null);
      }
    }
  });
}

getHar('"http://marcinignac.com"', function(err, har) {
  if (err) console.log('ERROR', err);
  else console.log('Done', har);
})
