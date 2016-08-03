varying vec2 texcoord;

vertex:
    attribute vec2 position;
    void main(){
        texcoord = position*0.5+0.5;
        gl_Position = vec4(position, 0, 1);
    }

fragment:
    #define numSamples 50
    uniform vec2 samples[numSamples];
    uniform float angle;
    uniform float lambertExponent;
    uniform vec2 size;

    /*
    vec3 getDir(vec2 rnd, vec3 normal){
        float r = rnd.s * 2.0 * PI;
        float z = rnd.t*2.0-1.0;
        float scale = sqrt(1.0-z*z);
        vec3 dir = vec3(cos(r)*scale, sin(r)*scale, z);
        if(dot(dir, normal) < 0.0){
            return -dir;
        }
        else{
            return dir;
        }
    }
    */

    vec3 getDir(vec2 rnd, vec3 normal){
        if(angle >= 20.0){
            float r = rnd.s * 2.0 * PI;
            float z = rnd.t*2.0-1.0;
            float scale = sqrt(1.0-z*z);
            vec3 dir = vec3(cos(r)*scale, sin(r)*scale, z);
            if(dot(normal, dir) < 0.0){
                dir = -dir;
            }
            return dir;
        }
        else{
            vec3 tangent = normalize(cross(vec3(0,1,0), normal));
            vec3 cotangent = normalize(cross(tangent, normal));

            //float a = (clamp(angle, 0.0, 90.0)/90.0)*PIH;
            float a = (clamp(angle, 0.0, 90.0)/90.0)*PIH;
            float z = mix(1.0, cos(a), rnd.t);
            //float z = rnd.t*2.0-1.0;
            float r = rnd.s * TAU;
            float scale = sqrt(1.0-z*z);
            float x = cos(r)*scale;
            float y = sin(r)*scale;

            vec3 dir = normalize(
                x*tangent + 
                y*cotangent +
                z*normal
            );
            return dir;
        }
    }

    void main(){
        vec4 accum = vec4(0);
        vec3 normal = uvToNormal(texcoord);
        for(int i=0; i<numSamples; i++){
            vec3 dir = getDir(samples[i], normal);
            float lambert = max(0.0, dot(normal, dir));
            float weight = pow(lambert, lambertExponent);
            vec3 color = textureRectEnv(dir);
            accum += vec4(color*weight, weight);
        }
        gl_FragColor = accum;

        /*
        // test pattern
        vec2 coord = texcoord*2.0-1.0;
        coord = step(0.0, coord);
        float l = sum(abs(texcoord*2.0-1.0));
        if(l > 1.0){
            gl_FragColor.rgb = vec3(coord.s, 1, coord.t)*(0.5+(l-1.0)*0.5);
        }
        else{
            gl_FragColor.rgb = vec3(coord.s, 0, coord.t)*(0.5+l*0.5);
        }
        gl_FragColor.a = 1.0;
        */
    }
