varying vec2 vUv;
varying vec3 vNormal;

void main() 
{
	vUv = uv;
	vNormal = normalMatrix * normal;
	
    vec3 pos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}