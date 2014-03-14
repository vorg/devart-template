#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
attribute vec3 position;
attribute vec3 normal;
varying vec3 vNormal;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(position);
}

#endif

#ifdef FRAG

uniform sampler2D texture;
varying vec3 vNormal;

vec4 extractHDR(vec4 color) {
  return vec4((color.rgb * pow(2.0, color.a * 256.0 - 128.0)), 1.0);
}

void main() {
  vec3 N = normalize(vNormal);
  //(1.0 - skyBox)*(1.0-glass)*
  vec2 texCoord = vec2((1.0 + atan(-N.z, N.x)/3.14159265359)/2.0, acos(N.y)/3.14159265359);
  vec4 textureColor = extractHDR(texture2D(texture, texCoord));
  gl_FragColor = textureColor;
}

#endif