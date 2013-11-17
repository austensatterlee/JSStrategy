#ifdef GL_ES
precision mediump float;
#endif

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;
varying vec2 vHealth;

void main(void) {
    vec3 finalColor = vec3(0,(vUV.x-vHealth.x)<=0.0,0);
    gl_FragColor = vec4(finalColor, 1.);
}