exports = class Events
    constructor: ->
        @handlers = {}

    on: (name, callback) ->
        handlers = @handlers[name]
        if not handlers?
            handlers = @handlers[name] = []

        idx = handlers.indexOf(callback)
        if idx == -1
            handlers.push(callback)
        else
            handlers.push(handlers.splice(idx, 1))

        return @

    off: (nameOrCallback, callback) ->
        if typeof nameOrCallback == 'function'
            name = null
            callback = nameOrCallback
        else
            name = nameOrCallback

        if name? and callback?
            handlers = @handlers[name]
            idx = handlers.indexOf(callback)
            if idx != -1
                handlers.splice(idx, 1)

        else if name?
            delete @handlers[name]

        else if callback?
            for name, handlers of @handlers
                idx = handlers.indexOf(callback)
                if idx != -1
                    handlers.splice(idx, 1)
        return @

    emit: (name, data) ->
        handlers = @handlers[name]
        if handlers?
            for handler in handlers
                handler(data)

        return @
