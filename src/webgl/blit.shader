varying vec2 texcoord;

vertex:
    attribute vec2 position;
    uniform vec2 viewport;

    void main(){
        texcoord = position*0.5+0.5;
        gl_Position = vec4(position, 0, 1);
    }

fragment:
    uniform sampler2D source;
    uniform float scale;

    void main(){
        gl_FragColor.rgb = pow(texture2D(source, texcoord*scale).rgb, vec3(1.0/2.2));
        gl_FragColor.a = 1.0;
    }
