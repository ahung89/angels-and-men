varying vec2 vUv;
varying vec3 vNormal;
varying vec3 sNormal;
varying vec3 vColor;

uniform sampler2D gradient;

void main() 
{
	vec3 normal = normalize(vNormal);
	float diffuse = pow(clamp(normal.y + normal.z * .1, 0.0, 1.0), 2.0) * .5;

	diffuse += pow(1.0 - normalize(sNormal).z, .5) * .5;

	gl_FragColor = texture2D(gradient, vec2(0, clamp(diffuse, .25, 1.0)));
}