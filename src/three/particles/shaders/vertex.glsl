#define PI 3.1415926535897932384626433832795
#define TAU 6.283185307179586476925286766559

uniform float uTime;
uniform vec2 uResolution;
uniform float uSize;
uniform sampler2D uSizeOverLife;
uniform sampler2D uColorOverLife;
uniform sampler2D uTwinkleOverLife;

attribute vec2 data;

varying vec4 vColor;
varying float vSpinSpeed;

void main() {
  float life = data.x;
  float id = data.y;
  vec2 lifeUv = vec2(life, 0.5);

  float size = texture2D(uSizeOverLife, lifeUv).r;
  vec4 color = texture2D(uColorOverLife, lifeUv);
  float twinkle = texture2D(uTwinkleOverLife, lifeUv).r;

  float twinkleFactor = mix(1.0, sin(uTime * 10.0 + id * TAU) * 0.5 + 0.5, twinkle);
  color.a *= twinkleFactor;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;

  gl_PointSize = size * uSize * uResolution.y;
  gl_PointSize *= (1.0 / -mvPosition.z);

  vColor = color;
  vSpinSpeed = uTime * PI + id * TAU;
}