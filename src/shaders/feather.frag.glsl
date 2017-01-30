varying vec2 vUv;
varying vec3 vNormal;

void main() 
{
	float radius = length(vUv - vec2(.5));

	float spotlight = 1.0 - clamp(radius * 10.0, 0.0, 1.0);

	float diffuse = vNormal.z * .5 + .5;

	gl_FragColor = vec4(diffuse * .2);
}