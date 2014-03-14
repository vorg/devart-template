var pex = pex || require('./lib/pex');

var Window = pex.sys.Window;
var PerspectiveCamera = pex.scene.PerspectiveCamera;
var Arcball = pex.scene.Arcball;
var Platform = pex.sys.Platform;
var Mesh = pex.gl.Mesh;
var materials = pex.materials;
var Color = pex.color.Color;
var Vec3 = pex.geom.Vec3;
var Cube = pex.geom.gen.Cube;
var MathUtils = pex.utils.MathUtils;
var IO = pex.sys.IO;
var Geometry = pex.geom.Geometry;
var Face4 = pex.geom.Face4;
var Time = pex.utils.Time;

var parseUrl = (function() {
  if (Platform.isPlask) {
    var url = require('url');
    return function(s) {
      return url.parse(s).hostname;
    }
  }
  else if (Platform.isBrowser) {
    var a = document.createElement("a");
    return function(s) {
      a.href = s;
      return a.hostname || s;
    }
  }
  else {
    return function(s) { return s; }
  }
})();

function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}

var mimeTypes = [
  'text/html',
  'text/css',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'image/gif',
  'image/jpeg',
  'image/png',
  '',
  'application/x-shockwave-flash',
  'text/plain',
  'application/octet-stream',
  undefined,
  'text/xml',
  'text/x-cross-domain-policy',
  'application/atom+xml',
  'application/json',
  'application/xml',
  'application/x-amf',
  'image/pjpeg',
  'font/opentype',
  'image/svg+xml',
  'application/x-font-ttf',
  'audio/ogg',
  'video/webm'
];

var mimeTypesCounters = [];
var mimeTypesCountersValues = [];

pex.require(['Instance', 'lib/timeline'],function(Instance, timeline) {
  anim = timeline.anim;
  Window.create({
    settings: {
      width: 1280,
      height: 720,
      type: '3d',
      vsync: true,
      multisample: true,
      fullscreen: Platform.isBrowser,
      center: true
    },
    instances: [],
    init: function() {
      var gl = this.gl;

      Time.verbose = true;

      gl.clearColor(0, 0, 0, 1);
      gl.enable(gl.DEPTH_TEST);

      this.camera = new PerspectiveCamera(60, this.width/this.height);
      this.arcball = new Arcball(this, this.camera);
      this.arcball.disableZoom();
      this.cubeGeom = new Cube();
      this.instancesGeom = new Geometry({vertices:true, colors:true, faces:false});
      this.mesh = new Mesh(this.instancesGeom, new materials.ShowColors());
      this.mesh.material.uniforms.color = new Color(1.0, 0.0, 0.0, 1.0);

      MathUtils.seed(0);

      if (Platform.isBrowser) {
        //this.buildLegend();
      }

      this.loadData();
    },
    loadData: function() {
      var servers = [];
      var serverCount = {};
      var serverPosition = {};

      function addUp(index, delay) {
        setTimeout(function() {
          mimeTypesCountersValues[index]++;
          if (mimeTypesCounters[index]) {
            mimeTypesCounters[index].nodeValue = " (" + mimeTypesCountersValues[index] + ")";
          }
        }, Math.floor(delay * 1000));
      }

      var self = this;

      //IO.loadTextFile("data/infosthetics.com.har", function(data) {
      //IO.loadTextFile("data/en.wikipedia.org.har", function(data) {
      //IO.loadTextFile("data/www.theverge.com.har", function(data) {
      //IO.loadTextFile("data/www.wired.com.har", function(data) {
      //IO.loadTextFile("data/www.fastcodesign.com.har", function(data) {
      //IO.loadTextFile("data/readwrite.com.har", function(data) {
    IO.loadTextFile("data/cashflow.sync.03.har", function(data) {
        data = JSON.parse(data);
        console.log('data.log.entries.length', data.log.entries.length);

        for (var i=0; i<data.log.entries.length; i++) {
          var entry = data.log.entries[i];
          var mimeType = entry.response.content.mimeType;
          var mimeTypeIndex = mimeTypes.indexOf(mimeType);
          if (mimeTypeIndex == -1) mimeTypes.push(mimeType);

          if (entry.request.url && entry.request.url.indexOf('data') == 0) {
            continue;
          }

          //if (i > 160) console.log(i, entry.request.url);

          //if (i > 183) return;

          var server = parseUrl(entry.request.url);
          var rootServer = server.match(/[^\.]+\.[^\.]+$/);
          if (rootServer) {
            if (servers.indexOf(rootServer[0]) == -1) {
              servers.push(rootServer[0]);
              serverCount[rootServer[0]] = 0;
              serverPosition[rootServer[0]] = new Vec3(Math.random() * 1 - 0.5, Math.random() * 1 - 0.5, 0)
            }
            serverCount[rootServer[0]]++;
          }
        }

        console.log('servers', servers.length);

        console.log(JSON.stringify(serverCount));

        var start = new Date(data.log.entries[0].startedDateTime).getTime();
        for (var i=0; i<data.log.entries.length; i++) {
          var entry = data.log.entries[i];
          var mimeType = entry.response.content.mimeType;
          var mimeTypeIndex = mimeTypes.indexOf(mimeType);
          var server = parseUrl(entry.request.url);
          if (!server) continue;
          var rootServer = server.match(/[^\.]+\.[^\.]+$/);

          var time = new Date(entry.startedDateTime).getTime();
          var delay = (time - start)/1000;
          delay = i / 10;
          var instance = new Instance(self.mesh);

          //instance.position.x = -6 + 12 * (i % 20)/20;
          //instance.position.y = 5 - 10 * (Math.floor(i / 20))/20;
          //instance.position.z = -8;
          //instance.scale.set(0.1, 0.05, 0.05);
          instance.scale.set(0,0,0);

          var color = hsvToRgb(mimeTypeIndex/mimeTypes.length, 1, 1);
          var color2 = hsvToRgb(mimeTypeIndex/mimeTypes.length, 0.8, 1);
          instance.uniforms.diffuseColor = new Color(color[0]/255, color[1]/255, color[2]/255, 1);
          instance.uniforms.ambientColor = new Color(color2[0]/255, color2[1]/255, color2[2]/255, 1);
          instance.timeOffset = Math.random();
          self.instances.push(instance);

          //anim(instance.position).to(delay/2, {x: -6 + 12 * (i % 20)/20, y:5 - 10 * (Math.floor(i / 20))/20, z:-8}, 0.5);
          //anim(instance.position).to(delay/2, serverPosition[rootServer[0]], 0.5);
          if (!rootServer) continue;
          anim(instance.position).to(delay/2, {
            x: serverPosition[rootServer[0]].x + Math.random()*0.35,
            y: serverPosition[rootServer[0]].y + Math.random()*0.35,
            z: serverPosition[rootServer[0]].z + Math.random()*2.25 - 1
          }, 0.5);

          function createAnim(instance, delay, mimeTypeIndex) {
            anim(instance.scale).to(delay/2, {x:0.15/5, y:0.12/5, z:0.25/5}, 0.5).onFinish = function() {
              addUp(mimeTypeIndex, 0);
            };
          }

          createAnim(instance, delay, mimeTypeIndex);

        }
        //console.log(mimeTypes.length, mimeTypes);
      });
      this.framerate(30);
    },
    buildLegend: function() {
      var div = document.createElement("div");
      div.setAttribute("style", "position: absolute; top:5px; left: 5px; color: white; font-family: arial; font-size:0.8em;");

      var labelWrapper = document.createElement("div");
      labelWrapper.setAttribute("style", "margin-right: 5px; display: block; height: 20px; width: 20px; background:black");
      div.appendChild(labelWrapper);

      var label = document.createTextNode("-");
      label.nodeValue = "www.fastcodesign.com";
      labelWrapper.appendChild(label);

      document.body.appendChild(div);
      mimeTypes.forEach(function(mime, i) {
        var color = hsvToRgb(i/mimeTypes.length, 1, 1);
        var rgb = "rgb(" + Math.floor(color[0]) + "," + Math.floor(color[1]) + "," + Math.floor(color[2]) + ")";
        var mimeElem = document.createElement("div");
        mimeElem.setAttribute("style", "background: black; float: left; clear: both; padding-right: 3px;");

        var mimeColorElem = document.createElement("div");
        mimeColorElem.setAttribute("style", "margin-right: 5px; display: inline-block; height: 20px; width: 20px; background:" + rgb);


        var mimeLabel = document.createTextNode("-");
        mimeLabel.nodeValue = "" + mime;
        mimeLabel.nodeValue = mimeLabel.nodeValue.substr(mimeLabel.nodeValue.indexOf("/") + 1);

        var mimeCounterLabel = document.createTextNode("-");
        mimeCounterLabel.nodeValue = " (0)";
        mimeTypesCounters.push(mimeCounterLabel);
        mimeTypesCountersValues.push(0);

        mimeElem.appendChild(mimeColorElem);
        mimeElem.appendChild(mimeLabel);
        mimeElem.appendChild(mimeCounterLabel);
        div.appendChild(mimeElem);
      })
    },
    bakeInstances: function(instances, cubeGeom, instancesGeom) {
      var vertices = instancesGeom.vertices;
      var colors = instancesGeom.colors;
      //var faces = instancesGeom.faces;
      vertices.length = 0;
      vertices.dirty = true;
      colors.length = 0;
      colors.dirty = true;
      instances.forEach(function(instance) {
        var vertexIndexOffset = vertices.length;
        cubeGeom.vertices.forEach(function(v, i) {
          if (i == 3) return;
          vertices[vertices.length] = v.dup().scale(instance.scale.x).add(instance.position);
        })
        cubeGeom.vertices.forEach(function(v, i) {
          if (i == 3) return;
          colors[colors.length] = instance.uniforms.diffuseColor;
        })
        //cubeGeom.faces.forEach(function(f) {
          //faces.push(new Face4(f.a + vertexIndexOffset, f.b + vertexIndexOffset, f.c + vertexIndexOffset, f.d + vertexIndexOffset));
        //})
      })
      //console.log('vertices', vertices.length);
      //console.log('colors', colors.length);
      //console.log(cubeGeom.faces[0])
    },
    updateInstances: function(instances, cubeGeom, instancesGeom) {
      var vertices = instancesGeom.vertices;
      var colors = instancesGeom.colors;
      var faces = instancesGeom.faces;
      vertices.dirty = true;
      for(var i=0; i<instances.length; i++) {
        var instance = instances[i];
        var vertexIndexOffset = vertices.length;
        for(var j=0; j<3+0*cubeGeom.vertices.length; j++) {
          var v = cubeGeom.vertices[j];
          vertices[i*3+j].setVec3(v).scale(instance.scale.x).add(instance.position);
        }
      }
    },
    draw: function() {
      var gl = this.gl;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      //for(var i=0; i<this.instances.length; i++) {
      //  var instance = this.instances[i];
      //  var f = 0.4 + 0.4*Math.cos(Time.seconds*2 + instance.timeOffset*8);
      //  var color = hsvToRgb(i/300, 1, f);
      //  var color2 = hsvToRgb(i/300, 0.8, f);
      //  instance.uniforms.diffuseColor = new Core.Vec4(color[0]/255, color[1]/255, color[2]/255, 1);
      //  instance.uniforms.ambientColor = new Core.Vec4(color[0]/255, color[1]/255, color[2]/255, 1);
      //}

      if (this.instances.length > 0) {
        if (this.instancesGeom.vertices.length == 0) {
          this.bakeInstances(this.instances, this.cubeGeom, this.instancesGeom);
        }
        else {
          this.updateInstances(this.instances, this.cubeGeom, this.instancesGeom);
        }
        this.mesh.draw(this.camera);
        //this.draw = function() {}
      }
      //for(var i in this.instances) {
      //  this.instances[i].draw(this.camera);
      //}
    }
  });
});

