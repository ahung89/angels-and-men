varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;

uniform float time;

void main() 
{
    vColor = color;
	vUv = uv;
	vNormal = normalMatrix * normal;	
	vec3 pos = position;

	pos.y += sin(time) * .2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}