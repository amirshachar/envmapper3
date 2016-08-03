varying vec2 texcoord;

vertex:
    attribute vec2 position;
    void main(){
        texcoord = position*0.5+0.5;
        gl_Position = vec4(position, 0, 1);
    }

fragment:
    uniform sampler2D source;
    void main(){
        gl_FragColor = texture2D(source, texcoord);
        //gl_FragColor = vec4(1,0,1,1);
    }
