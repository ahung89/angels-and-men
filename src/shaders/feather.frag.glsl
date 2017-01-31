varying vec2 vUv;
varying vec3 vNormal;

void main() 
{
	vec3 normal = normalize(vNormal);
	float diffuse = normal.z * .5 + .5;

	gl_FragColor = vec4(diffuse * vUv.x * .75 + .25);
}