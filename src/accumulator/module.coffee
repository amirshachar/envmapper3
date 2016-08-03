lambertExponent = (angle) ->
    angle = angle/180

    cutoff = 0.02
    cutoffAngle = Math.acos(cutoff)
    modifiedAngle = angle*cutoffAngle

    cos = Math.cos modifiedAngle
    #cos = Math.cos angle
    exp = Math.log(cutoff)/Math.log(cos)
    return exp

normalize = (data, exposure) ->
    pixels = data.length/4
    result = new Float64Array(pixels*3)
    for i in [0...pixels]
        r = data[i*4+0]*exposure
        g = data[i*4+1]*exposure
        b = data[i*4+2]*exposure
        a = data[i*4+3]

        result[i*3+0] = r/a
        result[i*3+1] = g/a
        result[i*3+2] = b/a

    return result

class Accumulator
    constructor: (@app, @size, updateShader, copyShader) ->
        @levels = []

        @levels.push @app.fw.state(
            framebuffer:
                color:
                    width: @size
                    height: @size
                    filter: 'linear'
                    clamp: 'edge'
                    type: @app.fw.usableFloat
            shader: updateShader
            blend: 'add'
        )

        max = Math.log2(@size)-1
        for i in [max..0]
            size = Math.pow(2, i)
            @levels.push @app.fw.state(
                framebuffer:
                    color:
                        width: size
                        height: size
                        filter: 'linear'
                        clamp: 'edge'
                        type: @app.fw.usableFloat
                shader: copyShader
            )

        @app.on 'environment-update', =>
            @clear()

    bind: (unit=0) ->
        @levels[0].bind(unit)

    update: (angle) ->
        exponent = lambertExponent(angle)
        @levels[0]
            .float('angle', angle)
            .float('lambertExponent', exponent)
            .uniformSetter(@app.environment)
            .vec2('size', @size, @size)
            .draw()

        for i in [1...@levels.length]
            @levels[i]
                .sampler('source', @levels[i-1])
                .draw()
        
        @generateMips()

    generateMips: ->
        null

    clear: ->
        @levels[0].clearColor(0,0,0,0)
        @generateMips()

exports = class Accumulators
    constructor: (@app) ->
        @updateShader = @app.fw.shader [
            fs.open('/octahedral.shader')
            @app.environment.lookup
            fs.open('update.shader')
        ]

        @copyShader = @app.fw.shader(fs.open('copy.shader'))
        @accumulators = []

        for size in [128,128,128,128,256,512,1024]
            @accumulators.push new Accumulator(@app, size, @updateShader, @copyShader)
        
        @specular = @app.fw.state
            framebuffer:
                color:
                    #width: 1026
                    width: 3000
                    height: 1292+1026
                    filter: 'linear'
                    clamp: 'edge'
                    type: @app.fw.usableFloat
            shader: fs.open('padd.shader')

    update: ->
        @updateShader.vec2('samples', @app.samples.data())

        minAngle = 360/512
        basis = Math.pow(180/minAngle, 1.0/(@accumulators.length-1))
        for accumulator, i in @accumulators
            angle = 180/Math.pow(basis, i)
            accumulator.update(angle)

        for accumulator, i in @accumulators
            #offset = Math.pow(2, i+4)-16 + 2*i
            #size = Math.pow(2, i+4)
            
            size = Math.max(128, Math.pow(2, i+4))

            offset0 = 130*Math.min(i, 4)
            i2 = Math.max(i-4, 0)
            offset1 = Math.pow(2, (i2+8)) - 256 + 2*i2
            vOffset = offset0 + offset1

            for level, j in accumulator.levels
                size = Math.max(128, Math.pow(2, i+4))
                size /= Math.pow(2, j)

                j0 = accumulator.levels.length - j - 1

                hOffset = Math.pow(2, j0)-1 + 2*j0

                @specular
                    .viewport(hOffset, vOffset, size+2, size+2)
                    .float('size', size+2)
                    .sampler('source', level)
                    .draw()

    bind: (unit=0) ->
        @specular.bind(unit)

    get: (idx) -> @accumulators[idx]

    blit: ->
        @specular.blit()

    save: (exposure) ->
        result = []
        for slice in @accumulators
            texture = slice.levels[0]
            result.push
                size:texture.width()
                data:normalize(texture.readPixels(), exposure)
        return result

    getAvg: ->
        result = []
        for slice in @accumulators
            [r,g,b,a] = slice.levels[slice.levels.length-1].readPixels()
            result.push([r/a,g/a,b/a])
        return result
