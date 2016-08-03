varying vec2 vTexcoord;
varying vec3 vNormal;
varying vec3 vWorldPosition, vViewPosition;

vertex:
    attribute vec3 position;
    attribute vec2 texcoord;
    attribute vec3 normal;

    uniform mat4 proj, view;
    uniform vec2 offset;

    void main(){
        vTexcoord = texcoord;
        vNormal = normal;
        vWorldPosition = vec3(offset.x, 0, offset.y) + position;
        vViewPosition = (view*vec4(vWorldPosition, 1)).xyz;
        gl_Position = proj * vec4(vViewPosition, 1);
    }

fragment:
    uniform sampler2D textureRadiance;
    uniform vec2 radianceSize;

    vec3 getRadianceMip(vec2 uv, float vOffset, float lod){
        float size = pow(2.0, lod);
        
        float hOffset = pow(2.0, lod)-1.0 + lod*2.0;
        vec2 texcoord = (vec2(hOffset, vOffset)+1.0+uv*size)/radianceSize;
        return texture2D(textureRadiance, texcoord).rgb;
    }

    vec3 getRadianceSlice(vec2 uv, float slice, float angularChange){
        float size = max(128.0, pow(2.0, slice+4.0));
        float offset0 = 130.0*min(slice,4.0);
        float i2 = max(slice-4.0, 0.0);
        float offset1 = pow(2.0, i2+8.0) - 256.0 + 2.0*i2;
        float vOffset = offset0 + offset1;

        float maxLod = log(size)/log(2.0);

        float pixelsPerChange = size*0.7*angularChange; // approximately 1/sqrt(2)
        float lod = log(pixelsPerChange)/log(2.0);
        lod = clamp(maxLod-lod, 0.0, maxLod);
        //lod = maxLod;

        return mix(
            getRadianceMip(uv, vOffset, floor(lod)),
            getRadianceMip(uv, vOffset, floor(lod)+1.0),
            fract(lod)
        );
    }
    
    float translateRoughness(float roughness){
        float minAngle = 360.0/512.0;
        float basis = 2.5198420997897464;
        float angle = mix(minAngle, 180.0, roughness);
        float factor = 1.0 - logN(180.0/angle, basis)/6.0;
        return clamp(factor, 0.0, 1.0);
    }

    uniform float exposure;
    vec3 getRadiance(vec3 dir, float roughness){
        roughness = translateRoughness(roughness);

        vec3 dd = fwidth(normalize(dir));
        float ddl2 = dot(dd,dd);
        float angularChange = acos(sqrt(4.0 - ddl2)*0.5)/PI;

        //float angularChange = acos(dot(normalize(dir+fwidth(dir)), dir))/PI; // creates artifacts

        vec2 uv = normalToUv(dir);

        float slice = (1.0-roughness)*6.0;
        float slice0 = floor(slice);
        float slice1 = slice0 + 1.0;
        float f = fract(slice);
        
        vec3 color0 = getRadianceSlice(uv, slice0, angularChange);
        vec3 color1 = getRadianceSlice(uv, slice1, angularChange);

        return mix(color0, color1, f)*exposure;
        //return vec3(angularChange*10.0);
    }
    
    vec3 getDiffuse(vec3 normal){
        return getRadiance(normal, 1.0)*exposure;
    }


    uniform mat3 invRot;
    uniform sampler2D textureBaseColor;
    uniform sampler2D textureAO;
    uniform sampler2D textureCavity;
    uniform sampler2D textureShadow;

    uniform float diffuseReflectance, specularReflectance, specularMix, emissivity;

    uniform float roughness1, fresnel1, metallness1;
    uniform float roughness2, fresnel2, metallness2;

    float getFresnel(vec3 N, vec3 V, float r){
        float c = dot(N, V);
        r = pow(r, 5.0);
        return r+(1.0-r)*pow(1.0-c, 5.0);
    }

    void test(){
        vec3 N = normalize(vNormal);
        vec3 V = invRot * normalize(-vViewPosition);
        vec3 R = reflect(-V, N);
        vec3 incident = getRadiance(R, 0.0);
        float luminance = incident.r+incident.g+incident.b;
        if(luminance > 4.0){
            gl_FragColor = vec4(gamma(incident),1);
        }
        else{
            gl_FragColor = vec4(0,0,0,1);
        }
    }

    void main(){
        //test();
        
        vec3 N = normalize(vNormal);
        vec3 V = invRot * normalize(-vViewPosition);
        vec3 R = reflect(-V, N);
        
        //vec3 baseColor = degamma(texture2D(textureBaseColor, vTexcoord).rgb);
        vec3 baseColor = degamma(vec3(1));
        vec3 ao = degamma(texture2D(textureAO, vTexcoord).rgb);
        vec3 cavity = degamma(texture2D(textureCavity, vTexcoord).rgb);
        vec3 shadow = degamma(texture2D(textureShadow, vTexcoord).rgb);

        vec3 diffuseIncident = getDiffuse(N)*ao;
        vec3 specularIncident1 = getRadiance(R, roughness1);
        vec3 specularIncident2 = getRadiance(R, roughness2);

        float f1 = getFresnel(N, V, fresnel1)*specularReflectance;
        float f2 = getFresnel(N, V, fresnel2)*specularReflectance;

        float f = mix(f1, f2, specularMix);

        vec3 diffuseExcident = diffuseIncident*baseColor*diffuseReflectance*(1.0-f);
        vec3 specularExcident1 = mix(specularIncident1, specularIncident1*baseColor, metallness1)*f1;
        vec3 specularExcident2 = mix(specularIncident2, specularIncident2*baseColor, metallness2)*f2;
        vec3 specularExcident = mix(specularExcident1, specularExcident2, specularMix);

        vec3 excident = diffuseExcident+specularExcident+emissivity*baseColor;

        gl_FragColor = vec4(gamma(excident),1);
        //gl_FragColor = vec4(gamma(getRadiance(N, 1.0)),1);
        //gl_FragColor = vec4(1,0,1,1);
    }
