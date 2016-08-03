exports = (url, handlers) ->
    if typeof(handlers) == 'function'
        handlers =
            load: handlers
            init: ->
            progress: ->

    compressed = false
    contentLength = null
    entityLength = null
    initiated = false

    xhr = new XMLHttpRequest()
    xhr.open 'GET', url, true
    xhr.responseType = 'arraybuffer'
    xhr.onload = ->
        handlers.load(xhr.response)
    xhr.onreadystatechange = (event) ->
        if xhr.readyState == xhr.HEADERS_RECEIVED
            compressed = xhr.getResponseHeader('Content-Encoding')?
            contentLength = xhr.getResponseHeader('Content-Length')
            entityLength = xhr.getResponseHeader('X-Entity-Length')
            if contentLength?
                contentLength = parseFloat(contentLength)
            if entityLength?
                entityLength = parseFloat(entityLength)
    xhr.onprogress = (event) ->
        if compressed
            if entityLength?
                loaded = event.loaded
                total = entityLength
            else
                total = null
                loaded = null
        else
            if event.lengthComputable
                loaded = event.loaded
                total = event.total
            else
                loaded = null
                total = null

        if not initiated
            initiated = true
            handlers.init(total)

        if loaded?
            handlers.progress(loaded)

    xhr.send()

