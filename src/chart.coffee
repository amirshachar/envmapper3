exports = class Chart
    constructor: ->
        @canvas = $('<canvas></canvas>')
            .css
                width:512
                height:512
                backgroundColor: '#111'
                position: 'absolute'
                top: 0
                right: 0
            .appendTo('body')[0]

        @canvas.width = 512
        @canvas.height = 512

        @ctx = @canvas.getContext('2d')
        @ctx.strokeStyle = '#fff'

        @values = null

        @pointCount = 100

    clear: ->
        @ctx.clearRect(0, 0, @canvas.width, @canvas.height)

    drawSeries: (series, x0, y0, width, height) ->
        if series.length == 0
            return

        [r,g,b] = series[0]
        max = 0
        max = Math.max(max, r)
        max = Math.max(max, g)
        max = Math.max(max, b)
        for [r,g,b] in series
            max = Math.max(max, r)
            max = Math.max(max, g)
            max = Math.max(max, b)


        @ctx.strokeStyle = 'red'
        @ctx.moveTo(0,0)
        @ctx.beginPath()
        for [r,g,b], x in series
            x = x0 + (x/@pointCount)*width
            y = y0 + (r/max)*height
            @ctx.lineTo(x,y)
        @ctx.stroke()
        
        @ctx.strokeStyle = 'green'
        @ctx.moveTo(0,0)
        @ctx.beginPath()
        for [r,g,b], x in series
            x = x0 + (x/@pointCount)*width
            y = y0 + (g/max)*height
            @ctx.lineTo(x,y)
        @ctx.stroke()
        
        @ctx.strokeStyle = 'blue'
        @ctx.moveTo(0,0)
        @ctx.beginPath()
        for [r,g,b], x in series
            x = x0 + (x/@pointCount)*width
            y = y0 + (b/max)*height
            @ctx.lineTo(x,y)
        @ctx.stroke()

    update: (data) ->
        if not @values?
            @values = for color in data
                []

        for [r,g,b], i in data
            if not isNaN(r)
                values = @values[i]
                values.push([r,g,b])
                if values.length > @pointCount
                    values.shift()

        @clear()
        for series, i in @values
            @drawSeries(series, 10, 10+60*i, @canvas.width-20, 50)
