// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 color;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;
uniform vec2 time;

// Normal
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec4 vUV;
varying vec3 vColor;
varying vec2 vTime;
varying vec2 vUV_l;

uniform sampler2D bumpSampler;

void main(void) {
    vec3 nPos = position;
    vec4 outPosition = worldViewProjection * vec4(nPos, 1.0);
    gl_Position = outPosition;

    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));

    vUV = outPosition;
    vUV_l = uv;
    vColor = color;
    vTime = time;
}