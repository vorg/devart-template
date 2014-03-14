define([
  'pex/materials/Material',
  'pex/gl/Context',
  'pex/gl/Program',
  'pex/utils/ObjectUtils',
  'pex/geom/Vec3',
  'pex/color/Color',
  'lib/text!materials/Skybox.glsl'
], function (Material, Context, Program, ObjectUtils, Vec3, Color, SkyboxGLSL) {
  function Skybox(uniforms) {
    this.gl = Context.currentContext.gl;
    var program = new Program(SkyboxGLSL);
    var defaults = {};
    uniforms = ObjectUtils.mergeObjects(defaults, uniforms);
    Material.call(this, program, uniforms);
  }
  Skybox.prototype = Object.create(Material.prototype);
  return Skybox;
});
