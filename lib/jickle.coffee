window.JICKLE = {}

typecode =
    string          : 0
    object          : 1
    list            : 2

    int8            : 3
    int8array       : 4

    int16           : 5
    int16array      : 6

    int32           : 7
    int32array      : 8

    int64           : 9
    int64array      : 10

    float16         : 11
    float16array    : 12

    float32         : 13
    float32array    : 14

    float64         : 15
    float64array    : 16

    uint8           : 17
    uint8array      : 18

    uint16          : 19
    uint16array     : 20

    uint32          : 21
    uint32array     : 22

    uint64          : 23
    uint64array     : 24

    null            : 25
    bool            : 26

    arraybuffer     : 27
    image           : 28

code2type = {}
for type,code of typecode
    code2type[code] = type

class Reader
    constructor: (@buffer, @onload) ->
        @view = new DataView(buffer)
        @offset = 0
        @loading = 0
        @loaded = 0
    
    string: ->
        length = @uint32()
        result = ''
        for i in [0...length]
            result += String.fromCharCode(@uint8())
        return decodeURIComponent(escape(result))

    object: ->
        count = @uint32()
        result = {}
        for _ in [0...count]
            key = @string()
            value = @decode()
            result[key] = value
        return result

    list: ->
        count = @uint32()
        for i in [0...count]
            @decode()

    uint8: ->
        value = @view.getUint8(@offset, true)
        @offset += 1
        return value
    
    uint8array: ->
        length = @uint32()
        value = new Uint8Array(@buffer, @offset, length)
        @offset += length
        return value

    int8: ->
        value = @view.getInt8(@offset, true)
        @offset += 1
        return value
    
    int8array: ->
        length = @uint32()
        value = new Int8Array(@buffer, @offset, length)
        @offset += length
        return value

    uint16: ->
        value = @view.getUint16(@offset, true)
        @offset += 2
        return value
    
    uint16array: ->
        length = @uint32()
        padding = @offset % 2
        @offset += padding
        value = new Uint16Array(@buffer, @offset, length)
        @offset += length*2
        return value
    
    int16: ->
        value = @view.getInt16(@offset, true)
        @offset += 2
        return value
    
    int16array: ->
        length = @uint32()
        padding = @offset % 2
        @offset += padding
        value = new Int16Array(@buffer, @offset, length)
        @offset += length*2
        return value
    
    uint32: ->
        value = @view.getUint32(@offset, true)
        @offset += 4
        return value
    
    uint32array: ->
        length = @uint32()
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Uint32Array(@buffer, @offset, length)
        @offset += length*4
        return value

    int32: ->
        value = @view.getInt32(@offset, true)
        @offset += 4
        return value

    int32array: ->
        length = @uint32()
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Int32Array(@buffer, @offset, length)
        @offset += length*4
        return value
    
    uint64: ->
        value = @view.getUint64(@offset, true)
        @offset += 8
        return value
    
    uint64array: ->
        length = @uint32()
        padding = (8 - (@offset % 8))%8
        @offset += padding
        value = new Uint64Array(@buffer, @offset, length)
        @offset += length*8
        return value
    
    int64: ->
        value = @view.getInt64(@offset, true)
        @offset += 8
        return value
    
    int64array: ->
        length = @uint32()
        padding = (8 - (@offset % 8))%8
        @offset += padding
        value = new Int64Array(@buffer, @offset, length)
        @offset += length*8
        return value
    
    float32: ->
        value = @view.getFloat32(@offset, true)
        @offset += 4
        return value

    float32array: ->
        length = @uint32()
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Float32Array(@buffer, @offset, length)
        @offset += length*4
        return value
    
    float64: ->
        value = @view.getFloat64(@offset, true)
        @offset += 8
        return value
    
    float64array: ->
        length = @uint32()
        padding = (8 - (@offset % 8))%8
        @offset += padding
        value = new Float64Array(@buffer, @offset, length)
        @offset += length*8
        return value

    arraybuffer: ->
        length = @uint32()
        result = @buffer.slice(@offset, @offset+length)
        @offset += length
        return result

    image: ->
        @loading += 1

        type = @string()
        bytes = @arraybuffer()

        blob = new Blob([bytes], type:type)
        url = URL.createObjectURL(blob)
        img = new Image()
        img.type = type
        img.bytes = bytes
        img.url = url
        img.onload = =>
            @loaded += 1

            if @loading == @loaded
                @onload()

        img.src = url
        return img

    bool: ->
        value = @view.getUint8(@offset, true)
        @offset += 1
        return value == 1

    decode: (toplevel) ->
        type = @uint8()
        #console.log code2type[type]

        value = switch type
            when typecode.string then @string()
            when typecode.object then @object()
            when typecode.list then @list()

            when typecode.int8 then @int8()
            when typecode.int8array then @int8array()
            when typecode.uint8 then @uint8()
            when typecode.uint8array then @uint8array()

            when typecode.int16 then @int16()
            when typecode.int16array then @int16array()
            when typecode.uint16 then @int16()
            when typecode.uint16array then @uint16array()
            
            when typecode.int32 then @int32()
            when typecode.int32array then @int32array()
            when typecode.uint32 then @int32()
            when typecode.uint32array then @int32array()
            
            when typecode.int64 then @int64()
            when typecode.int64array then @int64array()
            when typecode.uint64 then @int64()
            when typecode.uint64array then @int64array()
            
            when typecode.float32 then @float32()
            when typecode.float32array then @float32array()
            
            when typecode.float64 then @float64()
            when typecode.float64array then @float64array()

            when typecode.null then null
            when typecode.bool then @bool()
            when typecode.arraybuffer then @arraybuffer()
            when typecode.image then @image()

            else
                throw 'unknown type: ' + type
        return value

class Writer
    constructor: ->
        @buffer = new ArrayBuffer(2)
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

    ubyte: (value) ->
        @checkSize 1
        @view.setUint8(@offset, value, true)
        @offset += 1

    byte: (value) ->
        @checkSize 1
        @view.setInt8(@offset, value, true)
        @offset += 1

    ushort: (value) ->
        @checkSize 2
        @view.setInt16(@offset, value, true)
        @offset += 2

    short: (value) ->
        @checkSize 2
        @view.setUint16(@offset, value, true)
        @offset += 2

    uint: (value) ->
        @checkSize 4
        @view.setUint32(@offset, value, true)
        @offset += 4

    int: (value) ->
        @checkSize 4
        @view.setInt32(@offset, value, true)
        @offset += 4

    float: (value) ->
        @checkSize 4
        @view.setFloat32(@offset, value, true)
        @offset += 4

    double: (value) ->
        @checkSize 8
        @view.setFloat64(@offset, value, true)
        @offset += 8

    string: (value) ->
        #value = unescape(encodeURIComponent(s))
        length = value.length
        @checkSize length
        for i in [0...length]
            @view.setUint8(@offset + i, value.charCodeAt(i))
        @offset += length

    image: (img) ->
        @type typecode.image
        mime = @stringToUTF8(img.type)
        @len mime.length
        @string mime

        bytes = img.bytes
        @len bytes.byteLength
        @checkSize bytes.byteLength
        src = new Uint8Array(bytes)
        dst = new Uint8Array(@buffer, @offset, bytes.byteLength)
        dst.set(src)
        @offset += bytes.byteLength

    stringToUTF8: (value) -> unescape(encodeURIComponent(value))

    type: (code) ->
        @ubyte code

    len: (len) ->
        @uint len

    typelen: (type, len) ->
        @type type
        @len len

    typedArray: (value) ->
        bpe = value.BYTES_PER_ELEMENT

        if value instanceof Int8Array then type = typecode.int8array
        else if value instanceof Int16Array then type = typecode.int16array
        else if value instanceof Int32Array then type = typecode.int32array
        #else if value instanceof Int64Array then type = typecode.int64array
        #else if value instanceof Float16Array then type = typecode.float16array
        else if value instanceof Float32Array then type = typecode.float32array
        else if value instanceof Float64Array then type = typecode.float64array
        else if value instanceof Uint8Array then type = typecode.uint8array
        else if value instanceof Uint16Array then type = typecode.uint16array
        else if value instanceof Uint32Array then type = typecode.uint32array
        else if value instanceof Uint64Array then type = typecode.uint64array

        @typelen type, value.length
        padding = (bpe - (@offset%bpe))%bpe
        @checkSize value.byteLength+padding
        dst = new value.constructor(@buffer, @offset+padding, value.length)
        dst.set(value)
        @offset += value.byteLength+padding
   
    arraybuffer: (value) ->
        @typelen typecode.arraybuffer, value.byteLength
        @checkSize value.byteLength
        src = new Uint8Array(value)
        dst = new Uint8Array(@buffer, @offset, value.byteLength)
        dst.set(src)
        @offset += value.byteLength

    encode: (value) ->
        type = typeof value

        if value instanceof ArrayBuffer
            @arraybuffer value
        else if ArrayBuffer.isView(value)
            @typedArray value
        else
            if value instanceof Array
                @typelen typecode.list, value.length
                for item in value
                    @encode item
            else if value instanceof Image
                @image value
            else if value is null
                @type typecode.null
            else if value is undefined
                @type typecode.null
            else if type == 'string'
                value = @stringToUTF8(value)
                @typelen typecode.string, value.length
                @string value
            else if type == 'number'
                @type typecode.float64
                @double value
            else if type == 'boolean'
                @type typecode.bool
                if value
                    @ubyte 1
                else
                    @ubyte 0
            else if type == 'object'
                size = 0
                for k, v of value
                    size += 1
                @typelen typecode.object, size
                
                for k, v of value
                    k = @stringToUTF8(k)
                    @len k.length
                    @string k
                    @encode v
            else
                throw 'unknown type: ' + type

        return @buffer.slice(0, @offset)

JICKLE.encode = (value) ->
    writer = new Writer()
    return writer.encode(value)

JICKLE.decode = (buffer, onload) ->
    reader = new Reader buffer, ->
        onload(result)
    result = reader.decode()
    if reader.loading == reader.loaded
        onload(result)
    return result

JICKLE.get = (url, callback) ->
    xhr = new XMLHttpRequest()
    xhr.open 'GET', url, true
    xhr.responseType = 'arraybuffer'
    xhr.onload = ->
        JICKLE.decode(xhr.response, callback)
    xhr.send()
