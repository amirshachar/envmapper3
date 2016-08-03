rnd = ->
    ROT.RNG.getUniform()

halton = (i, base) ->
    result = 0
    f = 1/base
    while i>0
        result = result + f * (i%base)
        i = Math.floor i/base
        f = f/base
    return result

class Halton2D
    constructor: (@baseX=2, @baseY=3, @i = 100) ->
        @initial = @i

    get: (index) ->
        i = index ? @i
        x = halton(i, @baseX)
        y = halton(i, @baseY)
        if not index?
            @i += 1
        return [x,y]

    index: -> @i

    reset: ->
        @i = @initial

exports = class Samples
    constructor: (@app) ->
        num = 50
        @samples = new Float32Array(num*2)
        @hIndex = 0
        @app.on 'environment-update', =>
            @hIndex = 0

    randomVec: (idx) ->
        @samples[idx+0] = rnd()
        @samples[idx+1] = rnd()

    haltonVec: (idx) ->
        @samples[idx+0] = halton(@hIndex, 2)
        @samples[idx+1] = halton(@hIndex, 3)
        @hIndex += 1
        
    generate: ->
        for i in [0...@samples.length] by 2
            @randomVec(i)
            #@haltonVec(i)

    data: -> @samples
