varying vec2 vUv;

uniform sampler2D gradientTexture;

void main() 
{
	float radius = length(vUv - vec2(.5));

	float spotlight = 1.0 - clamp(radius * 5.0, 0.0, 1.0);

	gl_FragColor = texture2D(gradientTexture, vec2(0, spotlight));// vec4(0.75 * spotlight);
}