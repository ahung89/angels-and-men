varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;

uniform sampler2D sphereLit;

void main() 
{
	float influence = pow(abs(vUv.x - .5) / .5, 4.0);
	vec4 color = texture2D(sphereLit, (normalize(vNormal).xy * .5 + vec2(.5)));
	gl_FragColor = color + vec4(influence * influence);
}