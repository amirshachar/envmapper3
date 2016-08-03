util = require 'util'

exports.BaseBuffer = class BaseBuffer
    destroy: -> throw new Error('base method')
    bind: -> throw new Error('base method')
    getMode: -> throw new Error('base method')
    draw: (first, count, mode) -> throw new Error('base method')
    getPointers: -> throw new Error('base method')

exports.VertexBuffer = class VertexBuffer extends BaseBuffer
    constructor: (@gf, {pointers, vertices, mode, size, @interleaved}={}) ->
        @interleaved ?= true

        @gl = @gf.gl
        @buffer = @gl.createBuffer()
        
        if mode?
            @mode = @gl[mode.toUpperCase()]
        else
            @mode = @gl.TRIANGLES

        if pointers?
            @pointers pointers

        if vertices?
            @vertices vertices
        else if size?
            @size size

    getMode: -> @mode
    getPointers: -> @pointers

    destroy: ->
        @gl.deleteBuffer @buffer
        return @

    update: (params) ->
        if params.pointers?
            @pointers params.pointers
        if params.vertices?
            @vertices params.vertices
        return @

    pointers: (data) ->
        offset = 0
        @pointers = for pointer in data
            pointer = util.clone pointer
            pointer.size ?= 4
            pointer.type ?= 'float'

            switch pointer.type
                when 'float'
                    pointer.type = @gl.FLOAT
                    pointer.typeSize = 4
                when 'byte'
                    pointer.type = @gl.BYTE
                    pointer.typeSize = 1
                when 'short'
                    pointer.type = @gl.SHORT
                    pointer.typeSize = 2
                when 'ubyte'
                    pointer.type = @gl.UNSIGNED_BYTE
                    pointer.typeSize = 1
                when 'ushort'
                    pointer.type = @gl.UNSIGNED_SHORT
                    pointer.typeSize = 2
                else
                    throw new Error('unknown pointer type: ' + pointer.type)

            pointer.byteSize = pointer.typeSize * pointer.size
            pointer.offset ?= offset
            offset += pointer.byteSize
            pointer

        if @interleaved
            for pointer in @pointers
                pointer.stride ?= offset
            @stride = offset
        else
            @stride = null

        return @

    vertices: (data) ->
        if data instanceof Array
            data = new Float32Array data

        if @interleaved
            @count = data.byteLength/@stride
            @gl.bindBuffer @gl.ARRAY_BUFFER, @buffer
            @gl.bufferData @gl.ARRAY_BUFFER, data, @gl.STATIC_DRAW
            @gl.bindBuffer @gl.ARRAY_BUFFER, null
        else
            @count = data.count
            @gl.bindBuffer @gl.ARRAY_BUFFER, @buffer
            @gl.bufferData @gl.ARRAY_BUFFER, data.data, @gl.STATIC_DRAW
            @gl.bindBuffer @gl.ARRAY_BUFFER, null

        return @

    size: (size) ->
        @count = size/@stride
        @gl.bindBuffer @gl.ARRAY_BUFFER, @buffer
        @gl.bufferData @gl.ARRAY_BUFFER, size, @gl.STATIC_DRAW
        @gl.bindBuffer @gl.ARRAY_BUFFER, null

    subData: (offset, data) ->
        @gl.bindBuffer @gl.ARRAY_BUFFER, @buffer
        @gl.bufferSubData @gl.ARRAY_BUFFER, offset, data
        @gl.bindBuffer @gl.ARRAY_BUFFER, null
    
    bind: ->
        # does not seem to work correctly
        #if @gf.currentVertexbuffer isnt @
        #    @gf.currentVertexbuffer = @
        #    @gl.bindBuffer @gl.ARRAY_BUFFER, @buffer
        @gl.bindBuffer @gl.ARRAY_BUFFER, @buffer
        return @

    unbind: ->
        #if @gf.currentVertexbuffer?
        @gf.currentVertexbuffer = null
        @gl.bindBuffer @gl.ARRAY_BUFFER, null
    
    draw: (first, count, mode) ->
        first ?= 0
        count ?= @count
        mode ?= @mode
        @gl.drawArrays mode, first, count
        return @
