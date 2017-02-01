varying vec2 vUv;
varying vec3 vNormal;

uniform float time;
uniform sampler2D gradientTexture;

void main() 
{
	float front = clamp(-normalize(vNormal).z, 0.0, 1.0);
	float influence = 1.0 - abs(vUv.y - .5) / .5;

	vec2 uv = vUv;

	vec4 c = texture2D(gradientTexture, uv + vec2(cos(time) * .1, -sin(time) * .05));

	float height = smoothstep(0.0, .2, vUv.y);
	gl_FragColor = c * vec4(front * height) * 2.0;
}