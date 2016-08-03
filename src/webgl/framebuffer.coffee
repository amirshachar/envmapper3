texture = require 'texture'

exports.Framebuffer = class Framebuffer
    constructor: (@gf, params={}) ->
        @gl = @gf.gl
        @buffer = @gl.createFramebuffer()

    generateMipmap: ->
        @colorTexture.generateMipmap()

    anisotropy: ->
        @colorTexture.anisotropy()
    
    bind: (unit=0) ->
        @colorTexture.bind unit
    
    check: ->
        result = @gl.checkFramebufferStatus @gl.FRAMEBUFFER
        switch result
            when @gl.FRAMEBUFFER_UNSUPPORTED
                throw 'Framebuffer is unsupported'
            when @gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
                throw 'Framebuffer incomplete attachment'
            when @gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS
                throw 'Framebuffer incomplete dimensions'
            when @gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT
                throw 'Framebuffer incomplete missing attachment'
        return @
    
    unuse: ->
        if @gf.currentFramebuffer?
            @gf.currentFramebuffer = null
            @gl.bindFramebuffer @gl.FRAMEBUFFER, null
        return @
    
exports.Framebuffer2D = class Framebuffer extends exports.Framebuffer
    constructor: (@gf, params={}) ->
        super(@gf, params)
        if params.color?
            if params.color instanceof texture.Texture
                @color params.color
                @ownColor = false
            else
                @color @gf.texture2D params.color
                @ownColor = true
        else
            @ownColor = false

        if params.depth?
            @depth params.depth

    color: (@colorTexture) ->
        @use()
        @gl.framebufferTexture2D @gl.FRAMEBUFFER, @gl.COLOR_ATTACHMENT0, @colorTexture.target, @colorTexture.handle, 0
        @check()
        @unuse()
        return @

    depth: (param) ->
        if param instanceof exports.Depthbuffer
            @depthbuffer = param
        else
            @depthbuffer = new exports.Depthbuffer(@gf)

        if @colorTexture?
            @depthbuffer.setSize @colorTexture.width, @colorTexture.height
        else
            throw Error('unimplemented')
        
        @use()
        @gl.framebufferRenderbuffer @gl.FRAMEBUFFER, @gl.DEPTH_ATTACHMENT, @gl.RENDERBUFFER, @depthbuffer.id
        @check()

        return @
    
    use: ->
        if @gf.currentFramebuffer isnt @
            @gf.currentFramebuffer = @
            @gl.bindFramebuffer @gl.FRAMEBUFFER, @buffer
        return @

    viewport: (width, height) ->
        width ?= @colorTexture.width
        height ?= @colorTexture.height
        @gl.viewport 0, 0, width, height
    
    destroy: ->
        @gl.deleteFramebuffer @buffer
        if @ownColor
            @color.destroy()

        if @depthbuffer?
            @depthbuffer.destroy()

        return @

    setSize: (width, height) ->
        if @colorTexture?
            @colorTexture.size(width, height)
        if @depthbuffer?
            @depthbuffer.setSize(width, height)

    width: ->
        if @colorTexture?
            return @colorTexture.width
        else if @depthbuffer
            return @depthbuffer.width
        else
            throw Error('unimplemented')
    
    height: ->
        if @colorTexture?
            return @colorTexture.height
        else if @depthbuffer
            return @depthbuffer.height
        else
            throw Error('unimplemented')

    blit: ->
        if @colorTexture?
            @colorTexture.draw()
        else
            throw Error('unimplemented')
    
    readPixels: (x, y, width, height) ->
        x ?= 0
        y ?= 0
        width ?= @colorTexture.width
        height ?= @colorTexture.height
        type = @colorTexture.type
        if type == @gl.UNSIGNED_BYTE
            result = new Uint8Array(width*height*4)
        else if type = @gl.FLOAT
            result = new Float32Array(width*height*4)
        else
            throw new Error('unsupported read type: ' + type)

        @use()
        @gl.readPixels x, y, width, height, @gl.RGBA, type, result
        return result
    
    sizeEqual: (width, height) ->
        if width != @width()
            return false
        if height != @height()
            return false
        return true

exports.FramebufferCube = class FramebufferCube extends exports.Framebuffer
    constructor: (@gf, params) ->
        super(@gf, params)

        @negativeX = new exports.Framebuffer2D(@gf)
        @negativeY = new exports.Framebuffer2D(@gf)
        @negativeZ = new exports.Framebuffer2D(@gf)
        @positiveX = new exports.Framebuffer2D(@gf)
        @positiveY = new exports.Framebuffer2D(@gf)
        @positiveZ = new exports.Framebuffer2D(@gf)

        @currentSide = @negativeX
        
        color = params.color
        if color?
            if params.color instanceof texture.Texture
                @color params.color
            else
                @color @gf.textureCube params.color

    color: (@colorTexture) ->
        @negativeX.color(@colorTexture.negativeX)
        @negativeY.color(@colorTexture.negativeY)
        @negativeZ.color(@colorTexture.negativeZ)
        @positiveX.color(@colorTexture.positiveX)
        @positiveY.color(@colorTexture.positiveY)
        @positiveZ.color(@colorTexture.positiveZ)

    destroy: ->
        @negativeX.destroy()
        @negativeY.destroy()
        @negativeZ.destroy()
        @positiveX.destroy()
        @positiveY.destroy()
        @positiveZ.destroy()

    cubeSide: (name) ->
        @currentSide = @[name]

    use: ->
        @currentSide.use()
    
    viewport: (width, height) ->
        width ?= @colorTexture.size
        height ?= @colorTexture.size
        @gl.viewport 0, 0, width, height
            
exports.Renderbuffer = class Renderbuffer
    constructor: (@gf) ->
        @gl = @gf.gl
        @id = @gl.createRenderbuffer()

    bind: ->
        @gl.bindRenderbuffer @gl.RENDERBUFFER, @id
        return @

    setSize: (@width, @height) ->
        @bind()
        @gl.renderbufferStorage @gl.RENDERBUFFER, @gl[@format], @width, @height
        @unbind()

    unbind: ->
        @gl.bindRenderbuffer @gl.RENDERBUFFER, null
        return @

    destroy: ->
        @gl.deleteRenderbuffer @id

exports.Depthbuffer = class Depthbuffer extends Renderbuffer
    format: 'DEPTH_COMPONENT16'
