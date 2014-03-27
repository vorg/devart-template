// Generated by CoffeeScript 1.7.1
var Arcball, Color, Cube, Diffuse, IO, MathUtils, Mesh, MovieRecorder, PerspectiveCamera, Platform, Scene, ShowDepth, SolidColor, Time, Vec3, Window, extractTopLevelDomain, fx, getEntryMimeType, getEntryUrl, hem, map, pad, pex, randomFloat, randomVec3, seed, unique, urlToHostName, _ref, _ref1, _ref2, _ref3, _ref4;

pex = pex || require('./lib/pex');

_ref = pex.sys, IO = _ref.IO, Window = _ref.Window, Platform = _ref.Platform;

_ref1 = pex.scene, PerspectiveCamera = _ref1.PerspectiveCamera, Scene = _ref1.Scene, Arcball = _ref1.Arcball;

_ref2 = pex.materials, SolidColor = _ref2.SolidColor, Diffuse = _ref2.Diffuse, ShowDepth = _ref2.ShowDepth;

Mesh = pex.gl.Mesh;

Cube = pex.geom.gen.Cube;

_ref3 = pex.geom, Vec3 = _ref3.Vec3, hem = _ref3.hem;

Color = pex.color.Color;

_ref4 = pex.utils, MathUtils = _ref4.MathUtils, Time = _ref4.Time, MovieRecorder = _ref4.MovieRecorder;

randomVec3 = MathUtils.randomVec3, seed = MathUtils.seed, map = MathUtils.map, randomFloat = MathUtils.randomFloat;

fx = pex.fx;

unique = function(array) {
  return array.sort().filter(function(e, i, arr) {
    return arr.lastIndexOf(e) === i;
  });
};

getEntryMimeType = function(entry) {
  return entry.response.content.mimeType;
};

getEntryUrl = function(entry) {
  return entry.request.url;
};

urlToHostName = (function() {
  var a, url;
  if (Platform.isPlask) {
    url = require('url');
    return function(s) {
      return url.parse(s).hostname;
    };
  } else if (Platform.isBrowser) {
    a = document.createElement("a");
    return function(s) {
      a.href = s;
      return a.hostname || s;
    };
  } else {
    return function(s) {
      return s;
    };
  }
})();

extractTopLevelDomain = function(domain) {
  var e;
  try {
    return domain.match(/[^\.]+\.[^\.]+$/)[0];
  } catch (_error) {
    e = _error;
    if (domain.indexOf('data') === 0) {
      return 'data';
    } else {
      return 'undefined';
    }
  }
};

pad = function(num, char, len) {
  var s;
  s = '' + num;
  while (s.length < len) {
    s = char + s;
  }
  return s;
};

pex.require(['materials/CorrectedGamma', 'fx/Fog', 'fx/TonemapLinear', 'fx/TonemapReinhard', 'fx/TonemapUncharted', 'fx/TonemapRichard', 'lib/timeline'], function(CorrectedGamma, Fog, TonemapLinear, TonemapReinhard, TonemapUncharted, TonemapRichard, timeline) {
  return Window.create({
    settings: {
      width: 1024,
      height: 512,
      fullscreen: Platform.isBrowser
    },
    init: function() {
      seed(0);
      if (Platform.isPlask) {
        this.recorder = new MovieRecorder('screenshots');
      }
      if (Platform.isBrowser) {
        this.gl.getExtension("OES_texture_float");
      }
      this.initScene();
      this.loadData();
      this.needsScreenshot = false;
      return this.on('keyDown', (function(_this) {
        return function(e) {
          if (e.str === 'S') {
            return _this.needsScreenshot = true;
          }
        };
      })(this));
    },
    initScene: function() {
      this.instances = [];
      this.instances2 = [];
      this.camera = new PerspectiveCamera(60, this.width / this.height);
      this.camera.setPosition(new Vec3(0, 0, 6));
      this.scene = new Scene();
      this.camera.target = new Vec3(0, 0, -20);
      return this.bgColor = Color.create(0.15 * 0.9, 0.18 * 0.9, 0.226 * 0.9, 1);
    },
    loadData: function() {
      return IO.loadTextFile('http://node.variable.io:1337/http%3A%2F%2Ftheverge.com', (function(_this) {
        return function(data) {
          var boom;
          console.log(data);
          data = JSON.parse(data);
          _this.entries = data.log.entries;
          console.log('data.log.entries.length', data.log.entries.length);
          _this.mimeTypes = unique(_this.entries.map(getEntryMimeType));
          _this.servers = unique(_this.entries.map(getEntryUrl).map(urlToHostName));
          _this.rootServers = unique(_this.servers.map(extractTopLevelDomain));
          console.log('@entries.length', _this.entries.length);
          console.log('@mimeTypes.length', _this.mimeTypes.length);
          console.log('@rootServers.length', _this.rootServers.length);
          console.log(_this.mimeTypes, _this.rootServers);
          _this.buildInstances();
          boom = function() {
            return _this.camera.position.z = 5;
          };
          return boom();
        };
      })(this));
    },
    buildInstances: function() {
      var entry, entryStartDate, entryStartTime, entryTime, geom, pageEndTime, pageStartTime, white, _i, _j, _len, _len1, _ref5, _ref6;
      pageStartTime = 0;
      pageEndTime = 0;
      _ref5 = this.entries;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        entry = _ref5[_i];
        entryStartDate = new Date(entry.startedDateTime);
        entryStartTime = entryStartDate.getTime();
        entryTime = Number(entry.time);
        entry._info = {};
        entry._info.startTime = entryStartTime;
        entry._info.time = entryTime;
        entry._info.endTime = entryStartTime + entryTime;
        if (!pageStartTime) {
          pageStartTime = entryStartTime;
        }
        pageEndTime = entryStartTime + entryTime;
      }
      _ref6 = this.entries;
      for (_j = 0, _len1 = _ref6.length; _j < _len1; _j++) {
        entry = _ref6[_j];
        entry._info.pageStartTime = pageStartTime;
        entry._info.pageEndTime = pageEndTime;
      }
      white = Color.create(1, 1, 1, 1.0);
      this.instanceMaterial = new SolidColor({
        color: white,
        specularColor: new Color(0.1, 0.1, 0.1, 1.0),
        ambientColor: new Color(0.1, 0.1, 0.1, 1),
        wrap: 1,
        correctGamma: true,
        conserveDiffuseEnergy: true
      });
      this.instanceGammaMaterial = new CorrectedGamma({
        diffuseColor: white,
        specularColor: new Color(0.1, 0.1, 0.1, 1.0),
        ambientColor: new Color(0.1, 0.1, 0.1, 1),
        wrap: 1,
        correctGamma: true,
        conserveDiffuseEnergy: true
      });
      geom = new Cube(0.1, 0.1, 2.5);
      geom.computeEdges();
      this.instanceMesh = new Mesh(geom, this.instanceGammaMaterial);
      this.instanceMesh2 = new Mesh(geom, this.instanceGammaMaterial, {
        useEdges: true
      });
      this.entries.map(this.makeEntryInstance.bind(this));
      return console.log('buildInstances', 'done', this.entries.length, (pageEndTime - pageStartTime) / 1000 + 's');
    },
    saveScreenshot: function(path) {
      var d, filename;
      d = new Date();
      filename = path + "/screenshot_";
      filename += "" + (d.getFullYear()) + "-" + (pad(d.getMonth() + 1, '0', 2)) + "-" + (pad(d.getDate(), '0', 2));
      filename += "_" + (pad(d.getHours(), '0', 2)) + ":" + (pad(d.getMinutes(), '0', 2)) + ":" + (pad(d.getSeconds(), '0', 2)) + ".png";
      return this.gl.writeImage('png', filename);
    },
    mimeTypeToColor: function(mimeType) {
      var hue;
      hue = 0;
      if (mimeType.indexOf('javascript') !== -1 || mimeType.indexOf('ecmascript') !== -1) {
        hue = 0.57;
      }
      if (mimeType.indexOf('html') !== -1 || mimeType.indexOf('css') !== -1) {
        hue = 0.37;
      }
      if (mimeType.indexOf('image') !== -1) {
        hue = 0.09;
      }
      if (mimeType.indexOf('flash') !== -1 || mimeType.indexOf('video') !== -1) {
        hue = 0.8;
      }
      if (mimeType.indexOf('json') !== -1 || mimeType.indexOf('xml') !== -1 || mimeType.indexOf('text/plain') !== -1) {
        hue = 0.09;
      }
      if (hue === 0) {
        return Color.createHSV(0, 0, 0.7);
      } else {
        return Color.createHSV(hue, 0.8, 1.7);
      }
    },
    makeEntryInstance: function(entry, entryIndex) {
      var color, delay, entryInstance, entryInstance2, info, mimeType, rootServer, setCookies;
      rootServer = urlToHostName(getEntryUrl(entry));
      mimeType = getEntryMimeType(entry);
      setCookies = entry.response.headers.filter(function(header) {
        return header.name === 'Set-Cookie';
      });
      if (entry.request.cookies.length > 0 || setCookies.length > 0) {
        console.log(entryIndex, entry.request.url, entry.request.cookies.length, setCookies.length, setCookies);
      }
      info = entry._info;
      color = this.mimeTypeToColor(mimeType);
      entryInstance = {};
      entryInstance.position = randomVec3(10);
      entryInstance.position.x = map(info.startTime, info.pageStartTime, info.pageEndTime, -4.5, 4.5);
      entryInstance.position.y = randomFloat(-2, 2);
      entryInstance.position.z = -30;
      entryInstance.scale = new Vec3(1, 1, 1);
      entryInstance.scale.x = 1 + info.time / 5000;
      entryInstance.scale.y = 1.4;
      entryInstance.scale.z = 1.05;
      if (setCookies.length > 0) {
        entryInstance.uniforms = {
          diffuseColor: new Color(2, 0, 0, 1)
        };
        this.instances2.push(entryInstance);
      }
      entryInstance2 = {};
      entryInstance2.position = entryInstance.position.dup();
      entryInstance2.uniforms = {
        diffuseColor: color
      };
      entryInstance2.scale = new Vec3(1, 1, 1);
      entryInstance2.scale.x = 1 + info.time / 5000;
      entryInstance2.position.z = -30;
      delay = map(info.startTime, info.pageStartTime, info.pageEndTime, 1, 5);
      timeline.anim(entryInstance2.position).to(delay, {
        z: 0
      }, 1, timeline.Timeline.Easing.Cubic.EaseInOut);
      timeline.anim(entryInstance.position).to(delay, {
        z: 0
      }, 1, timeline.Timeline.Easing.Cubic.EaseInOut);
      return this.instances.push(entryInstance2);
    },
    drawScene: function() {
      this.gl.clearColor(this.bgColor.r, this.bgColor.g, this.bgColor.b, this.bgColor.a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.lineWidth(2);
      if (this.instanceMesh) {
        this.instanceMesh.drawInstances(this.camera, this.instances);
      }
      if (this.instanceMesh2) {
        return this.instanceMesh2.drawInstances(this.camera, this.instances2);
      }
    },
    drawDepth: function() {
      var oldMaterial;
      this.gl.clearColor(this.bgColor.r, this.bgColor.g, this.bgColor.b, this.bgColor.a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.enable(this.gl.DEPTH_TEST);
      if (!this.showDepthMaterial) {
        this.showDepthMaterial = new ShowDepth({
          far: 30
        });
      }
      if (!this.instanceMesh) {
        return;
      }
      oldMaterial = this.instanceMesh.material;
      this.instanceMesh.setMaterial(this.showDepthMaterial);
      this.instanceMesh2.setMaterial(this.showDepthMaterial);
      if (this.instanceMesh) {
        this.instanceMesh.drawInstances(this.camera, this.instances);
      }
      if (this.instanceMesh2) {
        this.instanceMesh2.drawInstances(this.camera, this.instances2);
      }
      this.instanceMesh.setMaterial(this.instanceGammaMaterial);
      this.instanceMesh2.setMaterial(this.instanceGammaMaterial);
      if (this.needsScreenshot) {
        this.saveScreenshot('screenshots');
        return this.needsScreenshot = false;
      }
    },
    draw: function() {
      var color, depth, foggy;
      timeline.Timeline.getGlobalInstance().update(Time.delta);
      this.gl.clearColor(1, 0, 0, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.disable(this.gl.DEPTH_TEST);
      color = fx().render({
        drawFunc: this.drawScene.bind(this),
        bpp2: 32,
        depth: true,
        width: this.width,
        height: this.height
      });
      depth = color.render({
        drawFunc: this.drawDepth.bind(this),
        bpp2: 32,
        depth: true,
        width: this.width,
        height: this.height
      });
      foggy = color.fog(depth, {
        fogColor: this.bgColor,
        bpp2: 32
      });
      foggy = foggy.fxaa();
      return foggy.blit({
        width: this.width,
        height: this.height
      });
    }
  });
});
