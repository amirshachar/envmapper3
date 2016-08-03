class Interface
    constructor: (client, methods) ->
        makeMethod = (name) ->
            return ->
                client.call name

        for name in methods
            @[name] = makeMethod name

class Client
    constructor: (selector, @init) ->
        @iframe = $(selector)[0]
        window.addEventListener('message', @onMessage)
        $(@iframe).load =>
            @iframe.contentWindow.postMessage(type:'get-methods', @iframe.src)
    
    onMessage: (event) =>
        data = event.data
        if data.type == 'methods'
            @init new Interface(@, event.data.methods)
        else if data.type == 'return'
            @current.resolve(data.data)

    message: (type, data) ->
        @iframe.contentWindow.postMessage(type:type, data:data, @iframe.src)

    call: (name) ->
        promise = new Promise (resolve, reject) =>
            @current =
                resolve: resolve
                reject: reject

        @message 'call', name
        return promise

class Host
    constructor: (@root) ->
        window.addEventListener('message', @onMessage)
        @methods = []
        for name, value of @root
            if typeof value is 'function'
                @methods.push name

    onMessage: (event) =>
        data = event.data
        if data.type == 'get-methods'
            event.source.postMessage({type:'methods', methods:@methods}, event.origin)
        else if data.type == 'call'
            result = @root[data.data]()
            event.source.postMessage({type:'return', data:result}, event.origin)

window.iframeRMI =
    client: (selector, init) ->
        return new Client(selector, init)

    host: (root) ->
        return new Host(root)
