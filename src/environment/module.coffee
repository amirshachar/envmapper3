hdr = require 'hdr'
fileSystem = require '/file-system'

exports = class Environment
    constructor: (@app) ->
        @texture = @app.fw.texture2D
            width: 1
            height: 1
            filter: 'linear'
            clamp: 'edge'
            type: @app.fw.usableFloat

        @lookup = fs.open('lookup.shader')

    setUniformsOn: (state) ->
        state.sampler('textureEnv', @texture)

    openHDR: ->
        fileSystem.read '.hdr', (array, file) =>
            name = file.name.split('.')
            name.pop()
            @filename = name.join('.')

            data = hdr.parse(array)
            @texture.dataSized data.bytes, data.width, data.height
            @app.emit 'environment-update'
