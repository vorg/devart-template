// Generated by CoffeeScript 1.7.1
var harServer, pex;

pex = pex || require('./lib/pex');

harServer = 'http://node.variable.io:1337';

pex.require(['burst'], function(Burst) {
  var IO, Platform, Window, _ref;
  _ref = pex.sys, Platform = _ref.Platform, Window = _ref.Window, IO = _ref.IO;
  return Window.create({
    settings: {
      width: 1024,
      height: 512,
      fullscreen: Platform.isBrowser
    },
    init: function() {
      if (Platform.isBrowser) {
        this.initHTML();
      }
      return this.burst = new Burst(this);
    },
    initHTML: function() {
      var goBtn, introDialog, makeQuery, queryInput;
      introDialog = document.getElementById('introContainer');
      queryInput = document.getElementById('query');
      goBtn = document.getElementById('goBtn');
      queryInput.addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
          return makeQuery();
        }
      });
      goBtn.addEventListener('click', function() {
        return makeQuery();
      });
      return makeQuery = (function(_this) {
        return function() {
          var request, url;
          url = queryInput.value;
          if (!url) {
            alert('Please enter url');
            return queryInput.focus();
          } else {
            request = harServer + '/' + encodeURIComponent(url);
            introDialog.style.opacity = 0;
            return _this.burst.loadData(request, function() {
              return setTimeout(function() {
                return introDialog.style.opacity = 1;
              }, 5000);
            });
          }
        };
      })(this);
    },
    draw: function() {
      return this.burst.draw();
    }
  });
});