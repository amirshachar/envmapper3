exports = class Pointer
    constructor: (@core, @elem) ->
        @hub = @core.hub

        $(@elem)
            .bind 'mousedown', @mousedown
            .bind 'mouseup', @mouseup
            .bind 'contextmenu', @context
            .bind 'wheel', @wheel

        $(document)
            .bind 'mouseup', @mouseup
            .bind 'mousemove', @mousemove
        
        @down = false
        @dragging = false

        @pos = null

    emit: (type, x, y, dx, dy) ->
        x ?= @pos[0]
        y ?= @pos[1]
        @hub.emit type,
            which: @which
            screen:
                x: x
                y: x
                dx: dx
                dy: dy
            device:
                x: (x/@elem.clientWidth)*2-1
                y: 1-(y/@elem.clientHeight)*2
                dx: (dx/@elem.clientWidth)*2-1
                dy: 1-(dy/@elem.clientHeight)*2

    mousedown: (event) =>
        @down = true
        @which = event.which
        @pos = @getPos event

    mouseup: (event) =>
        if @down
            @down = false
            if @dragging
                @dragging = false
                @emit 'pointer-drag-stop'
            else
                @emit 'pointer-click'

    mousemove: (event) =>
        if @down
            pos = @getPos(event)
            if not @dragging
                @emit 'pointer-drag-start', pos[0], pos[1]
                @dragging = true
            dx = pos[0] - @pos[0]
            dy = pos[1] - @pos[1]
            @emit 'pointer-drag', pos[0], pos[1], dx, dy
            @pos = pos
            
    context: (event) =>
        event.preventDefault()
        event.stopPropagation()
        return false
    
    getPos: (event) ->
        rect = @elem.getBoundingClientRect()
        x = event.clientX - rect.left
        y = event.clientY - rect.top
        return [x,y]

    wheel: (event) =>
        event.preventDefault()
        event.stopPropagation()

        event = event.originalEvent
        dy = event.deltaY
        if event.deltaMode == 1 #line mode
            dy *= 17.6
        else if event.deltaMode == 2 #page mode
            dy *= document.body.offsetHeight #probably

        @hub.emit 'pointer-wheel', dy
