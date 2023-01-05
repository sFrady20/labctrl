#define PI 3.141592653589793

precision highp float;

uniform float time;
uniform vec2 cursor;
uniform vec2 resolution;

float rand(vec2 co){
    return fract(sin(mod(dot(co.xy,vec2(12.9898,78.233)),3.14))*43758.5453);
}

void main(){
    vec4 color = vec4(0.,0.,0.,1.);

    vec2 uv = gl_FragCoord.xy / resolution.xy;

    color = mix(color, vec4(0.03,0.05,0.07,1.), pow((abs(uv.y)+1.), -10. + pow(abs(uv.x-0.5)+0.5, 3.) * 3.));

    gl_FragColor=color;
}