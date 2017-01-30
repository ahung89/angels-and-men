varying vec2 vUv;

void main() 
{
	float radius = length(vUv - vec2(.5));

	float spotlight = 1.0 - clamp(radius * 10.0, 0.0, 1.0);

	gl_FragColor = vec4(0.75 * spotlight);
}