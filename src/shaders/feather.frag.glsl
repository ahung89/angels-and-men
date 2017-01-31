varying vec2 vUv;
varying vec3 vNormal;
varying vec3 worldPos;

uniform float time;

uniform sampler2D gradient;

void main() 
{
	float darkDomain = worldPos.y - worldPos.z + sin(time + (worldPos.y + worldPos.z) * .25); 
	float dark = 1.0 - smoothstep(5.0, 5.5, darkDomain);

	vec3 normal = normalize(vNormal);
	float diffuse = normal.z * .5 + .5;
	float spec = pow(diffuse, 25.0) * .5;

	gl_FragColor = vec4(diffuse * vUv.x * .85 + .15) * dark + vec4(spec) * (1.0 - dark);
}