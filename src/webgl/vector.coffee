tau = Math.PI*2

exports.Vec3 = class Vec3
    constructor: (@x=0, @y=0, @z=0) -> null

    set: (@x=0, @y=0, @z=0) -> return @
    
    set: (x=0,y=0,z=0) ->
        if typeof x == 'number'
            @x = x
            @y = y
            @z = z
        else
            other = x
            @x = other.x
            @y = other.y
            @z = other.z
        return @

    rotatey: (angle) ->
        rad = tau*(angle/360)
        s = Math.sin rad
        c = Math.cos rad

        x = @z*s + @x*c
        z = @z*c - @x*s

        @x = x
        @z = z
        
        return @
    
    normalize: ->
        l = @slength()
        if l > 0
            l = Math.sqrt(l)
            @x/=l
            @y/=l
            @z/=l

        return @
    
    multiply: (scalar) ->
        @x *= scalar
        @y *= scalar
        @z *= scalar
        @w *= scalar
        return @

    add: (other) ->
        @x += other.x
        @y += other.y
        @z += other.z
        return @
    

exports.Vec4 = class Vec4
    constructor: (@x=0, @y=0, @z=0, @w=1) ->

    normalize: ->
        l = @slength()
        if l > 0
            l = Math.sqrt(l)
            @x/=l
            @y/=l
            @z/=l

        return @

    slength: ->
        return @x*@x + @y*@y + @z*@z

    multiply: (scalar) ->
        @x *= scalar
        @y *= scalar
        @z *= scalar
        @w *= scalar
        return @

    add: (other) ->
        @x += other.x
        @y += other.y
        @z += other.z
        @w += other.w
        return @

    set: (other) ->
        @x = other.x
        @y = other.y
        @z = other.z
        @w = other.w
        return @
