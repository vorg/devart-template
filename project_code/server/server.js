var exec = require('child_process').exec;

var PHANTOM_PATH = '/Users/vorg/Dev/phantomjs';
var CACHE = 'cache';

var url = '"http://marcinignac.com"';
var encodedUrl = new Buffer(url).toString('base64');

console.log(url, encodedUrl)

var args = [
  PHANTOM_PATH + '/bin/phantomjs',
  PHANTOM_PATH + '/examples/netsniff.js',
  url,
  '>',
  encodedUrl + '.txt'
];

var cmd = args.join(' ');
var child = exec(cmd);
child.on('close', function(err, msg) {
  console.log('err', err, 'msg', msg);
  console.log('done')
})