#ifdef GL_ES
precision mediump float;
#endif

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec4 vUV;
varying vec2 vUV_l;
varying vec3 vColor;
varying vec2 vTime;

uniform sampler2D bumpSampler;

void main(void) {
    vec3 F = vec3(1.0,1.0,1.0);
    float pi = 3.14159;
    vec2 texCoords;
    texCoords.x = vUV_l.x * 5.0 + 0.0;//vUV.x / vUV.w / 2.0 + 0.5;
    texCoords.y = vUV_l.y * 5.0 + 0.0;//vUV.y / vUV.w / 2.0 + 0.5;
    vec3 tex = (texture2D(bumpSampler,texCoords).rgb);
    vec3 modifier = vColor;
    vec3 finalColor = tex*modifier;
    gl_FragColor = vec4(finalColor, 1.);
}