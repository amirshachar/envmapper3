varying vec2 texcoord;

vertex:
    attribute vec2 position;
    void main(){
        texcoord = position*0.5+0.5;
        gl_Position = vec4(position, 0, 1);
    }

fragment:
    uniform sampler2D source;
    uniform float size;
    void main(){
        //vec2 coord = gl_FragCoord.st;
        vec2 coord = texcoord*size;

        vec2 acoord = abs(coord-size*0.5);
        float limit = size*0.5-1.0;
        vec2 sourceCoord = clamp(coord-1.0, 0.5, size-2.5);
        vec2 uv = sourceCoord/(size-2.0);

        if(acoord.x > limit && acoord.y > limit){
            uv = 1.0 - uv;
        }
        else if(acoord.x > limit){
            uv.y = 1.0 - uv.y;
        }
        else if(acoord.y > limit){
            uv.x = 1.0 - uv.x;
        }

        vec4 texel = texture2D(source, uv);
        gl_FragColor = vec4(texel.rgb/texel.a, 1);
    }
