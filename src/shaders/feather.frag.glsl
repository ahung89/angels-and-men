varying vec2 vUv;
varying vec3 vNormal;
varying vec3 worldPos;

uniform float time;
uniform float desintegrationFactor;

uniform sampler2D gradient;
uniform sampler2D noise;

uniform sampler2D lightLit;

void main() 
{

	vec2 noiseUV = vec2(worldPos.y, worldPos.z) + vec2(time, time * .5) * .05;
	vec2 n = texture2D(noise,noiseUV * .5).rg * 2.0 +  texture2D(noise, noiseUV * 2.0).rg * .5;

	noiseUV.y *= .5;

	// The size of the edge, now run by time to test
	float edge = mix(20.0, 3.0, desintegrationFactor);


	float darkDomain = n.x + n.y + noiseUV.x - noiseUV.y + sin(time + (noiseUV.x + noiseUV.y) * 4.15); 
	float dark = smoothstep(edge, edge + 1.5, darkDomain);

	vec4 fire = texture2D(gradient, vec2(dark));

	vec3 normal = normalize(vNormal);
	float diffuse = normal.z * .5 + .5;
	float spec = pow(diffuse, 25.0) * .5;

	vec4 lightColor = texture2D(lightLit, (normal.xy * .5 + .5) * (vUv.x * .5 + .5));

	// Some AO by multiplying the color by itself based on uvs
	lightColor *= mix(lightColor, vec4(1.0), vUv.x * vUv.x);

	vec4 darkColor = vec4(spec);


	lightColor = vec4(diffuse * vUv.x * .85 + .15);

	// gl_FragColor = fire + vec4(diffuse * vUv.x * .85 + .15) * dark + vec4(spec) * (1.0 - dark);
	gl_FragColor = fire + mix(lightColor, darkColor, dark);
}