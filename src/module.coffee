WebGL = require 'webgl'
Environment = require 'environment'
Accumulators = require 'accumulator'
Events = require 'events'
Camera = require 'camera'
Samples = require 'samples'
Chart = require 'chart'
compression = require 'compression'

sphere = require 'sphere'
getBuffer = require 'get-buffer'
fileSystem = require '/file-system'

class Application
    constructor: ->
        @fw = new WebGL()
        $(@fw.canvas).appendTo('body')
        @hub = new Events()

        @camera = new Camera(@)
        @samples = new Samples(@)
        @environment = new Environment(@)
        @accumulators = new Accumulators(@)
        @chart = new Chart()

        @params = {}

        $('<button>Open HDR</button>')
            .css
                position: 'absolute'
                top: 10
                left: 10
            .appendTo('body')
            .click =>
                @environment.openHDR()
        
        $('<button>Save</button>')
            .css
                position: 'absolute'
                top: 30
                left: 10
            .appendTo('body')
            .click =>
                @save()

        @addSlider('diffuseReflectance', 50+0*20)
        @addSlider('specularReflectance', 50+1*20)
        @addSlider('specularMix', 50+2*20)
        @addSlider('emissivity', 50+3*20)

        @addSlider('roughness1', 50+5*20)
        @addSlider('fresnel1', 50+6*20)
        @addSlider('metallness1', 50+7*20)
        
        @addSlider('roughness2', 50+9*20)
        @addSlider('fresnel2', 50+10*20)
        @addSlider('metallness2', 50+11*20)
        
        @addSlider('exposure', 50+13*20, -1, 1)
        
        getBuffer 'model.bin', (data) =>
            @display = @fw.state
                shader: [
                    fs.open('octahedral.shader')
                    fs.open('display.shader')
                ]
                vertexbuffer:
                    pointers: [
                        {name:'position', size:3}
                        {name:'texcoord', size:2}
                        {name:'normal', size:3}
                    ]
                    vertices: data
                depthTest: true

        @baseColor = @fw.texture2D(filter:'linear',width:1,height:1)
            .loadImage('images/base-color.png', true)
        
        @ao = @fw.texture2D(filter:'linear',width:1,height:1)
            .loadImage('images/ao.png', true)
        
        @cavity = @fw.texture2D(filter:'linear',width:1,height:1)
            .loadImage('images/cavity.png', true)
        
        @shadow = @fw.texture2D(filter:'linear',width:1,height:1)
            .loadImage('images/shadow.png', true)

        @update()

    addSlider: (name, top, min=0, max=1, value=0) ->
        row = $('<div></div>')
            .appendTo('body')
            .css(position:'absolute', left:20, top:top)

        $('<label></label>')
            .text(name)
            .css(color:'black', display:'inline-block', width:100)
            .appendTo(row)

        @params[name] = $('<input type="range" step="0.001">')
            .attr(min:min, max:max, value:value)
            .css(width: 300)
            .appendTo(row)[0]

    getParams: ->
        result = {}
        for name, input of @params
            result[name] = parseFloat(input.value)

        return result

    update: =>
        if @display?
            @fw.frameStart()
            @camera.update()
            
            for _ in [0...1]
                @samples.generate()
                @accumulators.update()

            params = @getParams()
            params.exposure = Math.pow(2, params.exposure*5)

            for name, value of params
                @display.float(name, value)

            @display
                .uniformSetter(@camera)
                .sampler('textureRadiance', @accumulators.specular)
                .vec2('radianceSize', @accumulators.specular.width(), @accumulators.specular.height())
                .sampler('textureBaseColor', @baseColor)
                .sampler('textureAO', @ao)
                .sampler('textureCavity', @cavity)
                .sampler('textureShadow', @shadow)
                .vec2('offset', 0, 0)
                .draw()
            ###

            for x in [0..10]
                @display
                    .vec2('offset', (x-5)*2.2, 0)
                    .float('roughness', x/10)
                    .draw()
            ###

            #@accumulators.blit()
            @fw.frameEnd()
        @updateChart()
        requestAnimationFrame @update

    on: (name, callback) ->
        @hub.on name, callback

    emit: (name, data) ->
        @hub.emit name, data

    doUpdateChart: ->
        avgs = @accumulators.getAvg()
        @chart.update(avgs)

    updateChart: ->
        if @lastChartUpdate?
            if performance.now() - @lastChartUpdate > 100
                @lastChartUpdate = performance.now()
                @doUpdateChart()
        else
            @lastChartUpdate = performance.now()
            @doUpdateChart()

    save: ->
        #exposure = Math.pow(2, @exposure.value*5)
        params = @getParams()
        exposure = Math.pow(2, params.exposure*5)

        result = []
        avgs = @accumulators.getAvg()
        for slice in @accumulators.save(exposure)
            result.push compression.compress(slice)

        result = JICKLE.encode(result)
        fileSystem.save("#{@environment.filename}-#{exposure.toFixed(2)}.env", result)

        #data = @accumulators.save()
        #compressed = compression.compress(data)

        #test = compression.decompress(compressed)
        #display data.data, data.size
        #display test, data.size

$ ->
    app = new Application()

display = (data, size) ->
    saturate = (value) ->
        if value < 0
            return 0
        else if value > 1
            return 1
        else
            return value

    canvas = $('<canvas></canvas>')
        .appendTo('body')
        .css(
            width:size
            height:size
            position:'absolute'
            backgroundColor:'red'
            zIndex:1
            top:0
            left:0
        )[0]
    canvas.width = size
    canvas.height = size

    ctx = canvas.getContext('2d')
    imageData = ctx.getImageData(0,0,size,size)
    image = imageData.data

    e = 1.0

    pixels = size*size

    for i in [0...pixels]
        r = Math.round(saturate(data[i*3+0]*e)*255)
        g = Math.round(saturate(data[i*3+1]*e)*255)
        b = Math.round(saturate(data[i*3+2]*e)*255)

        image[i*4+0] = r
        image[i*4+1] = g
        image[i*4+2] = b
        image[i*4+3] = 255
    ctx.putImageData(imageData, 0, 0)
