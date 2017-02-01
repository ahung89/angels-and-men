varying vec2 vUv;

uniform sampler2D vignette;

void main() 
{
	gl_FragColor = texture2D(vignette, vUv);
}