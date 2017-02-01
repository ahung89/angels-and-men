varying vec2 vUv;
varying vec3 vNormal;
varying vec3 sNormal;
varying vec3 vColor;

uniform float time;

void main() 
{
    vColor = color;
	vUv = uv;
	vNormal = normal;
	sNormal = normalMatrix * normal;

    vec3 pos = position;

    // Let the poor angel breathe!
    float t = sin(time) * .5 + .5;
    float lengthToChest = 1.0 - clamp(.5 * length(pos - vec3(0.0, 3.0, 1.5)), 0.0, 1.0);
    pos += normal * lengthToChest * t * .2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);;
}