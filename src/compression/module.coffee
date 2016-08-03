stream = require 'stream'

saturate = (value) ->
    if value < 0
        return 0
    else if value > 1
        return 1
    else
        return value

minmax = (values) ->
    min = max = values[0]
    if isNaN(min)
        min = max = 0

    for value in values
        if isNaN(value)
            value = 0

        max = Math.max(value, max)
        min = Math.min(value, min)

    return {max:max, min:min}

scale = (data, limit) ->
    {min,max} = minmax(data)
    result = new Float64Array(data.length)
    if limit?
        max = Math.min(max, limit)

    for value, i in data
        if max-min == 0
            result[i] = 0
        else
            result[i] = saturate((value-min)/(max-min))

    return {min:min, max:max, data:result}

unscale = ({min,max,data}) ->
    result = new Float64Array(data.length)
    delta = max - min
    for value, i in data
        result[i] = min + value*delta

    return result

RGBtoXYLUM = (data) ->
    pixels = data.length/3
    L = new Float64Array(pixels)
    X = new Float64Array(pixels)
    Y = new Float64Array(pixels)

    for i in [0...pixels]
        r = data[i*3+0]
        g = data[i*3+1]
        b = data[i*3+2]
    
        x = r*0.2209    + g*0.1138  + b*0.0102
        y = r*0.339     + g*0.678   + b*0.1130
        z = r*0.4184    + g*0.7319  + b*0.2969

        l = x+y+z

        L[i] = l
        X[i] = x/l
        Y[i] = y/l

    return {x: X, y: Y, lum: L}

XYLUMtoRGB = (data) ->
    pixels = data.size*data.size
    result = new Float32Array(pixels*3)

    for i in [0...pixels]
        x = data.x[i]
        y = data.y[i]
        lum = data.lum[i]
        z = 1.0 - x - y
        x *= lum; y*= lum; z*= lum
    
        r = x*6.0013    + y*-1.332  + z*0.3007
        g = x*-2.7      + y*3.1029  + z*-1.088
        b = x*-1.7995   + y*-5.772  + z*5.6268

        result[i*3+0] = r
        result[i*3+1] = g
        result[i*3+2] = b

    return result

compressBlock2 = (values, xoff, yoff, size, blockSize, writer) ->
    valueCount = blockSize*blockSize
    blockValues = new Float64Array(valueCount)
    min = max = values[xoff+yoff*size]
    dstIdx = 0
    for y in [0...blockSize]
        for x in [0...blockSize]
            srcIdx = (xoff+x) + (yoff+y)*size
            value = values[srcIdx]
            min = Math.min(value, min)
            max = Math.max(value, max)
            blockValues[dstIdx] = value
            dstIdx += 1
    
    shortLimit = 256*256-1
    shortMin = Math.round(min*shortLimit)
    shortMax = Math.round(max*shortLimit)
    writer.uint16(shortMin)
    writer.uint16(shortMax)
    min = shortMin/shortLimit
    max = shortMax/shortLimit

    for i in [0...valueCount] by 4
        val0 = blockValues[i+0]
        val1 = blockValues[i+1]
        val2 = blockValues[i+2]
        val3 = blockValues[i+3]

        val0 = Math.round(saturate((val0 - min)/(max-min))*3)
        val1 = Math.round(saturate((val1 - min)/(max-min))*3)
        val2 = Math.round(saturate((val2 - min)/(max-min))*3)
        val3 = Math.round(saturate((val3 - min)/(max-min))*3)

        writer.uint8(
            (val0<<6) |
            (val1<<4) |
            (val2<<2) |
            val3
        )

compressBlock4 = (values, xoff, yoff, size, blockSize, writer) ->
    valueCount = blockSize*blockSize
    blockValues = new Float64Array(valueCount)
    min = max = values[xoff+yoff*size]
    dstIdx = 0
    for y in [0...blockSize]
        for x in [0...blockSize]
            srcIdx = (xoff+x) + (yoff+y)*size
            value = values[srcIdx]
            min = Math.min(value, min)
            max = Math.max(value, max)
            blockValues[dstIdx] = value
            dstIdx += 1
    
    shortLimit = 256*256-1
    shortMin = Math.round(min*shortLimit)
    shortMax = Math.round(max*shortLimit)
    writer.uint16(shortMin)
    writer.uint16(shortMax)
    min = shortMin/shortLimit
    max = shortMax/shortLimit

    for i in [0...valueCount] by 2
        val0 = blockValues[i+0]
        val1 = blockValues[i+1]

        val0 = Math.round(saturate((val0 - min)/(max-min))*15)
        val1 = Math.round(saturate((val1 - min)/(max-min))*15)

        writer.uint8((val0<<4) | val1)

compress = ({data, size, blockSize, bits}) ->
    bpp = bits/8
    bufferSize = (size/blockSize)*(size/blockSize)*(4+blockSize*blockSize*bpp)
    writer = new stream.Writer(bufferSize)

    if bits == 4
        compressBlock = compressBlock4
    else if bits == 2
        compressBlock = compressBlock2

    for y in [0...size] by blockSize
        for x in [0...size] by blockSize
            compressBlock(data, x, y, size, blockSize, writer)

    return {
        data: writer.getBuffer()
        blockSize: blockSize
        bits: bits
        size: size
    }

decompressBlock2 = (result, xoff, yoff, size, blockSize, reader) ->
    srcIdx = 0
    shortLimit = 256*256-1
    min = reader.uint16()/shortLimit
    max = reader.uint16()/shortLimit

    for y in [0...blockSize]
        for x in [0...blockSize] by 4
            byte = reader.uint8()

            val0 = (byte >> 6) & 3
            val1 = (byte >> 4) & 3
            val2 = (byte >> 2) & 3
            val3 = byte & 3

            result[(xoff+x+0)+(yoff+y)*size] = min + (val0/3)*(max-min)
            result[(xoff+x+1)+(yoff+y)*size] = min + (val1/3)*(max-min)
            result[(xoff+x+2)+(yoff+y)*size] = min + (val2/3)*(max-min)
            result[(xoff+x+3)+(yoff+y)*size] = min + (val3/3)*(max-min)

    return

decompressBlock4 = (result, xoff, yoff, size, blockSize, reader) ->
    srcIdx = 0
    shortLimit = 256*256-1
    min = reader.uint16()/shortLimit
    max = reader.uint16()/shortLimit

    for y in [0...blockSize]
        for x in [0...blockSize] by 2
            byte = reader.uint8()
            val0 = (byte >> 4) & 15
            val1 = byte & 15

            result[(xoff+x+0)+(yoff+y)*size] = min + (val0/15)*(max-min)
            result[(xoff+x+1)+(yoff+y)*size] = min + (val1/15)*(max-min)

    return

decompress = ({data, size, blockSize, bits}) ->
    result = new Float64Array(size*size)
    reader = new stream.Reader(data)

    if bits == 4
        decompressBlock = decompressBlock4
    else if bits == 2
        decompressBlock = decompressBlock2

    for y in [0...size] by blockSize
        for x in [0...size] by blockSize
            decompressBlock(result, x, y, size, blockSize, reader)

    return result

exports =
    compress: ({data, size, quality}) ->
        quality ?=
            x: {bits:2, blockSize:8}
            y: {bits:2, blockSize:8}
            lum: {bits:4, blockSize:4}
            
        data = RGBtoXYLUM(data)
        data.size = size
        data.lum = scale(data.lum, 192)
        data.x = scale(data.x)
        data.y = scale(data.y)

        data.x.data = compress
            data: data.x.data
            size: size
            blockSize: quality.x.blockSize
            bits: quality.x.bits
        
        data.y.data = compress
            data: data.y.data
            size: size
            blockSize: quality.y.blockSize
            bits: quality.y.bits

        data.lum.data = compress
            data: data.lum.data
            size: size
            blockSize: quality.lum.blockSize
            bits: quality.lum.bits

        return data

    decompress: (data) ->
        x = decompress(data.x.data)
        y = decompress(data.y.data)
        lum = decompress(data.lum.data)
        x = unscale(min:data.x.min, max:data.x.max, data:x)
        y = unscale(min:data.y.min, max:data.y.max, data:y)
        lum = unscale(min:data.lum.min, max:data.lum.max, data:lum)
        return XYLUMtoRGB(x:x, y:y, lum:lum, size:data.size)
