#define sectorize(value) step(0.0, (value))*2.0-1.0
#define sum(value) dot(clamp((value), 1.0, 1.0), (value))
#define PI 3.141592653589793

vec2 normalToUvRectOct(vec3 normal){
    normal /= sum(abs(normal));
    if(normal.y > 0.0){
        return normal.xz*0.5+0.5;
    }
    else{
        vec2 suv = sectorize(normal.xz);
        vec2 uv = suv-suv*abs(normal.zx);
        return uv*0.5+0.5;
    }
}

vec3 uvToNormalRectOct(vec2 uv){
    uv = uv*2.0-1.0;
    vec2 auv = abs(uv);
    vec2 suv = sectorize(uv);
    float l = sum(auv);

    if(l > 1.0){
        uv = (1.0-auv.ts)*suv;
    }

    return normalize(vec3(uv.s,1.0-l,uv.t));
}

vec2 normalToUvSphOct(vec3 normal){
    normal = normalize(normal);
    vec3 aNorm = abs(normal);
    vec3 sNorm = sectorize(normal);

    vec2 dir = max(aNorm.xz, 1e-20);
    float orient = atan(dir.x, dir.y)/(PI*0.5);

    dir = max(vec2(aNorm.y, length(aNorm.xz)), 1e-20);
    float pitch = atan(dir.y, dir.x)/(PI*0.5);

    vec2 uv = vec2(sNorm.x*orient, sNorm.z*(1.0-orient))*pitch;

    if(normal.y < 0.0){
        uv = sNorm.xz - abs(uv.ts)*sNorm.xz;
    }
    return uv*0.5+0.5;
}

vec3 uvToNormalSphOct(vec2 uv){
    uv = uv*2.0-1.0;
    vec2 suv = sectorize(uv);
    float pitch = sum(abs(uv))*PI*0.5;

    if(sum(abs(uv)) > 1.0){
        uv = (1.0-abs(uv.ts))*suv;
    }

    float orient = (abs(uv.s)/sum(abs(uv)))*PI*0.5;
    float sOrient = sin(orient);
    float cOrient = cos(orient);
    float sPitch = sin(pitch);
    float cPitch = cos(pitch);

    return vec3(
        sOrient*suv.s*sPitch,
        cPitch,
        cOrient*suv.t*sPitch
    );
}

#define uvToNormal uvToNormalSphOct
#define normalToUv normalToUvSphOct
//#define uvToNormal uvToNormalRectOct
//#define normalToUv normalToUvRectOct
