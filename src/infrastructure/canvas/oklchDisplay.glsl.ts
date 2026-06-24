/** GLSL sources — coefficients mirror ColorConverter.rgbToOklab; OKLCH shares the same L channel. */

export const OKLCH_DISPLAY_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const OKLCH_DISPLAY_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform int u_mode;
in vec2 v_texCoord;
out vec4 fragColor;

vec3 srgbToLinear(vec3 c) {
  vec3 low = c / 12.92;
  vec3 high = pow((c + 0.055) / 1.055, vec3(2.4));
  return mix(low, high, step(vec3(0.04045), c));
}

float oklchLightness(vec3 rgb) {
  vec3 lin = srgbToLinear(rgb);
  float l = dot(lin, vec3(0.4122214708, 0.5363325363, 0.0514459929));
  float m = dot(lin, vec3(0.2119034982, 0.6806995451, 0.1073969566));
  float s = dot(lin, vec3(0.0883024619, 0.2817188376, 0.6299787005));
  float lRoot = pow(l, 1.0 / 3.0);
  float mRoot = pow(m, 1.0 / 3.0);
  float sRoot = pow(s, 1.0 / 3.0);
  return 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
}

void main() {
  vec4 tex = texture(u_texture, v_texCoord);
  if (u_mode == 0) {
    fragColor = tex;
    return;
  }
  float l = clamp(oklchLightness(tex.rgb), 0.0, 1.0);
  fragColor = vec4(vec3(l), tex.a);
}
`;
