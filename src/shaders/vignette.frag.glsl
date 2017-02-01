varying vec2 vUv;

uniform sampler2D vignette;
uniform float time;

void main() 
{
	gl_FragColor = texture2D(vignette, vUv) * smoothstep(0.0, 1.0, clamp(time * .25, 0.0, 1.0));
}