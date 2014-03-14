define(["pex/core/Core", "pex/util/ObjUtils"], function(Core, ObjUtils) {

  var vert = ""
    + "uniform mat4 projectionMatrix;"
    + "uniform mat4 modelViewMatrix;"
    + "uniform mat4 normalMatrix;"
    + "uniform vec3 eyePos;"
    + "uniform float refraction;"
    + "attribute vec3 position;"
    + "attribute vec3 normal;"
    + "varying vec3 vNormal;"
    + "varying vec3 R;"
    + "varying vec3 RR;"
    + "void main() {"
    +  "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);"
    +  "vec3 I = normalize(position.xyz - eyePos.xyz);"
    +  "R = reflect(I, normal);"
    +  "RR = refract(I, normal, refraction);"
    +  "vNormal = (normalMatrix * vec4(normal, 1.0)).xyz;"      
    + "}";

  var frag = ""
    + "uniform samplerCube texture;"
    + "uniform float reflection;"    
    + "varying vec3 R;"
    + "varying vec3 RR;"
    + "varying vec3 vNormal;"      
    + "void main() {"
    +  "float NdotL = dot(normalize(vNormal), normalize(vec3(0.0, 10.0, 0.0)));"
    +  "vec3 diffuse = mix(vec3(0.5, 0.4, 0.4), vec3(0.3, 0.3, 0.4), NdotL*0.5 + 0.5);"
    //+  "gl_FragColor.rgb = 0.2*diffuse;"    
    +  "vec4 color = textureCube(texture, vNormal);"
    +  "color.rgb = (color.rgb * 256.0 * pow(2.0, color.a * 256.0 - 128.0)) / 256.0;"
    +  "gl_FragColor.rgba = vec4(color.rgb, 1.0);"
    //+  "gl_FragColor += 1.0 * reflection * textureCube(texture, R);"
    //+  "gl_FragColor += 1.0 * (1.0 - reflection) * textureCube(texture, RR);"
    +  "gl_FragColor.a = 1.0;"
    + "}";

  function TextureCubeMaterial(uniforms) {
    Core.Material.call(this);
    this.gl = Core.Context.currentContext.gl;
    this.program = new Core.Program(vert, frag);
    this.uniforms = ObjUtils.mergeObjects({eyePos: new Core.Vec3(0, 0, 0), refraction: 0.65 }, uniforms);
  }

  TextureCubeMaterial.prototype = new Core.Material();

  return TextureCubeMaterial;
});
