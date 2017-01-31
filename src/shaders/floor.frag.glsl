varying vec2 vUv;

uniform sampler2D gradientTexture;

void main() 
{
	vec2 dist = vUv - vec2(.5);
	float radius = length(dist);

	float spotlight = 1.0 - clamp(radius * 3.0, 0.0, 1.0);
 
 	// Lets fake shadowsss
	dist.y *= .6;
 	radius = length(dist);
	spotlight *= smoothstep(0.0, 1.0, clamp(radius * 25.0, 0.0, 1.0)) * .5 + .5;

	gl_FragColor = texture2D(gradientTexture, vec2(0, spotlight));// vec4(0.75 * spotlight);
}