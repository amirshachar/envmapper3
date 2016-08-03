pi = Math.PI

midp = (v1, v2) ->
    x1 = v1[0]
    y1 = v1[1]
    z1 = v1[2]
  
    x2 = v2[0]
    y2 = v2[1]
    z2 = v2[2]
    
    x3 = (x1+x2)/2
    y3 = (y1+y2)/2
    z3 = (z1+z2)/2

    return [x3, y3, z3]
    
normalize = (faces, r) ->
    r ?= 1
    result = []
    for face in faces
        new_face = []
        result.push new_face
        for vertex in face
            x = vertex[0]
            y = vertex[1]
            z = vertex[2]
            l = Math.sqrt(x*x + y*y + z*z)
            new_face.push [(r*x)/l, (r*y)/l, (r*z)/l]
    return result
    
subdivide = (faces) ->
    result = []
    for face in faces
        v0 = face[0]
        v1 = face[1]
        v2 = face[2]

        va = midp v0, v1
        vb = midp v1, v2
        vc = midp v2, v0

        result.push(
            [v0, va, vc],
            [va, v1, vb],
            [vc, vb, v2],
            [va, vb, vc],
        )

    return result


phi = (1+Math.sqrt(5))/2
v1  = [   1,  phi,    0]
v2  = [  -1,  phi,    0]
v3  = [   0,    1,  phi]
v4  = [   0,    1, -phi]
v5  = [ phi,    0,    1]
v6  = [-phi,    0,    1]
v7  = [-phi,    0,   -1]
v8  = [ phi,    0,   -1]
v9  = [   0,   -1,  phi]
v10 = [   0,   -1, -phi]
v11 = [  -1, -phi,    0]
v12 = [   1, -phi,    0]

faces = [
  [ v1,  v2,  v3],
  [ v2,  v1,  v4],
  [ v1,  v3,  v5],
  [ v2,  v6,  v3],
  [ v2,  v7,  v6],
  [ v2,  v4,  v7],
  [ v1,  v5,  v8],
  [ v1,  v8,  v4],
  [ v9,  v3,  v6],
  [ v3,  v9,  v5],
  [ v4, v10,  v7],
  [ v4,  v8, v10],
  [ v6,  v7, v11],
  [ v6, v11,  v9],
  [ v7, v10, v11],
  [ v5, v12,  v8],
  [v12,  v5,  v9],
  [v12, v10,  v8],
  [v11, v12,  v9],
  [v12, v11, v10]
]
icosahedron = normalize(faces)
    
vxp = [ 1, 0, 0]
vxm = [-1, 0, 0]
vyp = [ 0, 1, 0]
vym = [ 0,-1, 0]
vzp = [ 0, 0, 1]
vzm = [ 0, 0,-1]
faces = [
    [vzp, vxp, vyp],
    [vxm, vzp, vyp],
    [vyp, vxp, vzm],
    [vyp, vzm, vxm],
    [vym, vxp, vzp],
    [vym, vzp, vxm],
    [vzm, vxp, vym],
    [vxm, vzm, vym],
]
octahedron = normalize(faces)

dump = (faces) ->
    result = []
    for face in faces
        for vertex in face
            x = vertex[0]
            y = vertex[1]
            z = vertex[2]
            l = Math.sqrt(x*x + y*y + z*z)
            result.push x, y, z, x/l, y/l, z/l
    return result

sphere = (template, subdivisions=3) ->
    for i in [0...subdivisions]
        template = subdivide template
        template = normalize template
    return template

exports.octahedron = (subdivisions) ->
    result = sphere octahedron, subdivisions
    return dump normalize result

exports.icosahedron = (subdivisions) ->
    result = sphere icosahedron, subdivisions
    return dump normalize result
