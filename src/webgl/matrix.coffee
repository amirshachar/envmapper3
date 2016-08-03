tau = Math.PI*2
deg = 360/tau
arc = tau/360

exports.Mat3 = class Mat3
    constructor: (data=null) ->
        @data = data ? new Float32Array(9)
        @identity()
    
    identity: ->
        d = @data
        d[0]  = 1; d[1]  =0; d[2] = 0
        d[3]  = 0; d[4]  =1; d[5] = 0
        d[6]  = 0; d[7]  =0; d[8] = 1
        return @

    value: (value) ->
        for i in [0...@data.length]
            @data[i] = value

    rotatex: (angle) ->
        s = Math.sin angle*arc
        c = Math.cos angle*arc
        return @amul(
             1,  0,  0,
             0,  c,  s,
             0, -s,  c
        )
    
    rotatey: (angle) ->
        s = Math.sin angle*arc
        c = Math.cos angle*arc
        return @amul(
             c,  0, -s,
             0,  1,  0,
             s,  0,  c
        )
    
    rotatez: (angle) ->
        s = Math.sin angle*arc
        c = Math.cos angle*arc
        return @amul(
             c,  s,  0,
            -s,  c,  0,
             0,  0,  1
        )

    amul: (
        b00, b10, b20,
        b01, b11, b21,
        b02, b12, b22,
        b03, b13, b23
    ) ->
        a = @data

        a00 = a[0]
        a10 = a[1]
        a20 = a[2]
        
        a01 = a[3]
        a11 = a[4]
        a21 = a[5]
        
        a02 = a[6]
        a12 = a[7]
        a22 = a[8]
        
        a[0]  = a00*b00 + a01*b10 + a02*b20
        a[1]  = a10*b00 + a11*b10 + a12*b20
        a[2]  = a20*b00 + a21*b10 + a22*b20
        
        a[3]  = a00*b01 + a01*b11 + a02*b21
        a[4]  = a10*b01 + a11*b11 + a12*b21
        a[5]  = a20*b01 + a21*b11 + a22*b21
        
        a[6]  = a00*b02 + a01*b12 + a02*b22
        a[7]  = a10*b02 + a11*b12 + a12*b22
        a[8]  = a20*b02 + a21*b12 + a22*b22

        return @
    
    mulVec3: (vec, dst=vec) ->
        @mulVal3 vec.x, vec.y, vec.z, dst
        return dst

    mulVal3: (x, y, z, dst) ->
        d = @data
        dst.x = d[0]*x + d[3]*y + d[6]*z
        dst.y = d[1]*x + d[4]*y + d[7]*z
        dst.z = d[2]*x + d[5]*y + d[8]*z

        return @

exports.Mat4 = class Mat4
    constructor: (data) ->
        if data?
            if not data instanceof Float32Array
                data = new Float32Array(data)
            @data = data
        else
            @data = new Float32Array(16)
            @identity()
    
    identity: ->
        d = @data
        d[0]  = 1; d[1]  =0; d[2]  = 0; d[3]  = 0
        d[4]  = 0; d[5]  =1; d[6]  = 0; d[7]  = 0
        d[8]  = 0; d[9]  =0; d[10] = 1; d[11] = 0
        d[12] = 0; d[13] =0; d[14] = 0; d[15] = 1
        return @

    value: (value) ->
        for i in [0...@data.length]
            @data[i] = value
    
    zero: ->
        d = @data
        d[0]  = 0; d[1]  =0; d[2]  = 0; d[3]  = 0
        d[4]  = 0; d[5]  =0; d[6]  = 0; d[7]  = 0
        d[8]  = 0; d[9]  =0; d[10] = 0; d[11] = 0
        d[12] = 0; d[13] =0; d[14] = 0; d[15] = 0
        return @

    multiply: (other) ->
        b = @data
        a = other.data
        out = b

        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3]
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7]
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11]
        a30 = a[12]; a31 = a[13]; a32 = a[14]; a33 = a[15]

        b0  = b[0]; b1 = b[1]; b2 = b[2]; b3 = b[3]
        out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30
        out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31
        out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32
        out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7]
        out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30
        out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31
        out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32
        out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11]
        out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30
        out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31
        out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32
        out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15]
        out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30
        out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31
        out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32
        out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33

        return @

    transpose: ->
        a = out = @data

        a01 = a[1]; a02 = a[2]; a03 = a[3]; a12 = a[6]; a13 = a[7]; a23 = a[11]

        out[1] = a[4]
        out[2] = a[8]
        out[3] = a[12]
        out[4] = a01
        out[6] = a[9]
        out[7] = a[13]
        out[8] = a02
        out[9] = a12
        out[11] = a[14]
        out[12] = a03
        out[13] = a13
        out[14] = a23

        return @
    
    copy: (dest) ->
        dest ?= new Mat4()

        src = @data
        dst = dest.data
        dst[0] = src[0]
        dst[1] = src[1]
        dst[2] = src[2]
        dst[3] = src[3]
        dst[4] = src[4]
        dst[5] = src[5]
        dst[6] = src[6]
        dst[7] = src[7]
        dst[8] = src[8]
        dst[9] = src[9]
        dst[10] = src[10]
        dst[11] = src[11]
        dst[12] = src[12]
        dst[13] = src[13]
        dst[14] = src[14]
        dst[15] = src[15]
        return dest
   
    ###
    perspective: (fov, aspect, near, far) ->
        fov ?= 60
        aspect ?= 1
        near ?= 0.01
        far ?= 100

        # diagonal fov
        hyp = Math.sqrt(1 + aspect*aspect)
        rel = 1/hyp
        vfov = fov*rel

        @zero()
        d = @data
        top = near * Math.tan(vfov*Math.PI/360)
        right = top*aspect
        left = -right
        bottom = -top

        d[0] = (2*near)/(right-left)
        d[5] = (2*near)/(top-bottom)
        d[8] = (right+left)/(right-left)
        d[9] = (top+bottom)/(top-bottom)
        d[10] = -(far+near)/(far-near)
        d[11] = -1
        d[14] = -(2*far*near)/(far-near)

        return @
    ###
    
    perspective: (fov, aspect, near, far) ->
        @zero()
        d = @data
        
        hyp = Math.sqrt(1 + aspect*aspect)
        rel = 1/hyp
        vfov = fov*rel
        
        top = near * Math.tan(vfov*Math.PI/360)
        right = top*aspect
        left = -right
        bottom = -top

        d[0] = (2*near)/(right-left)
        d[5] = (2*near)/(top-bottom)
        d[8] = (right+left)/(right-left)
        d[9] = (top+bottom)/(top-bottom)
        d[10] = -(far+near)/(far-near)
        d[11] = -1
        d[14] = -(2*far*near)/(far-near)

        return @
        
    inversePerspective: (fov, aspect, near, far) ->
        @zero()
        dst = @data
        
        hyp = Math.sqrt(1 + aspect*aspect)
        rel = 1/hyp
        vfov = fov*rel
        
        top = near * Math.tan(vfov*Math.PI/360)
        right = top*aspect
        left = -right
        bottom = -top
    
        dst[0] = (right-left)/(2*near)
        dst[5] = (top-bottom)/(2*near)
        dst[11] = -(far-near)/(2*far*near)
        dst[12] = (right+left)/(2*near)
        dst[13] = (top+bottom)/(2*near)
        dst[14] = -1
        dst[15] = (far+near)/(2*far*near)

        return @
    
    ortho: (near=-1, far=1, top=-1, bottom=1, left=-1, right=1) ->
        rl = right-left
        tb = top - bottom
        fn = far - near

        return @set(
            2/rl,   0,      0,      -(left+right)/rl,
            0,      2/tb,   0,      -(top+bottom)/tb,
            0,      0,      -2/fn,  -(far+near)/fn,
            0,      0,      0,      1,
        )
        
    inverseOrtho: (near=-1, far=1, top=-1, bottom=1, left=-1, right=1) -> #FIXME?
        a = (right-left)/2
        b = (right+left)/2
        c = (top-bottom)/2
        d = (top+bottom)/2
        e = (far-near)/-2
        f = (near+far)/2
        g = 1

        return @set(
            a, 0, 0, b,
            0, c, 0, d,
            0, 0, e, f,
            0, 0, 0, g
        )
    
    translate: (x, y, z) ->
        d = @data
        a00 = d[0]; a01 = d[1]; a02 = d[2]; a03 = d[3]
        a10 = d[4]; a11 = d[5]; a12 = d[6]; a13 = d[7]
        a20 = d[8]; a21 = d[9]; a22 = d[10]; a23 = d[11]

        d[12] = a00 * x + a10 * y + a20 * z + d[12]
        d[13] = a01 * x + a11 * y + a21 * z + d[13]
        d[14] = a02 * x + a12 * y + a22 * z + d[14]
        d[15] = a03 * x + a13 * y + a23 * z + d[15]

        return @

    scale: (x,y,z) ->
        d = @data

        d[0] = d[0] * x
        d[1] = d[1] * x
        d[2] = d[2] * x
        d[3] = d[3] * x
        d[4] = d[4] * y
        d[5] = d[5] * y
        d[6] = d[6] * y
        d[7] = d[7] * y
        d[8] = d[8] * z
        d[9] = d[9] * z
        d[10] = d[10] * z
        d[11] = d[11] * z

        return @
    
    rotatex: (angle) ->
        d = @data
        rad = tau*(angle/360)
        s = Math.sin rad
        c = Math.cos rad

        a10 = d[4]
        a11 = d[5]
        a12 = d[6]
        a13 = d[7]
        a20 = d[8]
        a21 = d[9]
        a22 = d[10]
        a23 = d[11]

        d[4] = a10 * c + a20 * s
        d[5] = a11 * c + a21 * s
        d[6] = a12 * c + a22 * s
        d[7] = a13 * c + a23 * s
        d[8] = a10 * -s + a20 * c
        d[9] = a11 * -s + a21 * c
        d[10] = a12 * -s + a22 * c
        d[11] = a13 * -s + a23 * c

        return @

    rotatey: (angle) ->
        d = @data
        rad = tau*(angle/360)
        s = Math.sin rad
        c = Math.cos rad

        a00 = d[0]
        a01 = d[1]
        a02 = d[2]
        a03 = d[3]
        a20 = d[8]
        a21 = d[9]
        a22 = d[10]
        a23 = d[11]

        d[0] = a00 * c + a20 * -s
        d[1] = a01 * c + a21 * -s
        d[2] = a02 * c + a22 * -s
        d[3] = a03 * c + a23 * -s
        d[8] = a00 * s + a20 * c
        d[9] = a01 * s + a21 * c
        d[10] = a02 * s + a22 * c
        d[11] = a03 * s + a23 * c

        return @

    rotatez: (angle) ->
        d = @data
        rad = tau*(angle/360)
        s = Math.sin rad
        c = Math.cos rad

        a00 = d[0]
        a01 = d[1]
        a02 = d[2]
        a03 = d[3]
        a10 = d[4]
        a11 = d[5]
        a12 = d[6]
        a13 = d[7]

        d[0] = a00 * c + a10 * s
        d[1] = a01 * c + a11 * s
        d[2] = a02 * c + a12 * s
        d[3] = a03 * c + a13 * s
        d[4] = a10 * c - a00 * s
        d[5] = a11 * c - a01 * s
        d[6] = a12 * c - a02 * s
        d[7] = a13 * c - a03 * s

        return @
    
    invert: (destination=@) ->
        src = @data
        dst = destination.data

        a00 = src[0]; a01 = src[1]; a02 = src[2]; a03 = src[3]
        a10 = src[4]; a11 = src[5]; a12 = src[6]; a13 = src[7]
        a20 = src[8]; a21 = src[9]; a22 = src[10]; a23 = src[11]
        a30 = src[12]; a31 = src[13]; a32 = src[14]; a33 = src[15]

        b00 = a00 * a11 - a01 * a10
        b01 = a00 * a12 - a02 * a10
        b02 = a00 * a13 - a03 * a10
        b03 = a01 * a12 - a02 * a11
        b04 = a01 * a13 - a03 * a11
        b05 = a02 * a13 - a03 * a12
        b06 = a20 * a31 - a21 * a30
        b07 = a20 * a32 - a22 * a30
        b08 = a20 * a33 - a23 * a30
        b09 = a21 * a32 - a22 * a31
        b10 = a21 * a33 - a23 * a31
        b11 = a22 * a33 - a23 * a32

        d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06)
            
        if d==0 then return
        invDet = 1 / d

        dst[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet
        dst[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet
        dst[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet
        dst[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet
        dst[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet
        dst[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet
        dst[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet
        dst[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet
        dst[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet
        dst[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet
        dst[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet
        dst[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet
        dst[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet
        dst[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet
        dst[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet
        dst[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet

        return destination
    
    toMat3Rot: (dest) ->
        dst = dest.data
        src = @data
        a00 = src[0]; a01 = src[1]; a02 = src[2]
        a10 = src[4]; a11 = src[5]; a12 = src[6]
        a20 = src[8]; a21 = src[9]; a22 = src[10]

        b01 = a22 * a11 - a12 * a21
        b11 = -a22 * a10 + a12 * a20
        b21 = a21 * a10 - a11 * a20

        d = a00 * b01 + a01 * b11 + a02 * b21
        id = 1 / d

        dst[0] = b01 * id
        dst[3] = (-a22 * a01 + a02 * a21) * id
        dst[6] = (a12 * a01 - a02 * a11) * id
        dst[1] = b11 * id
        dst[4] = (a22 * a00 - a02 * a20) * id
        dst[7] = (-a12 * a00 + a02 * a10) * id
        dst[2] = b21 * id
        dst[5] = (-a21 * a00 + a01 * a20) * id
        dst[8] = (a11 * a00 - a01 * a10) * id

        return @
    
    set: (
        a00, a10, a20, a30,
        a01, a11, a21, a31,
        a02, a12, a22, a32,
        a03, a13, a23, a33,
    ) ->
        d = @data
        d[0]=a00; d[4]=a10; d[8]=a20; d[12]=a30
        d[1]=a01; d[5]=a11; d[9]=a21; d[13]=a31
        d[2]=a02; d[6]=a12; d[10]=a22; d[14]=a32
        d[3]=a03; d[7]=a13; d[11]=a23; d[15]=a33

        return @
    
    mulVec3: (vec, dst=vec) ->
        return @mulVal3 vec.x, vec.y, vec.z, dst

    mulVal3: (x, y, z, dst) ->
        d = @data
        dst.x = d[0]*x + d[4]*y + d[8] *z
        dst.y = d[1]*x + d[5]*y + d[9] *z
        dst.z = d[2]*x + d[6]*y + d[10]*z
        return dst

    mulVec4: (vec, dst) ->
        dst ?= vec
        return @mulVal4 vec[0], vec[1], vec[2], vec[3], dst

    mulVal4: (x, y, z, w, dst) ->
        d = @data
        dst.x = d[0]*x + d[4]*y + d[8] *z + d[12]*w
        dst.y = d[1]*x + d[5]*y + d[9] *z + d[13]*w
        dst.z = d[2]*x + d[6]*y + d[10]*z + d[14]*w
        dst.w = d[3]*x + d[7]*y + d[11]*z + d[15]*w

        return dst
