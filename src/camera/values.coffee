exports.ApproxValue = class ApproxValue
    constructor: (@value, @dt, @speed) ->
        @target = @value
        @last = @value
        @display = @value

    integrate: ->
        delta = (@target - @value)*@dt*@speed
        @last = @value
        @value += delta

    interpolate: (f) ->
        @display = @last*f + (1-f)*@value

    get: -> @display

    set: (@target) -> @

    add: (value, low=null, high=null) ->
        @target += value
        @limit low, high

    multiply: (value, low=null, high=null) ->
        @target *= value
        @limit low, high

    hardset: (value) ->
        @value = value
        @target = value
        @last = value
        @display = value

    limit: (low, high) ->
        if low? and @target < low
            @target = low
        if high? and @target > high
            @target = high

exports.ApproxVector = class ApproxVector
    constructor: (x, y, z, dt, speed) ->
        @x = new ApproxValue x, dt, speed
        @y = new ApproxValue y, dt, speed
        @z = new ApproxValue z, dt, speed

    integrate: ->
        @x.integrate()
        @y.integrate()
        @z.integrate()

    interpolate: (f) ->
        @x.interpolate f
        @y.interpolate f
        @z.interpolate f

    set: (x, y, z) ->
        @x.set x
        @y.set y
        @z.set z

    hardset: (x, y, z) ->
        @x.hardset x
        @y.hardset y
        @z.hardset z

    get: ->
        [@x.get(), @y.get(), @z.get()]

    add: (x, y, z) ->
        @x.add(x)
        @y.add(y)
        @z.add(z)

    limit: (xmin, xmax, ymin, ymax, zmin, zmax) ->
        if @x.target < xmin
            @x.target = xmin
        else if @x.target > xmax
            @x.target = xmax
        
        if @y.target < ymin
            @y.target = ymin
        else if @y.target > ymax
            @y.target = ymax
        
        if @z.target < zmin
            @z.target = zmin
        else if @z.target > zmax
            @z.target = zmax
