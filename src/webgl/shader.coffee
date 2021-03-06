matrix = require 'matrix'
{Vec3,Vec4} = require 'vector'

exports.ShaderObj = class ShaderObj

boilerplate = '''
    #extension GL_OES_standard_derivatives : enable

    precision highp int;
    precision highp float;
    #define PI 3.141592653589793
    #define TAU 6.283185307179586
    #define PIH 1.5707963267948966
    #define E 2.7182818284590451
    #define logN(x, base) (log(x)/log(base))
    float angleBetween(vec3 a, vec3 b){return acos(dot(a,b));}

    vec3 gammasRGB(vec3 color){
        return mix(
            color*12.92,
            pow(color, vec3(1.0/2.4))*1.055-0.055,
            step((0.04045/12.92), color)
        );
    }

    vec3 degammasRGB(vec3 color){
        return mix(
            color/12.92,
            pow((color+0.055)/1.055, vec3(2.4)),
            step(0.04045, color)
        );
    }

    vec3 gamma(vec3 color){
        //return gammasRGB(color);
        return pow(color, vec3(1.0/2.2));
    }

    vec3 degamma(vec3 color){
        //return degammasRGB(color);
        return pow(color, vec3(2.2));
    }
    
    float linstep(float edge0, float edge1, float value){
        return clamp((value-edge0)/(edge1-edge0), 0.0, 1.0);
    }
    
    float linstepOpen(float edge0, float edge1, float value){
        return (value-edge0)/(edge1-edge0);
    }

    vec2 linstep(vec2 edge0, vec2 edge1, vec2 value){
        return clamp((value-edge0)/(edge1-edge0), vec2(0.0), vec2(1.0));
    }
    
    vec2 linstepOpen(vec2 edge0, vec2 edge1, vec2 value){
        return (value-edge0)/(edge1-edge0);
    }

    float pyramidstep(float edge0, float edge1, float value){
        float f = (value-edge0)/(edge1-edge0);
        return clamp(abs(f*2.0-1.0), 0.0, 1.0);
    }
    
    vec2 pyramidstep(vec2 edge0, vec2 edge1, vec2 value){
        vec2 f = (value-edge0)/(edge1-edge0);
        return abs(f*2.0-1.0);
    }
    
    vec3 pyramidstep(vec3 edge0, vec3 edge1, vec3 value){
        vec3 f = (value-edge0)/(edge1-edge0);
        return abs(f*2.0-1.0);
    }
    
    vec2 encodeNormal(vec3 n){
        float f = sqrt(8.0*n.z+8.0);
        return n.xy / f + 0.5;
    }

    vec3 decodeNormal(vec2 enc){
        vec2 fenc = enc*4.0-2.0;
        float f = dot(fenc,fenc);
        float g = sqrt(1.0-f/4.0);
        return vec3(
            fenc*g,
            1.0-f/2.0
        );
    }

    vec2 pack16(float value){
        float sMax = 65535.0;
        int v = int(clamp(value, 0.0, 1.0)*sMax+0.5);
        int digit0 = v/256;
        int digit1 = v-digit0*256;
        return vec2(float(digit0)/255.0, float(digit1)/255.0);
    }

    vec2 pack16(int v){
        int digit0 = v/256;
        int digit1 = v-digit0*256;
        return vec2(float(digit0)/255.0, float(digit1)/255.0);
    }

    float unpack16(vec2 value){
        return (
            value.x*0.996108949416342426275150501169264316558837890625 +
            value.y*0.00389105058365758760263730664519243873655796051025390625
        );
    }
'''

exports.Shader = class Shader extends ShaderObj
    constructor: (@gf, params) ->
        @gl = @gf.gl

        @program    = @gl.createProgram()
        @vs         = @gl.createShader @gl.VERTEX_SHADER
        @fs         = @gl.createShader @gl.FRAGMENT_SHADER
        @gl.attachShader @program, @vs
        @gl.attachShader @program, @fs

        @source params

    source: (params) ->
        if typeof params is 'string'
            [common, vertex, fragment] = @splitSource params
        else if params instanceof sys.File
            [common, vertex, fragment] = @splitSource params.read()
        else if params instanceof Array
            common = []
            vertex = []
            fragment = []
            for file in params
                [c, v, f] = @splitSource file.read()
                if c.length > 0 then common.push c
                if v.length > 0 then vertex.push v
                if f.length > 0 then fragment.push f

            common = common.join('\n')
            vertex = vertex.join('\n')
            fragment = fragment.join('\n')

        @setSource common:common, vertex:vertex, fragment:fragment
    
    destroy: ->
        @gl.deleteShader @vs
        @gl.deleteShader @fs
        @gl.deleteProgram @program

    splitSource: (source) ->
        common = []
        vertex = []
        fragment = []
        current = common

        lines = source.trim().split('\n')
        filename = lines.shift().split(' ')[1]

        for line, linenum in lines
            if line.match /vertex:$/
                current = vertex
            else if line.match /fragment:$/
                current = fragment
            else
                current.push "#line #{linenum} #{filename}"
                current.push line

        return [common.join('\n').trim(), vertex.join('\n').trim(), fragment.join('\n').trim()]

    preprocess: (source) ->
        lines = []
        result = []
        filename = 'no file'
        lineno = 1
        for line in source.trim().split('\n')
            match = line.match /#line (\d+) (.*)/
            if match
                lineno = parseInt(match[1], 10)+1
                filename = match[2]
            else
                lines.push
                    source: line
                    lineno: lineno
                    filename: filename
                result.push line
                lineno += 1
        return [result.join('\n'), lines]
    
    setSource: ({common, vertex, fragment}) ->
        @uniformCache = {}
        @attributeCache = {}

        common ?= ''
        @compileShader @vs, [common, vertex].join('\n')
        @compileShader @fs, [common, fragment].join('\n')
        @link()
    
    compileShader: (shader, source) ->
        source = [boilerplate, source].join('\n')
        [source, lines] = @preprocess source

        @gl.shaderSource shader, source
        @gl.compileShader shader

        if not @gl.getShaderParameter shader, @gl.COMPILE_STATUS
            error = @gl.getShaderInfoLog(shader)
            throw @translateError error, lines
    
    link: ->
        @gl.linkProgram @program

        if not @gl.getProgramParameter @program, @gl.LINK_STATUS
            throw new Error("Shader Link Error: #{@gl.getProgramInfoLog(@program)}")
    
    translateError: (error, lines) ->
        result = ['Shader Compile Error']
        for line, i in error.split('\n')
            match = line.match /ERROR: \d+:(\d+): (.*)/
            if match
                lineno = parseFloat(match[1])-1
                message = match[2]
                sourceline = lines[lineno]
                result.push "File \"#{sourceline.filename}\", Line #{sourceline.lineno}, #{message}"
                result.push "   #{sourceline.source}"
            else
                result.push line

        return result.join('\n')
    
    attributeLocation: (name, index) ->
        if index?
            @attributeCache[name] = index
            @gl.bindAttribLocation @program, index, name
            return index
        else
            location = @attributeCache[name]
            if location is undefined
                location = @gl.getAttribLocation @program, name
                if location >= 0
                    @attributeCache[name] = location
                    return location
                else
                    @attributeCache[name] = null
                    return null
            else
                return location
    
    uniformLocation: (name) ->
        location = @uniformCache[name]
        if location is undefined
            location = @gl.getUniformLocation @program, name
            if location?
                @uniformCache[name] = location
                return location
            else
                @uniformCache[name] = null
                return null
        else
            return location
    
    use: ->
        if @gf.currentShader isnt @
            @gf.currentShader = @
            @gl.useProgram @program

    mat4: (name, value) ->
        if value instanceof matrix.Mat4
            value = value.data

        location = @uniformLocation name
        if location?
            @use()
            @gl.uniformMatrix4fv location, false, value
        
        return @
    
    mat3: (name, value) ->
        if value instanceof matrix.Mat3
            value = value.data

        location = @uniformLocation name
        if location?
            @use()
            @gl.uniformMatrix3fv location, false, value
        
        return @
    
    vec2: (name, a, b) ->
        location = @uniformLocation name

        if location?
            @use()
            if a instanceof Array or a instanceof Float32Array
                @gl.uniform2fv location, a
            else
                @gl.uniform2f location, a, b
        return @

    vec3: (name, a, b, c) ->
        location = @uniformLocation name

        if location?
            @use()
            if a instanceof Array or a instanceof Float32Array
                @gl.uniform3fv location, a
            else if a instanceof Vec3
                @gl.uniform3f location, a.x, a.y, a.z
            else
                @gl.uniform3f location, a, b, c
        return @
    
    vec4: (name, a, b, c, d) ->
        location = @uniformLocation name

        if location?
            @use()
            if a instanceof Array or a instanceof Float32Array
                @gl.uniform4fv location, a
            else
                @gl.uniform4f location, a, b, c, d
        return @

    int: (name, value) ->
        location = @uniformLocation name
        if location?
            @use()
            @gl.uniform1i location, value
        return @

    uniformSetter: (obj) ->
        obj.setUniformsOn(@)
        return @

    float: (name, value) ->
        location = @uniformLocation name
        if location?
            @use()
            if value instanceof Array or value instanceof Float32Array
                @gl.uniform1fv location, value
            else
                @gl.uniform1f location, value
        return @

exports.ShaderProxy = class ShaderProxy extends ShaderObj
    constructor: (@shader=null) ->
    
    attributeLocation: (name) ->
        @shader.attributeLocation(name)

    uniformLocation: (name) ->
        @shader.uniformLocation(name)

    use: ->
        @shader.use()
        return @

    mat4: (name, value) ->
        @shader.mat4 name, value
        return @

    vec2: (name, a, b) ->
        @shader.vec2 name, a, b
        return @

    vec3: (name, a, b, c) ->
        @shader.vec3 name, a, b, c
        return @
    
    vec4: (name, a, b, c, d) ->
        @shader.vec4 name, a, b, c, d
        return @

    int: (name, value) ->
        @shader.int name, value
        return @

    uniformSetter: (obj) ->
        @shader.uniformSetter obj
        return @

    float: (name, value) ->
        @shader.float name, value
        return @
