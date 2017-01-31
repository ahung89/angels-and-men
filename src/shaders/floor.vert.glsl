varying vec2 vUv;


void main() 
{
	vUv = uv;
    vec3 pos = position;

    pos.y += clamp((length(pos) - 40.0) * .1, 0.0, 1.0) * 50.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}