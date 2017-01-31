varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;

uniform float time;

void main() 
{
    vColor = color;
	vUv = uv;
	vNormal = normalMatrix * normal;	
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}