varying vec2 vUv;

uniform float time;
uniform sampler2D energyTexture;

void main() 
{
	float influence = 1.0 - abs(vUv.y - .5) / .5;

	vec2 uv = vUv;
	uv.y *= .75;

	vec4 c = texture2D(energyTexture, uv + vec2(time * .1, -time * .25));
	c += texture2D(energyTexture, uv * 2.0 + vec2(time * -.2, -time * .25));

	gl_FragColor = c * influence;
}