// Generated by CoffeeScript 1.6.2
var Arcball, Color, Cube, Diffuse, GUI, IO, Icosahedron, MathUtils, Mesh, PerspectiveCamera, Platform, Quat, Scene, ShowDepth, SolidColor, Sphere, Texture2D, Textured, Vec3, Window, extractTopLevelDomain, fx, getEntryMimeType, getEntryUrl, hem, pad, pex, randomVec3, seed, unique, urlToHostName, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;

pex = pex || require('./lib/pex');

_ref = pex.sys, IO = _ref.IO, Window = _ref.Window, Platform = _ref.Platform;

_ref1 = pex.scene, PerspectiveCamera = _ref1.PerspectiveCamera, Scene = _ref1.Scene, Arcball = _ref1.Arcball;

_ref2 = pex.materials, SolidColor = _ref2.SolidColor, Diffuse = _ref2.Diffuse, ShowDepth = _ref2.ShowDepth, Textured = _ref2.Textured;

_ref3 = pex.gl, Mesh = _ref3.Mesh, Texture2D = _ref3.Texture2D;

_ref4 = pex.geom.gen, Cube = _ref4.Cube, Sphere = _ref4.Sphere, Icosahedron = _ref4.Icosahedron;

_ref5 = pex.geom, Vec3 = _ref5.Vec3, hem = _ref5.hem, Quat = _ref5.Quat;

Color = pex.color.Color;

MathUtils = pex.utils.MathUtils;

randomVec3 = MathUtils.randomVec3, seed = MathUtils.seed;

GUI = pex.gui.GUI;

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
  return domain.match(/[^\.]+\.[^\.]+$/)[0];
};

pad = function(num, char, len) {
  var s;

  s = '' + num;
  while (s.length < len) {
    s = char + s;
  }
  return s;
};

pex.require(['materials/CorrectedGamma', 'materials/SkyBox', 'materials/Reflection', 'fx/Fog', 'fx/TonemapLinear', 'fx/TonemapReinhard', 'fx/TonemapUncharted', 'fx/TonemapRichard', 'fx/CorrectGamma', 'fx/Save', 'utils/Settings'], function(CorrectedGamma, SkyBox, Reflection, Fog, TonemapLinear, TonemapReinhard, TonemapUncharted, TonemapRichard, CorrectGamma, Save, settings) {
  return Window.create({
    settings: {
      width: 1000,
      height: 500
    },
    init: function() {
      var _this = this;

      seed(12);
      this.gui = new GUI(this);
      settings().init(this.gui);
      this.initScene();
      this.needsScreenshot = false;
      return this.on('keyDown', function(e) {
        if (e.str === 'S') {
          return _this.needsScreenshot = true;
        }
      });
    },
    initScene: function() {
      var cube, geom, i, material, sphere, _i, _results;

      this.instances = [];
      this.camera = new PerspectiveCamera(60, this.width / this.height);
      this.camera.setPosition(new Vec3(0, 0, -5));
      this.scene = new Scene();
      this.arcball = new Arcball(this, this.camera);
      this.bgColor = Color.create(0.15 * 0.09, 0.18 * 0.09, 0.226 * 0.09, 1);
      sphere = new Mesh(new Sphere(10, 10, 10), new SkyBox({
        texture: Texture2D.load('assets/lookout.png')
      }));
      this.scene.add(sphere);
      material = new Reflection({
        diffuseTexture: Texture2D.load('assets/lookout_diffuse.png'),
        reflectionTexture: Texture2D.load('assets/lookout.png')
      });
      geom = new Icosahedron(1);
      geom = hem().fromGeometry(geom).selectRandomFaces(0.15).extrude(0.25).subdivide().selectRandomFaces(0.15).extrude(0.25).subdivide().toFlatGeometry();
      _results = [];
      for (i = _i = 0; _i < 1; i = ++_i) {
        cube = new Mesh(geom, material);
        cube.position = new Vec3();
        cube.position.z = 1 - i / 50 - 0.5;
        cube.position.x = 3 * Math.cos(2 * Math.PI * i / 50);
        cube.position.y = 3 * Math.sin(2 * Math.PI * i / 50);
        cube.position = randomVec3(1);
        cube.rotation = Quat.create().setAxisAngle(randomVec3().normalize(), 2 * Math.PI * i / 50 / Math.PI * 360);
        this.instances.push(cube);
        _results.push(this.scene.add(cube));
      }
      return _results;
    },
    saveScreenshot: function(path) {
      var d, filename;

      d = new Date();
      filename = path + "/screenshot_";
      filename += "" + (d.getFullYear()) + "-" + (pad(d.getMonth() + 1, '0', 2)) + "-" + (pad(d.getDate(), '0', 2));
      filename += "_" + (pad(d.getHours(), '0', 2)) + ":" + (pad(d.getMinutes(), '0', 2)) + ":" + (pad(d.getSeconds(), '0', 2)) + ".png";
      return this.gl.writeImage('png', filename);
    },
    drawScene: function() {
      var instance, _i, _len, _ref6, _results;

      this.gl.clearColor(this.bgColor.r, this.bgColor.g, this.bgColor.b, this.bgColor.a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.scene.draw(this.camera);
      _ref6 = this.instances;
      _results = [];
      for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
        instance = _ref6[_i];
        instance.material.uniforms.eyePos = this.camera.getPosition();
        _results.push(instance.material.uniforms.reflection = settings().getFloat('reflection', 0.5, 0, 1));
      }
      return _results;
    },
    drawDepth: function() {
      var oldMaterials,
        _this = this;

      this.gl.clearColor(this.bgColor.r, this.bgColor.g, this.bgColor.b, this.bgColor.a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.enable(this.gl.DEPTH_TEST);
      if (!this.showDepthMaterial) {
        this.showDepthMaterial = new ShowDepth({
          far: 9
        });
      }
      oldMaterials = this.instances.map(function(instance) {
        var oldMaterial;

        oldMaterial = instance.material;
        instance.setMaterial(_this.showDepthMaterial);
        return oldMaterial;
      });
      this.scene.draw(this.camera);
      return oldMaterials.forEach(function(material, index) {
        return _this.instances[index].setMaterial(material);
      });
    },
    draw: function() {
      var color, depth;

      this.gl.clearColor(0, 0, 0, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.disable(this.gl.DEPTH_TEST);
      color = fx().render({
        drawFunc: this.drawScene.bind(this),
        bpp: 32,
        depth: true,
        width: this.width * 2,
        height: this.height * 2
      });
      depth = color.render({
        drawFunc: this.drawDepth.bind(this),
        bpp: 32,
        depth: true,
        width: this.width,
        height: this.height
      });
      color = color.fxaa({
        bpp: 32
      });
      if (settings().getBool('richard', false)) {
        color = color.tonemapRichard({
          exposure: settings().getFloat('exposure', 3, 0.5, 20.0),
          bpp: 32
        });
      } else {
        color = color.tonemapReinhard({
          exposure: settings().getFloat('exposure', 3, 0, 10.0),
          bpp: 32
        }).correctGamma({
          bpp: 32
        });
      }
      if (this.needsScreenshot) {
        color.save('screenshots', {
          bpp: 32
        });
        this.needsScreenshot = false;
      }
      color.blit({
        width: this.width,
        height: this.height
      });
      return this.gui.draw();
    }
  });
});
