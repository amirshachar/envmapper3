smoothstep = (edge0, edge1, x) ->
    x = (x - edge0)/(edge1-edge0)
    x = Math.min(Math.max(0, x), 1)
    return x*x*x*(x*(x*6 - 15) + 10)

resize = (data, width, height, targetWidth, targetHeight) ->
    startTime = performance.now()

    xRatio = width/targetWidth
    yRatio = height/targetHeight

    kWidth = Math.ceil(xRatio/2)
    kHeight = Math.ceil(yRatio/2)
    kMax = Math.max(kWidth, kHeight)

    result = new Float32Array(targetWidth*targetHeight*4)

    get = (x, y) ->
        x = Math.round(Math.min(Math.max(0, x), width-1))
        y = Math.round(Math.min(Math.max(0, y), height-1))

        return [
            data[(x + y*width)*4+0]
            data[(x + y*width)*4+1]
            data[(x + y*width)*4+2]
            data[(x + y*width)*4+3]
        ]

    put = (x, y, r, g, b, a=1) ->
        result[(x+y*targetWidth)*4+0] = r
        result[(x+y*targetWidth)*4+1] = g
        result[(x+y*targetWidth)*4+2] = b
        result[(x+y*targetWidth)*4+3] = a

    getNearest = (s, t) ->
        s = s*width

    for y in [0...targetHeight]
        for x in [0...targetWidth]
            ar=0; ag=0; ab=0; aw=0
            for kY in [-kHeight..kHeight]
                for kX in [-kWidth..kWidth]
                    l = Math.sqrt(kX*kX + kY*kY)
                    weight = smoothstep(0, kMax, l)

                    [r,g,b,a] = get((x+0.5)*xRatio+kX, (y+0.5)*yRatio+kY)
                    ar += r*weight
                    ag += g*weight
                    ab += b*weight
                    aw += weight

            ar/=aw; ag/=aw; ab/=aw
            put x, y, ar, ag, ab

    console.log performance.now() - startTime
    
    return result

exports.parse = (array) ->
    array = new Uint8Array(array)

    getString = (index, length) ->
        result = ''
        for i in [0...length]
            result += String.fromCharCode(array[index+i])
        return result

    find = (index=0, str) ->
        while getString(index, str.length) isnt str and index < array.length
            index += 1

        if index >= array.length
            return null
        else
            return {
                start: index
                end: index+str.length
            }

    getInt = (index) ->
        start = index
        result = ''
        str = getString(index, 1)
        while str.match /\d/
            result += str
            index += 1
            str = getString(index, 1)

        return {
            start: start
            end: index+1
            result: parseInt(result, 10)
        }

    headerEnd = find(0, '\n\n')
    heightStart = find(headerEnd.end, '-Y ')
    height = getInt(heightStart.end)
    widthStart = find(height.end, '+X ')
    width = getInt(widthStart.end)
    size = {x:width.result, y:height.result}

    rgbe = new Uint8Array(size.x*size.y*4)
    
    idx = width.end
    pop = -> array[idx++]

    startTime = performance.now()

    for y in [0...size.y]
        pop();pop();pop();pop()
        for component in [0...4]
            x = 0
            while x < size.x
                num = pop()
                if num <= 128
                    for i in [0...num]
                        rgbe[(y*size.x+x)*4+component] = pop()
                        x += 1
                else
                    value = pop()
                    num -= 128
                    for i in [0...num]
                        rgbe[(y*size.x+x)*4+component] = value
                        x += 1

    pixelCount = size.x*size.y*4
    rgba = new Float32Array(pixelCount)
    for i in [0...pixelCount] by 4
        r = rgbe[i+0]
        g = rgbe[i+1]
        b = rgbe[i+2]
        e = rgbe[i+3]
        v = Math.pow(2.0, e-128.0)/255.0

        rgba[i+0] = r*v
        rgba[i+1] = g*v
        rgba[i+2] = b*v
        rgba[i+3] = 1

    if size.x <= 4096
        return {
            bytes: rgba
            width: size.x
            height: size.y
        }
    else
        return {
            bytes: resize(rgba, size.x, size.y, 4096, 2048)
            width: 4096
            height: 2048
        }
