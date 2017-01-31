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
    // wPos.y = sqrt(wPos.y/.2);
    gl_Position = projectionMatrix * viewMatrix * wPos;
}