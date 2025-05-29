uniform sampler2D uMap;

varying vec4 vColor;
varying float vSpinSpeed;

void main() {
  vec2 uv = gl_PointCoord;

  float c = cos(vSpinSpeed);
  float s = sin( vSpinSpeed);
  mat2 r = mat2(c, s, -s, c);

  uv = (uv - 0.5) * r + 0.5;


  vec4 color = texture2D(uMap, uv);
  color *= vColor;

  gl_FragColor = color;
}