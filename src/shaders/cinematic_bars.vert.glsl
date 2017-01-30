
void main() {
    vec3 pos = position;
    gl_Position = vec4(pos.xy, .01, 1.0);
}