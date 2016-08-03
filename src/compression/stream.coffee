exports.Writer = class Writer
    constructor: (initialSize=1024) ->
        @buffer = new ArrayBuffer(initialSize)
        @view = new DataView(@buffer)
        @offset = 0

    checkSize: (bytesToWrite) ->
        remaining = @buffer.byteLength - @offset
        if remaining < bytesToWrite
            @enlarge(bytesToWrite-remaining)

    enlarge: (minimum) ->
        newSize = Math.max @buffer.byteLength*2, @buffer.byteLength+minimum*2

        newBuffer = new ArrayBuffer(newSize)

        src = new Uint8Array(@buffer)
        dst = new Uint8Array(newBuffer)
        dst.set(src)

        @buffer = newBuffer
        @view = new DataView(@buffer)

    uint8: (value) ->
        @checkSize 1
        @view.setUint8(@offset, value, true)
        @offset += 1

    int8: (value) ->
        @checkSize 1
        @view.setInt8(@offset, value, true)
        @offset += 1

    uint16: (value) ->
        @checkSize 2
        @view.setInt16(@offset, value, true)
        @offset += 2

    int16: (value) ->
        @checkSize 2
        @view.setUint16(@offset, value, true)
        @offset += 2

    uint32: (value) ->
        @checkSize 4
        @view.setUint32(@offset, value, true)
        @offset += 4

    int32: (value) ->
        @checkSize 4
        @view.setInt32(@offset, value, true)
        @offset += 4

    float32: (value) ->
        @checkSize 4
        @view.setFloat32(@offset, value, true)
        @offset += 4

    float64: (value) ->
        @checkSize 8
        @view.setFloat64(@offset, value, true)
        @offset += 8

    getBuffer: ->
        return @buffer.slice(0, @offset)

exports.Reader = class Reader
    constructor: (@buffer) ->
        @view = new DataView(buffer)
        @offset = 0
    
    uint8: ->
        value = @view.getUint8(@offset, true)
        @offset += 1
        return value
    
    uint8array: (length) ->
        value = new Uint8Array(@buffer, @offset, length)
        @offset += length
        return value

    int8: ->
        value = @view.getInt8(@offset, true)
        @offset += 1
        return value
    
    int8array: (length) ->
        value = new Int8Array(@buffer, @offset, length)
        @offset += length
        return value

    uint16: ->
        value = @view.getUint16(@offset, true)
        @offset += 2
        return value
    
    uint16array: (length) ->
        padding = @offset % 2
        @offset += padding
        value = new Uint16Array(@buffer, @offset, length)
        @offset += length*2
        return value
    
    int16: ->
        value = @view.getInt16(@offset, true)
        @offset += 2
        return value
    
    int16array: (length) ->
        padding = @offset % 2
        @offset += padding
        value = new Int16Array(@buffer, @offset, length)
        @offset += length*2
        return value
    
    uint32: ->
        value = @view.getUint32(@offset, true)
        @offset += 4
        return value
    
    uint32array: (length) ->
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Uint32Array(@buffer, @offset, length)
        @offset += length*4
        return value

    int32: ->
        value = @view.getInt32(@offset, true)
        @offset += 4
        return value

    int32array: (length) ->
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Int32Array(@buffer, @offset, length)
        @offset += length*4
        return value
    
    float32: ->
        value = @view.getFloat32(@offset, true)
        @offset += 4
        return value

    float32array: (length) ->
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Float32Array(@buffer, @offset, length)
        @offset += length*4
        return value
    
    float64: ->
        value = @view.getFloat64(@offset, true)
        @offset += 8
        return value
    
    float64array: (length) ->
        padding = (8 - (@offset % 8))%8
        @offset += padding
        value = new Float64Array(@buffer, @offset, length)
        @offset += length*8
        return value

    arraybuffer: (length) ->
        result = @buffer.slice(@offset, @offset+length)
        @offset += length
        return result
