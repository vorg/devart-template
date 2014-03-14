var plask = require('plask');
var fs = require('fs');
var omggif = require('./omggif.js');

//var IN_X = 15;
//var IN_Y = 124;
//var IN_WIDTH = 500;
//var IN_HEIGHT = 500;
//var OUT_WIDTH = 128;
//var OUT_HEIGHT = 128;
//var FPS = 5;

var IN_X = 0;
var IN_Y = 0;
var IN_WIDTH = 1000;
var IN_HEIGHT = 500;
var OUT_WIDTH = 400;
var OUT_HEIGHT = 200;
var FPS = 30;

plask.simpleWindow({
  settings: {
    type: '2d',
    width: OUT_WIDTH,
    height: OUT_HEIGHT
  },
  init: function() {
    this.on('filesDropped', function(e) {
      console.log('files', e)
      this.makeGif(e.paths);
    })
    this.framerate(FPS);
  },
  makeGif: function(files) {
    paint = this.paint;
    this.frames = files.map(function(file) {
      var img = plask.SkCanvas.createFromImage(file);
      var canvas = plask.SkCanvas.create(OUT_WIDTH, OUT_HEIGHT);
      canvas.drawCanvas(paint, img, 0, 0, OUT_WIDTH, OUT_HEIGHT, IN_X, IN_Y, IN_WIDTH + IN_X, IN_HEIGHT + IN_Y);
      return canvas;
    });

    var total = 1;
    var buffer = new Uint8Array( OUT_WIDTH * OUT_HEIGHT * total * 24 );
    var gif = new omggif.GifWriter( buffer, OUT_WIDTH, OUT_HEIGHT, { loop: 0 } );

    var pixels = new Uint8Array( OUT_WIDTH * OUT_HEIGHT * 4 );

    var numFrames = this.frames.length;
    var palette = [];
    var paletteIndex = 0;
    this.frames.forEach(function(data, dataIndex) {

      console.log('data', dataIndex + '/' + numFrames)
      var numBytes = OUT_WIDTH * OUT_HEIGHT * 4;

      for ( var j = 0, k = 0, jl = numBytes; j < jl; j += 4, k ++ ) {
        var r = Math.floor( data[ j + 2 ] * 0.05 ) * 20;
        var g = Math.floor( data[ j + 1 ] * 0.05 ) * 20;
        var b = Math.floor( data[ j + 0 ] * 0.05 ) * 20;
        var color = r << 16 | g << 8 | b << 0;
        var index = palette.indexOf( color );
        if ( index === -1 ) {
          pixels[ k ] = palette.length;
          //palette.push( color );
          palette[paletteIndex++] = color;
        } else {
          pixels[ k ] = index;
        }
      }

      var before = palette.length ;

      var powof2 = 1;
      while ( powof2 < palette.length ) powof2 <<= 1;
      palette.length = powof2;
      console.log(before, '->', palette.length)
    });

    this.frames.forEach(function(data, dataIndex) {
      console.log('data', dataIndex + '/' + numFrames)
      var numBytes = OUT_WIDTH * OUT_HEIGHT * 4;

      for ( var j = 0, k = 0, jl = numBytes; j < jl; j += 4, k ++ ) {
        var r = Math.floor( data[ j + 2 ] * 0.05 ) * 20;
        var g = Math.floor( data[ j + 1 ] * 0.05 ) * 20;
        var b = Math.floor( data[ j + 0 ] * 0.05 ) * 20;
        var color = r << 16 | g << 8 | b << 0;
        var index = palette.indexOf( color );
        pixels[ k ] = index;
      }

      try {
        gif.addFrame( 0, 0, OUT_WIDTH, OUT_HEIGHT, pixels, { palette: palette, delay : 5 });
      }
      catch(e) {
        console.log(e)
      }
    });

    var buff = new Buffer(buffer.slice(0, gif.end()), 'binary');
    fs.writeFileSync(files[0].replace('.png', '.gif'), buff, 'binary');
    console.log('Saved to ', files[0].replace('.png', '.gif'));
  },
  draw: function() {
    var paint = this.paint;
    var canvas = this.canvas;

    if (this.frames) {
      canvas.drawCanvas(paint, this.frames[this.framenum % this.frames.length], 0, 0, this.width, this.height);
    }
  }
})