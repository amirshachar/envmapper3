$ ->
    canvas = $('<canvas></canvas>')
        .appendTo('body')[0]
    
    size = 800
    sh = size/2
    canvas.width = size
    canvas.height = size

    ctx = canvas.getContext('2d')

    drawGrid = ->
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(sh,0)
        ctx.lineTo(0,sh)
        ctx.lineTo(sh,size)
        ctx.lineTo(size,sh)
        ctx.lineTo(sh,0)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0,sh+0.5)
        ctx.lineTo(size,sh+0.5)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(sh+0.5,0)
        ctx.lineTo(sh+0.5,size)
        ctx.stroke()

    abs = Math.abs
    sign = (value) ->
        if value < 0 then -1
        else 1

    sqrt = Math.sqrt
    pow = Math.pow
    acos = Math.acos
    cos = Math.cos
    asin = Math.asin
    sin = Math.sin
    atan2 = Math.atan2
    PI = Math.PI
    PIH = PI/2
    TAU = PI*2
    S2 = 1.41421356237309514547

    clamp = (value, low, high) ->
        if value < low
            return low
        else if value > high
            return high
        else
            return value

    linstep = (edge0, edge1, value) ->
        clamp((value-edge0)/(edge1-edge0), 0, 1)

    dot = (s,t,r,g,b) ->
        x = s*size
        y = t*size
        ctx.fillStyle = "rgba(#{(r*255).toFixed(0)},#{(g*255).toFixed(0)},#{(b*255).toFixed(0)},1)"
        ctx.beginPath()
        ctx.arc(x,y,0.5,0,Math.PI*2)
        ctx.fill()

    step = (edge, value) ->
        if value < edge
            return -1
        else
            return 1

    mix = (v0, v1, a) ->
        return v0*(1-a) + v1*a

    mix2 = ([x0,y0], [x1,y1], a) ->
        return [
            mix(x0,x1,a)
            mix(y0,y1,a)
        ]

    mapRect = (x,y,z) ->
        l = abs(x) + abs(y) + abs(z)
        x/=l; y/=l; z/=l
        if y > 0
            return [x,z]
        else
            sx = sign(x); sz = sign(z)
            return [
                sx-sx*abs(z)
                sz-sz*abs(x)
            ]

    normalize = ([x,y,z]) ->
        l = sqrt(x*x + y*y + z*z)
        return [x/l, y/l, z/l]

    unmapRect = (s,t) ->
        s = s*2-1; t = t*2-1
        l = abs(s) + abs(t)

        if l < 1
            x=s; z=t
            y = 1-l
        else
            sx = sign(s)
            sz = sign(t)
            x = sx*abs(t-sz)
            z = sz*abs(s-sx)
            y = abs(x) + abs(z) - 1

        return normalize([x, y, z])

    mapSphere = (x,y,z) ->
        o = acos(abs(z)/sqrt(x*x + z*z))/PIH
        e = acos(abs(y))/PIH

        s = sign(x)*o*e
        t = sign(z)*(1-o)*e

        if y > 0
            return [s,t]
        else
            return [
                sign(x)-abs(t)*sign(x)
                sign(z)-abs(s)*sign(z)
            ]
        
    unmapSphere = (s,t) ->
        s = s*2-1; t = t*2-1
        if abs(s) + abs(t) < 1
            x = s
            z = t
        else
            x = (1-abs(t))*sign(s)
            z = (1-abs(s))*sign(t)
            
        o = (abs(x)/(abs(x)+abs(z)))*PIH
        e = ((abs(s) + abs(t))/2.0)*PI

        x = sin(o)*sign(s)*sin(e)
        y = cos(e)
        z = cos(o)*sign(t)*sin(e)
        return [x,y,z]

    #map = mapRect
    #unmap = unmapRect
    map = mapSphere
    unmap = unmapSphere

    drawMeridians = ->
        for e in [0..180] by 0.25
            e = (e/180)*Math.PI
            y = Math.cos(e)
            for o in [0..360] by 10
                o = (o/360)*Math.PI*2
                x = Math.sin(o)*Math.sin(e)
                z = Math.cos(o)*Math.sin(e)

                [s,t] = map(x,y,z)
                dot(s*0.5+0.5,t*0.5+0.5, x*0.5+0.5, y*0.5+0.5, z*0.5+0.5)
        
        for e in [0..180] by 10
            e = (e/180)*Math.PI
            y = Math.cos(e)
            for o in [0..360] by 0.25
                o = (o/360)*Math.PI*2
                x = Math.sin(o)*Math.sin(e)
                z = Math.cos(o)*Math.sin(e)

                [s,t] = map(x,y,z)
                dot(s*0.5+0.5,t*0.5+0.5, x*0.5+0.5, y*0.5+0.5, z*0.5+0.5)

    drawNormals = ->
        imageData = ctx.getImageData(0,0,size,size)
        data = imageData.data
        for y in [0...size]
            for x in [0...size]
                idx = (x+y*size)*4
                s = (x+0.5)/size
                t = (y+0.5)/size
                [xn,yn,zn] = unmap(s,t)
                data[idx+0] = (xn*0.5+0.5)*255
                data[idx+1] = (yn*0.5+0.5)*255
                data[idx+2] = (zn*0.5+0.5)*255
                #data[idx+0] = xn*255
                #data[idx+1] = yn*255
                #data[idx+2] = zn*255
                data[idx+3] = 255
        ctx.putImageData(imageData, 0,0)

    distance = ([x0,y0,z0], [x1,y1,z1]) ->
        x = x1-x0
        y = y1-y0
        z = z1-z0
        return sqrt(x*x + y*y + z*z)

    gradient = (value) ->
        value = clamp(value, 0, 1)

        return [value,0,1-value]

    drawError = ->
        avg = avgDist()
        imageData = ctx.getImageData(0,0,size,size)
        data = imageData.data
        avgError = 0
        count = 0

        for y in [0...size-1]
            for x in [0...size-1]
                idx = (x+y*size)*4
                s0 = (x+0.5)/size
                t0 = (y+0.5)/size
                s1 = (x+1.5)/size
                t1 = (y+1.5)/size

                n00 = unmap(s0,t0)
                n10 = unmap(s1,t0)
                n01 = unmap(s0,t1)
                n11 = unmap(s1,t1)

                d0 = distance(n00, n10)
                d1 = distance(n00, n01)
                d2 = distance(n01, n11)
                d3 = distance(n10, n11)

                dist = (d0+d1+d2+d3)/4
                error = (dist-avg)*200

                avgError += abs(error)
                if minError?
                    minError = Math.min minError, abs(error)
                    maxError = Math.max maxError, abs(error)
                else
                    minError = abs(error)
                    maxError = abs(error)
                count += 1

                [r,g,b] = gradient(error+0.5)

                data[idx+0] = r*255
                data[idx+1] = g*255
                data[idx+2] = b*255
                data[idx+3] = 255

        console.log avgError/count, minError, maxError
        ctx.putImageData(imageData, 0,0)

    avgDist = ->
        dist = 0
        count = 0
        for y in [0...size-1]
            for x in [0...size-1]
                idx = (x+y*size)*4
                s0 = (x+0.5)/size
                t0 = (y+0.5)/size
                s1 = (x+1.5)/size
                t1 = (y+1.5)/size

                n00 = unmap(s0,t0)
                n10 = unmap(s1,t0)
                n01 = unmap(s0,t1)
                n11 = unmap(s1,t1)

                dist += distance(n00, n10)
                dist += distance(n00, n01)
                dist += distance(n01, n11)
                dist += distance(n10, n11)
                count += 4

        return dist/count

    drawNormals()
    drawMeridians()
    drawError()
    #drawGrid()
