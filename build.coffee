#!/usr/bin/env coffee

path = require 'path'
fs   = require 'fs'
exec = require('child_process').exec

__dir  = path.dirname fs.realpathSync(__filename)
libDir = path.join(__dir, 'lib')

cachePath = path.join(__dir, '.cache')
if fs.existsSync(cachePath)
    fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
else
    fileCache = {}

{CoffeeScript} = require path.join(libDir, 'coffee-script')

visitDir = (directory) ->
    result = []
    for name in fs.readdirSync directory
        fullname = path.join directory, name
        stat = fs.statSync fullname
        if stat.isDirectory()
            for child in visitDir fullname
                result.push child
        else
            result.push fullname
    return result

walk = (root) ->
    for name in visitDir root
        name[root.length...]

preprocess = (relname, source, library) ->
    lines = ["sys.defModule '#{relname}', (exports, require, fs) ->"]

    for line in source.split '\n'
        lines.push '    ' + line
    lines.push '    return exports'
    return lines.join '\n'

compile = (filename) ->
    location = path.join(__dir, filename)
    modified = fs.statSync(location).mtime.getTime()
    cache = fileCache[location]

    if cache? then cache.seen = true

    if not cache? or cache.modified < modified
        console.log 'compiling', filename
        result = CoffeeScript.compile(
            fs.readFileSync(location, encoding:'utf-8')
            header:false, bare:true
        ).trim()
        fileCache[location] =
            modified: modified
            content: result
            seen: true
        return result
    else
        return cache.content

compileSource = (name, fullname) ->
    cache = fileCache[fullname]
    modified = fs.statSync(fullname).mtime.getTime()
    
    if cache? then cache.seen = true

    if not cache? or cache.modified < modified
        console.log 'compiling', name
        source = fs.readFileSync fullname, encoding:'utf-8'
        source = preprocess name, source
        result = CoffeeScript.compile(source, header:false, bare:true).trim()
        fileCache[fullname] =
            modified: modified
            content: result
            seen: true
        return result
    else
        return cache.content

compileShader = (name, fullname) ->
    cache = fileCache[fullname]
    modified = fs.statSync(fullname).mtime.getTime()
    
    if cache? then cache.seen = true

    if not cache? or cache.modified < modified
        console.log 'including', name
        text = fs.readFileSync fullname, 'utf-8'
        text = "#file #{name}\n#{text}"
        js = CoffeeScript.compile('sys.defFile "' + name + '", """' + text + '"""', header:false, bare:true).trim()
        fileCache[fullname] =
            modified: modified
            content: js
            seen: true
        return js
    else
        return cache.content

compileText = (name, fullname) ->
    cache = fileCache[fullname]
    modified = fs.statSync(fullname).mtime.getTime()
    
    if cache? then cache.seen = true

    if not cache? or cache.modified < modified
        console.log 'including', name
        text = fs.readFileSync fullname, 'utf-8'
        js = CoffeeScript.compile('sys.defFile "' + name + '", """' + text + '"""', header:false, bare:true).trim()
        fileCache[fullname] =
            modified: modified
            content: js
            seen: true
        return js
    else
        return cache.content

createLib = (outputName, libraries) ->
    code = ['(function(){']

    code.push compile('lib/require.coffee')

    for library in libraries
        srcDir = path.join(__dir, library.path)

        for name in walk srcDir
            fullname = path.join srcDir, name
            extension = name.split('.').pop()

            if library.name?
                name = '/' + library.name + name

            switch extension
                when 'coffee'
                    name = name[...name.length - '.coffee'.length]
                    code.push compileSource(name, fullname)
                when 'jpg', 'jpeg', 'png', 'webp', 'gif'
                    code.push "sys.defFile('#{name}');"
                when 'shader', 'glsl', 'fragment', 'vertex'
                    code.push compileShader(name, fullname)
                else
                    code.push compileText(name, fullname)

    code.push 'sys.main();'
    code.push '})();'

    code = code.join('\n')
    fs.writeFileSync(path.join(__dir, outputName), code)

if require.main is module
    exec 'lessc less/style.less', (error, stdout, stderr) ->
        if error?
            console.log 'stderr: ' + stderr
            console.log 'exec error: ' + error
        else
            fs.writeFileSync(path.join(__dir, 'style.css'), stdout)
    
    createLib('code.js', [
        {path:'src'}
    ])
    
    newCache = {}
    for name, value of fileCache
        if value.seen
            newCache[name] =
                modified: value.modified
                content: value.content

    fs.writeFileSync(path.join(__dir, '.cache'), JSON.stringify(newCache))
