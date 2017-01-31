varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;

uniform sampler2D gradient;

void main() 
{
	vec3 normal = normalize(vNormal);
	float diffuse = pow(clamp(normal.y + normal.z * .1, 0.0, 1.0), .5);

	gl_FragColor = texture2D(gradient, vec2(0, clamp(diffuse, .25, 1.0)));
}