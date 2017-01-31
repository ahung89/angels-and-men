varying vec2 vUv;
varying vec3 vNormal;
varying vec3 worldPos;

uniform float time;

uniform sampler2D gradient;
uniform sampler2D noise;

void main() 
{
	vec2 noiseUV = worldPos.yz + vec2(time, time * .5) * .05;
	vec2 n = texture2D(noise,noiseUV * .5).rg * 2.0 +  texture2D(noise, noiseUV * 2.0).rg * .5;

	float darkDomain = n.x + n.y + worldPos.y - worldPos.z + sin(time + (worldPos.y + worldPos.z) * .25); 
	float dark = 1.0 - smoothstep(6.0, 7.0, darkDomain);


	vec4 fire = texture2D(gradient, vec2(dark));

	vec3 normal = normalize(vNormal);
	float diffuse = normal.z * .5 + .5;
	float spec = pow(diffuse, 25.0) * .5;

	gl_FragColor = fire + vec4(diffuse * vUv.x * .85 + .15) * dark + vec4(spec) * (1.0 - dark);
}