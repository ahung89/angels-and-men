varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;
varying float fog;

uniform sampler2D gradient;

void main() 
{
	vec3 normal = normalize(vNormal);
	float diffuse = pow(clamp(normal.z, 0.0, 1.0), 4.0);

	gl_FragColor = texture2D(gradient, vec2(diffuse * .75));
}