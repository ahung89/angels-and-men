varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;

void main() 
{
	vec3 normal = normalize(vNormal);
	float diffuse = normal.z * .5 + .5;

	gl_FragColor = vec4(diffuse * .75 + .25);
}