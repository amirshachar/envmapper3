readImage = (entry, file, onLoad) ->
    reader = new FileReader()
    reader.onload = ->
        bytes = reader.result
        blob = new Blob([bytes], type:file.type)
        url = URL.createObjectURL(blob)
        img = new Image()
        img.onload = ->
            entry.content = img
            img.url = url
            img.bytes = bytes
            img.type = file.type
            onLoad()
        img.src = url
    reader.readAsArrayBuffer(file)

readText = (entry, file, onLoad) ->
    reader = new FileReader()
    reader.onload = ->
        entry.content = reader.result
        onLoad()
    reader.readAsText(file)

exports.readImage = (onLoad) ->
    input = $('<input type="file">')
        .attr('accept', 'image/*')
        .change =>
            file = input.files[0]
            entry = {}
            readImage entry, file, ->
                onLoad entry.content, file.name
        .click()[0]

exports.read = (accept, onLoad) ->
    input = $('<input type="file">')
        .attr('accept', accept)
        .change =>
            file = input.files[0]
            reader = new FileReader()
            reader.onload = ->
                onLoad reader.result, file
            reader.readAsArrayBuffer(file)
        .click()[0]

exports.openDir = (onLoad) ->
    input = $('<input type="file" webkitdirectory="true">')
        .change =>
            result = []
            count = 0
            loaded = 0
            for file in input.files
                path = file.webkitRelativePath ? file.name
                ext = path.split('.').pop().toLowerCase()
                name = path.split('/').pop()
                entry = {path:path, ext:ext, type:file.type, name:name}
                result.push(entry)
                switch ext
                    when 'jpeg', 'jpg', 'png', 'gif'
                        count += 1
                        readImage entry, file, ->
                            loaded += 1
                            if loaded == count
                                onLoad(result)
                    when 'dae'
                        count += 1
                        readText entry, file, ->
                            loaded += 1
                            if loaded == count
                                onLoad(result)
            if loaded == count
                onLoad(result)
        .click()[0]

exports.save = (name, data, mime='application/octet-stream') ->
    if data instanceof Blob
        blob = data
    else
        blob = new Blob([data], {type:mime})

    url = URL.createObjectURL(blob)

    link = document.createElement('a')
    link.download = name
    link.href = url
    event = document.createEvent('MouseEvents')
    event.initMouseEvent(
        'click', true, false, window, 0, 0, 0, 0,
        false, false, false, false, 0, null
    )
    link.dispatchEvent(event)
