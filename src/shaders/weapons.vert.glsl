varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;

uniform float time;

void main() 
{
    vColor = color;
	vUv = uv;
	vNormal = normal;

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);


    gl_Position = pos;
}