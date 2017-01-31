varying vec2 vUv;
varying vec3 vNormal;

void main() 
{
	float diffuse = vNormal.z * .5 + .5;

	gl_FragColor = vec4(diffuse * .2);
}