Pointer = require 'pointer'
{ApproxValue, ApproxVector} = require 'values'

exports = class Camera
    constructor: (@app) ->
        @fw = @app.fw
        @proj = @fw.mat4()
        @invProj = @fw.mat4()
        @view = @fw.mat4()
        @invView = @fw.mat4()
        @rot = @fw.mat3()
        @invRot = @fw.mat3()

        @dt = 1/120
        @rotation = new ApproxValue(0, @dt, 15)
        @pitch = new ApproxValue(30, @dt, 15)
        @zoom = new ApproxValue(2, @dt, 5)
        
        @up = @fw.vec3()
        @right = @fw.vec3()
        @position = new ApproxVector 0, 0, 0, @dt, 10

        @pointer = new Pointer @app, @fw.canvas

        @limits =
            rotation:
                min: null
                max: null
            pitch:
                min: null
                max: null
            zoom:
                min: null
                max: null

        @positionLocked = false

        @app.hub
            .on 'pointer-wheel', (value) =>
                value /= 53
                factor = Math.pow(1.05, value)

                @zoom.multiply(factor)
            .on 'pointer-drag', (event) =>
                @drag(event)

    drag: (event) ->
        if event.which == 1
            @orient(event)
        else if event.which == 3
            @pan(event)

    orient: (event) ->
        @rotation.add(event.screen.dx*0.3)
        @pitch.add(event.screen.dy*0.3)

    pan: (event) ->
        if not @positionLocked
            @invRot.mulVec3(@up.set(0, 1, 0))
            @invRot.mulVec3(@right.set(1,0,0))

            factor = 0.01
            x = event.screen.dx
            y = event.screen.dy
            y = y*-factor
            x = x*factor

            @position.add(@up.x*y, @up.y*y, @up.z*y)
            @position.add(@right.x*x, @right.y*x, @right.z*x)
    
    step: ->
        now = performance.now()/1000
        
        if not @time?
            @time = now - 0.2

        if now - @time > 0.2
            @time = now - 0.2

        @rotation.limit @limits.rotation.min, @limits.rotation.max
        @pitch.limit @limits.pitch.min, @limits.pitch.max
        @zoom.limit @limits.zoom.min, @limits.zoom.max

        while @time < now
            @time += @dt
            @rotation.integrate()
            @pitch.integrate()
            @zoom.integrate()
            @position.integrate()

        f = (@time - now)/@dt
        @rotation.interpolate f
        @pitch.interpolate f
        @zoom.interpolate f
        @position.interpolate f

    update: ->
        dist = @zoom.get()
        @perspective 90, 0.01, 100
        @step()
        @view
            .identity()
            .translate(0, 0, -dist)
            .rotatex(@pitch.get())
            .rotatey(@rotation.get())
            .translate(@position.x.get(), @position.y.get(), @position.z.get())
        
        @view.invert @invView.identity()
        @view.toMat3Rot @rot.identity()
        @invView.toMat3Rot @invRot.identity()
    
    perspective: (fov=60, near=0.05, far=20) ->
        aspect = @fw.canvas.width/@fw.canvas.height
        @proj.identity().perspective(fov, aspect, near, far)
        @invProj.identity().inversePerspective(fov, aspect, near, far)
    
    setUniformsOn: (state) ->
        state
            .mat4('proj', @proj)
            .mat4('invProj', @invProj)
            .mat4('view', @view)
            .mat4('invView', @invView)
            .mat3('rot', @rot)
            .mat3('invRot', @invRot)
        return @
    
    eyePos: (dst) ->
        @invView.mulVal4(0, 0, 0, 1, dst)
        return @

    eyeDir: (x,y,dst) ->
        @invProj.mulVal4(x, y, 0, 1, dst)
        @invRot.mulVal3(dst.x, dst.y, dst.z, dst)
        return @
