uniform sampler2D textureEnv;
vec3 textureRectEnv(vec3 normal){
    vec2 dir = normalize(normal.xz);
    vec2 texcoord = vec2(
        atan(-dir.x, -dir.y)/TAU+0.5,
        acos(normal.y)/PI
    );
    return texture2D(textureEnv, texcoord).rgb;
}
