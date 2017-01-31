varying vec2 vUv;
varying vec3 vNormal;
varying vec3 worldPos;

uniform float time;

void main() 
{
	vUv = uv;
	vNormal = normalMatrix * normal;
	
    vec3 pos = position;
    pos.y += uv.x * .1;

    vec4 wPos = modelMatrix * vec4(pos, 1.0);
    pos.z += uv.x * sin(time * 2.0 + (wPos.x + wPos.y + wPos.z) * .5) * .025;

    wPos = modelMatrix * vec4(pos, 1.0);
    worldPos = wPos.xyz;

    float x = clamp(wPos.x / 8.0, 0.0, 1.0);

    //(sin(x*3.14) + x) * .75 * x
    // wPos.y -= (sin(x * 3.14 + time + wPos.z) + x) *x * .75 * vUv.x;
    gl_Position = projectionMatrix * viewMatrix * wPos;
}