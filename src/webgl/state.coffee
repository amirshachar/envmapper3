util = require 'util'

{BaseBuffer, VertexBuffer} = require 'vertexbuffer'
{ShaderObj} = require 'shader'
framebuffer = require 'framebuffer'

exports = class State
    constructor: (@gf, params) ->
        @gl = @gf.gl

        if params.shader instanceof ShaderObj
            @shader = params.shader
            @ownShader = false
        else
            @shader = @gf.shader params.shader
            @ownShader = true

        if params.framebuffer?
            if params.framebuffer instanceof framebuffer.Framebuffer
                @framebuffer = params.framebuffer
                @ownFramebuffer = false
            else
                @framebuffer = @gf.framebuffer params.framebuffer
                @ownFramebuffer = true
        else
            @framebuffer = null
            @ownFramebuffer = false

        if params.vertexbuffer?
            @vertexbuffer params.vertexbuffer
        else
            @vertexbuffer @gf.quadVertices

        @texturesByName = {}
        @textures = []

        @depthTest = params.depthTest ? false
        @depthWrite = params.depthWrite ? true
        if params.colorMask?
            if typeof(params.colorMask) == 'boolean'
                @colorWrite = [
                    params.colorMask
                    params.colorMask
                    params.colorMask
                    params.colorMask
                ]
            else
                @colorWrite = [
                    params.colorMask[0] ? true
                    params.colorMask[1] ? true
                    params.colorMask[2] ? true
                    params.colorMask[3] ? true
                ]
        else
            @colorWrite = [true,true,true,true]

        if params.depthFunc?
            @depthFunc = @gl[params.depthFunc.toUpperCase()] ? @gl.LESS
        else
            @depthFunc = @gl.LESS

        if params.cull?
            @cullFace = @gl[params.cull.toUpperCase()] ? @gl.BACK
        else
            @cullFace = false

        @lineWidth = params.lineWidth ? 1

        if params.blend?
            switch params.blend
                when 'alpha'
                    @blend = @blendAlpha
                when 'add'
                    @blend = @blendAdd
                when 'multiply'
                    @blend = @blendMultiply
                else
                    throw new Error('blend mode is not implemented: ' + params.blend)
        else
            @blend = null

        if params.uniforms?
            for uniform in params.uniforms
                @[uniform.type](uniform.name, uniform.value)

        if @gf.vao?
            @vao = @gf.vao.createVertexArrayOES()
            @gf.vao.bindVertexArrayOES @vao
            @setPointers()
            @gf.vao.bindVertexArrayOES null
        else
            @vao = null

    vertexbuffer: (buffer) ->
        if buffer instanceof BaseBuffer
            @vbo = buffer
            @ownvbo = false
        else
            @vbo = @gf.vertexbuffer buffer
            @ownvbo = true

        @pointers = for location in [0...@gf.maxAttribs]
            null

        #FIXME handle non zero starting pointer layouts (osx does it for non used attributes)
        #does not seem to work
        ###
        location = 0
        for pointer in @vbo.pointers
            @shader.attributeLocation(pointer.name)?
                pointer = util.clone pointer
                pointer.location = location
                @shader.attributeLocation(pointer.name, location)
                @pointers[location] = pointer
                location += 1
        ###
        for pointer in @vbo.getPointers()
            location = @shader.attributeLocation(pointer.name)
            if location?
                pointer = util.clone pointer
                pointer.location = location
                @shader.attributeLocation(pointer.name, location)
                @pointers[location] = pointer

    destroy: ->
        if @ownShader
            @shader.destroy()
        if @ownvbo
            @vbo.destroy()

        if @vao?
            @gf.vao.deleteVertexArrayOES @vao
        
    blendAlpha: =>
        @gl.blendFunc @gl.SRC_ALPHA, @gl.ONE_MINUS_SRC_ALPHA
        @gl.enable @gl.BLEND
    
    blendAdd: =>
        @gl.blendFunc @gl.ONE, @gl.ONE
        @gl.enable @gl.BLEND

    blendMultiply: =>
        @gl.blendFunc @gl.DST_COLOR, @gl.ZERO
        @gl.enable @gl.BLEND

    clearColor: (r=0, g=0, b=0, a=1) ->
        @setSurface()
        @gl.colorMask true, true, true, true
        @gl.clearColor r, g, b, a
        @gl.clear @gl.COLOR_BUFFER_BIT
        return @

    clearDepth: (value=1) ->
        @setSurface()
        @gl.depthMask true
        @gl.clearDepth value
        @gl.clear @gl.DEPTH_BUFFER_BIT
        return @

    setViewport: (width, height) ->
        width ?= @gl.canvas.width
        height ?= @gl.canvas.height

        @gl.viewport 0, 0, width, height

    setPointers: ->
        @vbo.bind()
        for pointer, location in @pointers
            if pointer?
                if not @gf.vertexUnits[location].enabled
                    @gf.vertexUnits[location].enabled = true
                    @gl.enableVertexAttribArray pointer.location

                @gl.vertexAttribPointer(
                    pointer.location,
                    pointer.size,
                    pointer.type,
                    true,
                    pointer.stride,
                    pointer.offset
                )
            else
                if @gf.vertexUnits[location].enabled
                    @gf.vertexUnits[location].enabled = false
                    @gl.disableVertexAttribArray location
        return

    setupVertexBuffer: ->
        if @vao?
            @gf.vao.bindVertexArrayOES @vao
        else
            @setPointers()

    colorMask: (r=true, g=true, b=true, a=true) ->
        @gl.colorMask r, g, b, a
        @colorWrite[0] = r
        @colorWrite[1] = g
        @colorWrite[2] = b
        @colorWrite[3] = a
        return @

    setupState: ->
        @setSurface()

        if @depthTest
            @gl.enable @gl.DEPTH_TEST
            @gl.depthFunc @depthFunc
        else
            @gl.disable @gl.DEPTH_TEST

        @gl.depthMask @depthWrite
        @gl.colorMask @colorWrite[0], @colorWrite[1], @colorWrite[2], @colorWrite[3]

        if @cullFace
            @gl.enable @gl.CULL_FACE
            @gl.cullFace @cullFace
        else
            @gl.disable @gl.CULL_FACE

        if @blend?
            @blend()
        else
            @gl.disable @gl.BLEND

        if @vbo.getMode() is @gl.LINES or @vbo.getMode() is @gl.LINE_STRIP
            if @gf.lineWidth isnt @lineWidth
                @gf.lineWidth = @lineWidth
                @gl.lineWidth @lineWidth
        
        @shader.use()

        @setupVertexBuffer()

        @gf.currentState = @

    viewport: (x,y,width,height) ->
        if @viewportParams?
            @viewportParams.x = x
            @viewportParams.y = y
            @viewportParams.width = width
            @viewportParams.height = height
        else
            @viewportParams = {x:x, y:y, width:width, height:height}
        @gl.viewport(x,y,width,height)
        return @

    setSurface: ->
        if @framebuffer?
            if @viewportParams?
                @gl.viewport(@viewportParams.x, @viewportParams.y, @viewportParams.width, @viewportParams.height)
            else
                @framebuffer.viewport()
            @framebuffer.use()
        else
            @setViewport()
            if @gf.currentFramebuffer?
                @gf.currentFramebuffer.unuse()

    draw: (first, count, mode) ->
        for texture, unit in @textures #FIXME
            texture.texture.bind(unit)
            @int texture.name, unit
        
        if @gf.currentState isnt @
            @setupState()

        @vbo.draw(first, count, mode)

        return @

    mat4: (name, value) ->
        @shader.mat4 name, value
        return @
    
    mat3: (name, value) ->
        @shader.mat3 name, value
        return @

    int: (name, value) ->
        @shader.int name, value
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

    uniformSetter: (obj) ->
        obj.setUniformsOn @
        return @

    float: (name, value) ->
        @shader.float name, value
        return @

    sampler: (name, texture) ->
        stored = @texturesByName[name]
        if not stored?
            stored = name:name, texture:texture
            @texturesByName[name] = stored
            @textures.push stored

        if stored.texture isnt texture
            stored.texture = texture

        return @

    bind: (unit=0) ->
        if @framebuffer?
            @framebuffer.bind unit
        else
            throw new Error('State has no attached framebuffer')

        return @

    generateMipmap: ->
        if @framebuffer?
            @framebuffer.generateMipmap()
        else
            throw new Error('State has no attached framebuffer')

        return @

    anisotropy: ->
        if @framebuffer?
            @framebuffer.anisotropy()
        else
            throw new Error('State has no attached framebuffer')

        return @

    vertices: (data) ->
        @vbo.vertices data
        return @

    cubeSide: (name) ->
        if @framebuffer?
            @framebuffer.cubeSide(name)
        else
            throw new Error('State has no attached framebuffer')
        return @

    sizeEqual: (width, height) ->
        if @framebuffer?
            return @framebuffer.sizeEqual(width, height)
        else
            throw new Error('State has no attached framebuffer')

    setSize: (width, height) ->
        if @framebuffer?
            @framebuffer.setSize width, height
        else
            throw new Error('State has no attached framebuffer')

    width: ->
        if @framebuffer?
            return @framebuffer.width()
        else
            throw new Error('State has no attached framebuffer')
    
    height: ->
        if @framebuffer?
            return @framebuffer.height()
        else
            throw new Error('State has no attached framebuffer')

    blit: ->
        @framebuffer.blit()
    
    readPixels: (x, y, width, height) ->
        if @framebuffer?
            return @framebuffer.readPixels(x, y, width, height)
        else
            throw new Error('State has no attached framebuffer')
