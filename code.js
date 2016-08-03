(function(){
var sys,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

sys = {
  modules: {},
  files: {},
  defModule: function(name, closure) {
    return this.modules[name] = {
      closure: closure,
      instance: null
    };
  },
  defFile: function(name, value) {
    return this.files[name] = value;
  },
  loadImage: function(name, callback) {
    var img;
    img = new Image();
    img.onload = function() {
      return callback(name, img);
    };
    img.onerror = function() {
      return console.error('failed to load: ' + name);
    };
    img.src = 'src' + name;
  },
  main: function() {
    return this.require('/module');

    /*
     *window.addEventListener 'load', =>
    document.addEventListener 'DOMContentLoaded', =>
        toLoad = 0
        loaded = 0
        for name, value of @files
            ext = name.split('.').pop()
            if value is undefined
                toLoad += 1
                switch ext
                    when 'png', 'jpg', 'jpeg', 'gif'
                        @loadImage name, (imageName, img) =>
                            @files[imageName] = img
                            loaded += 1
                            if loaded is toLoad
                                @require('/module').main()
        if loaded is toLoad
            @require('/module').main()
     */
  },
  abspath: function(fromName, pathName) {
    var base, baseName, path;
    if (pathName === '.') {
      pathName = '';
    }
    baseName = fromName.split('/');
    baseName.pop();
    baseName = baseName.join('/');
    if (pathName[0] === '/') {
      return pathName;
    } else {
      path = pathName.split('/');
      if (baseName === '/') {
        base = [''];
      } else {
        base = baseName.split('/');
      }
      while (base.length > 0 && path.length > 0 && path[0] === '..') {
        base.pop();
        path.shift();
      }
      if (base.length === 0 || path.length === 0 || base[0] !== '') {
        throw new Error("Invalid path: " + (base.join('/')) + "/" + (path.join('/')));
      }
      return "" + (base.join('/')) + "/" + (path.join('/'));
    }
  },
  File: (function() {
    function _Class(path) {
      this.path = path;
      this.content = sys.files[this.path];
      if (this.content == null) {
        throw Error('file does not exist: ' + this.path);
      }
    }

    _Class.prototype.read = function() {
      return this.content;
    };

    return _Class;

  })(),
  FileSystem: (function() {
    function _Class(origin) {
      this.origin = origin;
    }

    _Class.prototype.abspath = function(fromName, pathName) {
      var folders, part, path, _i, _len, _ref;
      if (pathName[0] === '/') {
        return pathName;
      } else {
        folders = fromName.split('/');
        folders.pop();
        path = [];
        _ref = pathName.split('/');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          part = _ref[_i];
          if (part === '..') {
            if (folders.length > 0) {
              folders.pop();
            } else {
              path.push(part);
            }
          } else {
            path.push(part);
          }
        }
        return folders.concat(path).join('/');
      }
    };

    _Class.prototype.listdir = function(path, _arg) {
      var directories, files, name, result, type, value, _i, _len, _ref, _ref1;
      type = _arg.type;
      path = sys.abspath(this.origin, path);
      result = [];
      _ref = sys.modules;
      for (name in _ref) {
        value = _ref[name];
        if (name.indexOf(path) === 0) {
          name = name.slice(path.length + 1).split('/')[0];
          if (__indexOf.call(result, name) < 0) {
            result.push(name);
          }
        }
      }
      _ref1 = sys.files;
      for (name in _ref1) {
        value = _ref1[name];
        if (name.indexOf(path) === 0) {
          name = name.slice(path.length + 1).split('/')[0];
          if (__indexOf.call(result, name) < 0) {
            result.push(name);
          }
        }
      }
      directories = [];
      files = [];
      for (_i = 0, _len = result.length; _i < _len; _i++) {
        name = result[_i];
        if (this.isdir(path + '/' + name)) {
          directories.push(name);
        } else {
          files.push(name);
        }
      }
      switch (type) {
        case 'directory':
          return directories;
        case 'file':
          return files;
        default:
          return result;
      }
    };

    _Class.prototype.isdir = function(path) {
      var file, module, name, value, _ref, _ref1;
      path = sys.abspath(this.origin, path);
      module = sys.modules[path];
      if (module != null) {
        return false;
      }
      file = sys.files[path];
      if (file != null) {
        return false;
      }
      _ref = sys.modules;
      for (name in _ref) {
        value = _ref[name];
        if (name.indexOf(path) === 0) {
          return true;
        }
      }
      _ref1 = sys.files;
      for (name in _ref1) {
        value = _ref1[name];
        if (name.indexOf(path) === 0) {
          return true;
        }
      }
      throw new Error('Path does not exist: ' + path);
    };

    _Class.prototype.open = function(path) {
      return new sys.File(sys.abspath(this.origin, path));
    };

    return _Class;

  })(),
  require: function(moduleName) {
    var exports, fs, module, require;
    if (moduleName != null) {
      module = this.modules[moduleName];
      if (module === void 0) {
        module = this.modules[moduleName + '/module'];
        if (module != null) {
          moduleName = moduleName + '/module';
        } else {
          throw new Error('Module not found: ' + moduleName);
        }
      }
      if (module.instance === null) {
        require = (function(_this) {
          return function(requirePath) {
            var path;
            path = _this.abspath(moduleName, requirePath);
            return _this.require(path);
          };
        })(this);
        fs = new sys.FileSystem(moduleName);
        exports = {};
        exports = module.closure(exports, require, fs);
        module.instance = exports;
      }
      return module.instance;
    } else {
      throw new Error('no module name provided');
    }
  }
};
sys.defFile("/accumulator/copy.shader", "#file /accumulator/copy.shader\nvarying vec2 texcoord;\n\nvertex:\n    attribute vec2 position;\n    void main(){\n        texcoord = position*0.5+0.5;\n        gl_Position = vec4(position, 0, 1);\n    }\n\nfragment:\n    uniform sampler2D source;\n    void main(){\n        gl_FragColor = texture2D(source, texcoord);\n        //gl_FragColor = vec4(1,0,1,1);\n    }");
sys.defModule('/accumulator/module', function(exports, require, fs) {
  var Accumulator, Accumulators, lambertExponent, normalize;
  lambertExponent = function(angle) {
    var cos, cutoff, cutoffAngle, exp, modifiedAngle;
    angle = angle / 180;
    cutoff = 0.02;
    cutoffAngle = Math.acos(cutoff);
    modifiedAngle = angle * cutoffAngle;
    cos = Math.cos(modifiedAngle);
    exp = Math.log(cutoff) / Math.log(cos);
    return exp;
  };
  normalize = function(data, exposure) {
    var a, b, g, i, pixels, r, result, _i;
    pixels = data.length / 4;
    result = new Float64Array(pixels * 3);
    for (i = _i = 0; 0 <= pixels ? _i < pixels : _i > pixels; i = 0 <= pixels ? ++_i : --_i) {
      r = data[i * 4 + 0] * exposure;
      g = data[i * 4 + 1] * exposure;
      b = data[i * 4 + 2] * exposure;
      a = data[i * 4 + 3];
      result[i * 3 + 0] = r / a;
      result[i * 3 + 1] = g / a;
      result[i * 3 + 2] = b / a;
    }
    return result;
  };
  Accumulator = (function() {
    function Accumulator(app, size, updateShader, copyShader) {
      var i, max, _i;
      this.app = app;
      this.size = size;
      this.levels = [];
      this.levels.push(this.app.fw.state({
        framebuffer: {
          color: {
            width: this.size,
            height: this.size,
            filter: 'linear',
            clamp: 'edge',
            type: this.app.fw.usableFloat
          }
        },
        shader: updateShader,
        blend: 'add'
      }));
      max = Math.log2(this.size) - 1;
      for (i = _i = max; max <= 0 ? _i <= 0 : _i >= 0; i = max <= 0 ? ++_i : --_i) {
        size = Math.pow(2, i);
        this.levels.push(this.app.fw.state({
          framebuffer: {
            color: {
              width: size,
              height: size,
              filter: 'linear',
              clamp: 'edge',
              type: this.app.fw.usableFloat
            }
          },
          shader: copyShader
        }));
      }
      this.app.on('environment-update', (function(_this) {
        return function() {
          return _this.clear();
        };
      })(this));
    }

    Accumulator.prototype.bind = function(unit) {
      if (unit == null) {
        unit = 0;
      }
      return this.levels[0].bind(unit);
    };

    Accumulator.prototype.update = function(angle) {
      var exponent, i, _i, _ref;
      exponent = lambertExponent(angle);
      this.levels[0].float('angle', angle).float('lambertExponent', exponent).uniformSetter(this.app.environment).vec2('size', this.size, this.size).draw();
      for (i = _i = 1, _ref = this.levels.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
        this.levels[i].sampler('source', this.levels[i - 1]).draw();
      }
      return this.generateMips();
    };

    Accumulator.prototype.generateMips = function() {
      return null;
    };

    Accumulator.prototype.clear = function() {
      this.levels[0].clearColor(0, 0, 0, 0);
      return this.generateMips();
    };

    return Accumulator;

  })();
  exports = Accumulators = (function() {
    function Accumulators(app) {
      var size, _i, _len, _ref;
      this.app = app;
      this.updateShader = this.app.fw.shader([fs.open('/octahedral.shader'), this.app.environment.lookup, fs.open('update.shader')]);
      this.copyShader = this.app.fw.shader(fs.open('copy.shader'));
      this.accumulators = [];
      _ref = [128, 128, 128, 128, 256, 512, 1024];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        size = _ref[_i];
        this.accumulators.push(new Accumulator(this.app, size, this.updateShader, this.copyShader));
      }
      this.specular = this.app.fw.state({
        framebuffer: {
          color: {
            width: 3000,
            height: 1292 + 1026,
            filter: 'linear',
            clamp: 'edge',
            type: this.app.fw.usableFloat
          }
        },
        shader: fs.open('padd.shader')
      });
    }

    Accumulators.prototype.update = function() {
      var accumulator, angle, basis, hOffset, i, i2, j, j0, level, minAngle, offset0, offset1, size, vOffset, _i, _j, _len, _len1, _ref, _ref1, _results;
      this.updateShader.vec2('samples', this.app.samples.data());
      minAngle = 360 / 512;
      basis = Math.pow(180 / minAngle, 1.0 / (this.accumulators.length - 1));
      _ref = this.accumulators;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        accumulator = _ref[i];
        angle = 180 / Math.pow(basis, i);
        accumulator.update(angle);
      }
      _ref1 = this.accumulators;
      _results = [];
      for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
        accumulator = _ref1[i];
        size = Math.max(128, Math.pow(2, i + 4));
        offset0 = 130 * Math.min(i, 4);
        i2 = Math.max(i - 4, 0);
        offset1 = Math.pow(2, i2 + 8) - 256 + 2 * i2;
        vOffset = offset0 + offset1;
        _results.push((function() {
          var _k, _len2, _ref2, _results1;
          _ref2 = accumulator.levels;
          _results1 = [];
          for (j = _k = 0, _len2 = _ref2.length; _k < _len2; j = ++_k) {
            level = _ref2[j];
            size = Math.max(128, Math.pow(2, i + 4));
            size /= Math.pow(2, j);
            j0 = accumulator.levels.length - j - 1;
            hOffset = Math.pow(2, j0) - 1 + 2 * j0;
            _results1.push(this.specular.viewport(hOffset, vOffset, size + 2, size + 2).float('size', size + 2).sampler('source', level).draw());
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    Accumulators.prototype.bind = function(unit) {
      if (unit == null) {
        unit = 0;
      }
      return this.specular.bind(unit);
    };

    Accumulators.prototype.get = function(idx) {
      return this.accumulators[idx];
    };

    Accumulators.prototype.blit = function() {
      return this.specular.blit();
    };

    Accumulators.prototype.save = function(exposure) {
      var result, slice, texture, _i, _len, _ref;
      result = [];
      _ref = this.accumulators;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        slice = _ref[_i];
        texture = slice.levels[0];
        result.push({
          size: texture.width(),
          data: normalize(texture.readPixels(), exposure)
        });
      }
      return result;
    };

    Accumulators.prototype.getAvg = function() {
      var a, b, g, r, result, slice, _i, _len, _ref, _ref1;
      result = [];
      _ref = this.accumulators;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        slice = _ref[_i];
        _ref1 = slice.levels[slice.levels.length - 1].readPixels(), r = _ref1[0], g = _ref1[1], b = _ref1[2], a = _ref1[3];
        result.push([r / a, g / a, b / a]);
      }
      return result;
    };

    return Accumulators;

  })();
  return exports;
});
sys.defFile("/accumulator/padd.shader", "#file /accumulator/padd.shader\nvarying vec2 texcoord;\n\nvertex:\n    attribute vec2 position;\n    void main(){\n        texcoord = position*0.5+0.5;\n        gl_Position = vec4(position, 0, 1);\n    }\n\nfragment:\n    uniform sampler2D source;\n    uniform float size;\n    void main(){\n        //vec2 coord = gl_FragCoord.st;\n        vec2 coord = texcoord*size;\n\n        vec2 acoord = abs(coord-size*0.5);\n        float limit = size*0.5-1.0;\n        vec2 sourceCoord = clamp(coord-1.0, 0.5, size-2.5);\n        vec2 uv = sourceCoord/(size-2.0);\n\n        if(acoord.x > limit && acoord.y > limit){\n            uv = 1.0 - uv;\n        }\n        else if(acoord.x > limit){\n            uv.y = 1.0 - uv.y;\n        }\n        else if(acoord.y > limit){\n            uv.x = 1.0 - uv.x;\n        }\n\n        vec4 texel = texture2D(source, uv);\n        gl_FragColor = vec4(texel.rgb/texel.a, 1);\n    }");
sys.defFile("/accumulator/update.shader", "#file /accumulator/update.shader\nvarying vec2 texcoord;\n\nvertex:\n    attribute vec2 position;\n    void main(){\n        texcoord = position*0.5+0.5;\n        gl_Position = vec4(position, 0, 1);\n    }\n\nfragment:\n    #define numSamples 50\n    uniform vec2 samples[numSamples];\n    uniform float angle;\n    uniform float lambertExponent;\n    uniform vec2 size;\n\n    /*\n    vec3 getDir(vec2 rnd, vec3 normal){\n        float r = rnd.s * 2.0 * PI;\n        float z = rnd.t*2.0-1.0;\n        float scale = sqrt(1.0-z*z);\n        vec3 dir = vec3(cos(r)*scale, sin(r)*scale, z);\n        if(dot(dir, normal) < 0.0){\n            return -dir;\n        }\n        else{\n            return dir;\n        }\n    }\n    */\n\n    vec3 getDir(vec2 rnd, vec3 normal){\n        if(angle >= 20.0){\n            float r = rnd.s * 2.0 * PI;\n            float z = rnd.t*2.0-1.0;\n            float scale = sqrt(1.0-z*z);\n            vec3 dir = vec3(cos(r)*scale, sin(r)*scale, z);\n            if(dot(normal, dir) < 0.0){\n                dir = -dir;\n            }\n            return dir;\n        }\n        else{\n            vec3 tangent = normalize(cross(vec3(0,1,0), normal));\n            vec3 cotangent = normalize(cross(tangent, normal));\n\n            //float a = (clamp(angle, 0.0, 90.0)/90.0)*PIH;\n            float a = (clamp(angle, 0.0, 90.0)/90.0)*PIH;\n            float z = mix(1.0, cos(a), rnd.t);\n            //float z = rnd.t*2.0-1.0;\n            float r = rnd.s * TAU;\n            float scale = sqrt(1.0-z*z);\n            float x = cos(r)*scale;\n            float y = sin(r)*scale;\n\n            vec3 dir = normalize(\n                x*tangent + \n                y*cotangent +\n                z*normal\n            );\n            return dir;\n        }\n    }\n\n    void main(){\n        vec4 accum = vec4(0);\n        vec3 normal = uvToNormal(texcoord);\n        for(int i=0; i<numSamples; i++){\n            vec3 dir = getDir(samples[i], normal);\n            float lambert = max(0.0, dot(normal, dir));\n            float weight = pow(lambert, lambertExponent);\n            vec3 color = textureRectEnv(dir);\n            accum += vec4(color*weight, weight);\n        }\n        gl_FragColor = accum;\n\n        /*\n        // test pattern\n        vec2 coord = texcoord*2.0-1.0;\n        coord = step(0.0, coord);\n        float l = sum(abs(texcoord*2.0-1.0));\n        if(l > 1.0){\n            gl_FragColor.rgb = vec3(coord.s, 1, coord.t)*(0.5+(l-1.0)*0.5);\n        }\n        else{\n            gl_FragColor.rgb = vec3(coord.s, 0, coord.t)*(0.5+l*0.5);\n        }\n        gl_FragColor.a = 1.0;\n        */\n    }");
sys.defModule('/camera/module', function(exports, require, fs) {
  var ApproxValue, ApproxVector, Camera, Pointer, _ref;
  Pointer = require('pointer');
  _ref = require('values'), ApproxValue = _ref.ApproxValue, ApproxVector = _ref.ApproxVector;
  exports = Camera = (function() {
    function Camera(app) {
      this.app = app;
      this.fw = this.app.fw;
      this.proj = this.fw.mat4();
      this.invProj = this.fw.mat4();
      this.view = this.fw.mat4();
      this.invView = this.fw.mat4();
      this.rot = this.fw.mat3();
      this.invRot = this.fw.mat3();
      this.dt = 1 / 120;
      this.rotation = new ApproxValue(0, this.dt, 15);
      this.pitch = new ApproxValue(30, this.dt, 15);
      this.zoom = new ApproxValue(2, this.dt, 5);
      this.up = this.fw.vec3();
      this.right = this.fw.vec3();
      this.position = new ApproxVector(0, 0, 0, this.dt, 10);
      this.pointer = new Pointer(this.app, this.fw.canvas);
      this.limits = {
        rotation: {
          min: null,
          max: null
        },
        pitch: {
          min: null,
          max: null
        },
        zoom: {
          min: null,
          max: null
        }
      };
      this.positionLocked = false;
      this.app.hub.on('pointer-wheel', (function(_this) {
        return function(value) {
          var factor;
          value /= 53;
          factor = Math.pow(1.05, value);
          return _this.zoom.multiply(factor);
        };
      })(this)).on('pointer-drag', (function(_this) {
        return function(event) {
          return _this.drag(event);
        };
      })(this));
    }

    Camera.prototype.drag = function(event) {
      if (event.which === 1) {
        return this.orient(event);
      } else if (event.which === 3) {
        return this.pan(event);
      }
    };

    Camera.prototype.orient = function(event) {
      this.rotation.add(event.screen.dx * 0.3);
      return this.pitch.add(event.screen.dy * 0.3);
    };

    Camera.prototype.pan = function(event) {
      var factor, x, y;
      if (!this.positionLocked) {
        this.invRot.mulVec3(this.up.set(0, 1, 0));
        this.invRot.mulVec3(this.right.set(1, 0, 0));
        factor = 0.01;
        x = event.screen.dx;
        y = event.screen.dy;
        y = y * -factor;
        x = x * factor;
        this.position.add(this.up.x * y, this.up.y * y, this.up.z * y);
        return this.position.add(this.right.x * x, this.right.y * x, this.right.z * x);
      }
    };

    Camera.prototype.step = function() {
      var f, now;
      now = performance.now() / 1000;
      if (this.time == null) {
        this.time = now - 0.2;
      }
      if (now - this.time > 0.2) {
        this.time = now - 0.2;
      }
      this.rotation.limit(this.limits.rotation.min, this.limits.rotation.max);
      this.pitch.limit(this.limits.pitch.min, this.limits.pitch.max);
      this.zoom.limit(this.limits.zoom.min, this.limits.zoom.max);
      while (this.time < now) {
        this.time += this.dt;
        this.rotation.integrate();
        this.pitch.integrate();
        this.zoom.integrate();
        this.position.integrate();
      }
      f = (this.time - now) / this.dt;
      this.rotation.interpolate(f);
      this.pitch.interpolate(f);
      this.zoom.interpolate(f);
      return this.position.interpolate(f);
    };

    Camera.prototype.update = function() {
      var dist;
      dist = this.zoom.get();
      this.perspective(90, 0.01, 100);
      this.step();
      this.view.identity().translate(0, 0, -dist).rotatex(this.pitch.get()).rotatey(this.rotation.get()).translate(this.position.x.get(), this.position.y.get(), this.position.z.get());
      this.view.invert(this.invView.identity());
      this.view.toMat3Rot(this.rot.identity());
      return this.invView.toMat3Rot(this.invRot.identity());
    };

    Camera.prototype.perspective = function(fov, near, far) {
      var aspect;
      if (fov == null) {
        fov = 60;
      }
      if (near == null) {
        near = 0.05;
      }
      if (far == null) {
        far = 20;
      }
      aspect = this.fw.canvas.width / this.fw.canvas.height;
      this.proj.identity().perspective(fov, aspect, near, far);
      return this.invProj.identity().inversePerspective(fov, aspect, near, far);
    };

    Camera.prototype.setUniformsOn = function(state) {
      state.mat4('proj', this.proj).mat4('invProj', this.invProj).mat4('view', this.view).mat4('invView', this.invView).mat3('rot', this.rot).mat3('invRot', this.invRot);
      return this;
    };

    Camera.prototype.eyePos = function(dst) {
      this.invView.mulVal4(0, 0, 0, 1, dst);
      return this;
    };

    Camera.prototype.eyeDir = function(x, y, dst) {
      this.invProj.mulVal4(x, y, 0, 1, dst);
      this.invRot.mulVal3(dst.x, dst.y, dst.z, dst);
      return this;
    };

    return Camera;

  })();
  return exports;
});
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

sys.defModule('/camera/pointer', function(exports, require, fs) {
  var Pointer;
  exports = Pointer = (function() {
    function Pointer(core, elem) {
      this.core = core;
      this.elem = elem;
      this.wheel = __bind(this.wheel, this);
      this.context = __bind(this.context, this);
      this.mousemove = __bind(this.mousemove, this);
      this.mouseup = __bind(this.mouseup, this);
      this.mousedown = __bind(this.mousedown, this);
      this.hub = this.core.hub;
      $(this.elem).bind('mousedown', this.mousedown).bind('mouseup', this.mouseup).bind('contextmenu', this.context).bind('wheel', this.wheel);
      $(document).bind('mouseup', this.mouseup).bind('mousemove', this.mousemove);
      this.down = false;
      this.dragging = false;
      this.pos = null;
    }

    Pointer.prototype.emit = function(type, x, y, dx, dy) {
      if (x == null) {
        x = this.pos[0];
      }
      if (y == null) {
        y = this.pos[1];
      }
      return this.hub.emit(type, {
        which: this.which,
        screen: {
          x: x,
          y: x,
          dx: dx,
          dy: dy
        },
        device: {
          x: (x / this.elem.clientWidth) * 2 - 1,
          y: 1 - (y / this.elem.clientHeight) * 2,
          dx: (dx / this.elem.clientWidth) * 2 - 1,
          dy: 1 - (dy / this.elem.clientHeight) * 2
        }
      });
    };

    Pointer.prototype.mousedown = function(event) {
      this.down = true;
      this.which = event.which;
      return this.pos = this.getPos(event);
    };

    Pointer.prototype.mouseup = function(event) {
      if (this.down) {
        this.down = false;
        if (this.dragging) {
          this.dragging = false;
          return this.emit('pointer-drag-stop');
        } else {
          return this.emit('pointer-click');
        }
      }
    };

    Pointer.prototype.mousemove = function(event) {
      var dx, dy, pos;
      if (this.down) {
        pos = this.getPos(event);
        if (!this.dragging) {
          this.emit('pointer-drag-start', pos[0], pos[1]);
          this.dragging = true;
        }
        dx = pos[0] - this.pos[0];
        dy = pos[1] - this.pos[1];
        this.emit('pointer-drag', pos[0], pos[1], dx, dy);
        return this.pos = pos;
      }
    };

    Pointer.prototype.context = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    Pointer.prototype.getPos = function(event) {
      var rect, x, y;
      rect = this.elem.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      return [x, y];
    };

    Pointer.prototype.wheel = function(event) {
      var dy;
      event.preventDefault();
      event.stopPropagation();
      event = event.originalEvent;
      dy = event.deltaY;
      if (event.deltaMode === 1) {
        dy *= 17.6;
      } else if (event.deltaMode === 2) {
        dy *= document.body.offsetHeight;
      }
      return this.hub.emit('pointer-wheel', dy);
    };

    return Pointer;

  })();
  return exports;
});
sys.defModule('/camera/values', function(exports, require, fs) {
  var ApproxValue, ApproxVector;
  exports.ApproxValue = ApproxValue = (function() {
    function ApproxValue(value, dt, speed) {
      this.value = value;
      this.dt = dt;
      this.speed = speed;
      this.target = this.value;
      this.last = this.value;
      this.display = this.value;
    }

    ApproxValue.prototype.integrate = function() {
      var delta;
      delta = (this.target - this.value) * this.dt * this.speed;
      this.last = this.value;
      return this.value += delta;
    };

    ApproxValue.prototype.interpolate = function(f) {
      return this.display = this.last * f + (1 - f) * this.value;
    };

    ApproxValue.prototype.get = function() {
      return this.display;
    };

    ApproxValue.prototype.set = function(target) {
      this.target = target;
      return this;
    };

    ApproxValue.prototype.add = function(value, low, high) {
      if (low == null) {
        low = null;
      }
      if (high == null) {
        high = null;
      }
      this.target += value;
      return this.limit(low, high);
    };

    ApproxValue.prototype.multiply = function(value, low, high) {
      if (low == null) {
        low = null;
      }
      if (high == null) {
        high = null;
      }
      this.target *= value;
      return this.limit(low, high);
    };

    ApproxValue.prototype.hardset = function(value) {
      this.value = value;
      this.target = value;
      this.last = value;
      return this.display = value;
    };

    ApproxValue.prototype.limit = function(low, high) {
      if ((low != null) && this.target < low) {
        this.target = low;
      }
      if ((high != null) && this.target > high) {
        return this.target = high;
      }
    };

    return ApproxValue;

  })();
  exports.ApproxVector = ApproxVector = (function() {
    function ApproxVector(x, y, z, dt, speed) {
      this.x = new ApproxValue(x, dt, speed);
      this.y = new ApproxValue(y, dt, speed);
      this.z = new ApproxValue(z, dt, speed);
    }

    ApproxVector.prototype.integrate = function() {
      this.x.integrate();
      this.y.integrate();
      return this.z.integrate();
    };

    ApproxVector.prototype.interpolate = function(f) {
      this.x.interpolate(f);
      this.y.interpolate(f);
      return this.z.interpolate(f);
    };

    ApproxVector.prototype.set = function(x, y, z) {
      this.x.set(x);
      this.y.set(y);
      return this.z.set(z);
    };

    ApproxVector.prototype.hardset = function(x, y, z) {
      this.x.hardset(x);
      this.y.hardset(y);
      return this.z.hardset(z);
    };

    ApproxVector.prototype.get = function() {
      return [this.x.get(), this.y.get(), this.z.get()];
    };

    ApproxVector.prototype.add = function(x, y, z) {
      this.x.add(x);
      this.y.add(y);
      return this.z.add(z);
    };

    ApproxVector.prototype.limit = function(xmin, xmax, ymin, ymax, zmin, zmax) {
      if (this.x.target < xmin) {
        this.x.target = xmin;
      } else if (this.x.target > xmax) {
        this.x.target = xmax;
      }
      if (this.y.target < ymin) {
        this.y.target = ymin;
      } else if (this.y.target > ymax) {
        this.y.target = ymax;
      }
      if (this.z.target < zmin) {
        return this.z.target = zmin;
      } else if (this.z.target > zmax) {
        return this.z.target = zmax;
      }
    };

    return ApproxVector;

  })();
  return exports;
});
sys.defModule('/chart', function(exports, require, fs) {
  var Chart;
  exports = Chart = (function() {
    function Chart() {
      this.canvas = $('<canvas></canvas>').css({
        width: 512,
        height: 512,
        backgroundColor: '#111',
        position: 'absolute',
        top: 0,
        right: 0
      }).appendTo('body')[0];
      this.canvas.width = 512;
      this.canvas.height = 512;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.strokeStyle = '#fff';
      this.values = null;
      this.pointCount = 100;
    }

    Chart.prototype.clear = function() {
      return this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    Chart.prototype.drawSeries = function(series, x0, y0, width, height) {
      var b, g, max, r, x, y, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4;
      if (series.length === 0) {
        return;
      }
      _ref = series[0], r = _ref[0], g = _ref[1], b = _ref[2];
      max = 0;
      max = Math.max(max, r);
      max = Math.max(max, g);
      max = Math.max(max, b);
      for (_i = 0, _len = series.length; _i < _len; _i++) {
        _ref1 = series[_i], r = _ref1[0], g = _ref1[1], b = _ref1[2];
        max = Math.max(max, r);
        max = Math.max(max, g);
        max = Math.max(max, b);
      }
      this.ctx.strokeStyle = 'red';
      this.ctx.moveTo(0, 0);
      this.ctx.beginPath();
      for (x = _j = 0, _len1 = series.length; _j < _len1; x = ++_j) {
        _ref2 = series[x], r = _ref2[0], g = _ref2[1], b = _ref2[2];
        x = x0 + (x / this.pointCount) * width;
        y = y0 + (r / max) * height;
        this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
      this.ctx.strokeStyle = 'green';
      this.ctx.moveTo(0, 0);
      this.ctx.beginPath();
      for (x = _k = 0, _len2 = series.length; _k < _len2; x = ++_k) {
        _ref3 = series[x], r = _ref3[0], g = _ref3[1], b = _ref3[2];
        x = x0 + (x / this.pointCount) * width;
        y = y0 + (g / max) * height;
        this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
      this.ctx.strokeStyle = 'blue';
      this.ctx.moveTo(0, 0);
      this.ctx.beginPath();
      for (x = _l = 0, _len3 = series.length; _l < _len3; x = ++_l) {
        _ref4 = series[x], r = _ref4[0], g = _ref4[1], b = _ref4[2];
        x = x0 + (x / this.pointCount) * width;
        y = y0 + (b / max) * height;
        this.ctx.lineTo(x, y);
      }
      return this.ctx.stroke();
    };

    Chart.prototype.update = function(data) {
      var b, color, g, i, r, series, values, _i, _j, _len, _len1, _ref, _ref1, _results;
      if (this.values == null) {
        this.values = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            color = data[_i];
            _results.push([]);
          }
          return _results;
        })();
      }
      for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
        _ref = data[i], r = _ref[0], g = _ref[1], b = _ref[2];
        if (!isNaN(r)) {
          values = this.values[i];
          values.push([r, g, b]);
          if (values.length > this.pointCount) {
            values.shift();
          }
        }
      }
      this.clear();
      _ref1 = this.values;
      _results = [];
      for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
        series = _ref1[i];
        _results.push(this.drawSeries(series, 10, 10 + 60 * i, this.canvas.width - 20, 50));
      }
      return _results;
    };

    return Chart;

  })();
  return exports;
});
sys.defModule('/compression/module', function(exports, require, fs) {
  var RGBtoXYLUM, XYLUMtoRGB, compress, compressBlock2, compressBlock4, decompress, decompressBlock2, decompressBlock4, minmax, saturate, scale, stream, unscale;
  stream = require('stream');
  saturate = function(value) {
    if (value < 0) {
      return 0;
    } else if (value > 1) {
      return 1;
    } else {
      return value;
    }
  };
  minmax = function(values) {
    var max, min, value, _i, _len;
    min = max = values[0];
    if (isNaN(min)) {
      min = max = 0;
    }
    for (_i = 0, _len = values.length; _i < _len; _i++) {
      value = values[_i];
      if (isNaN(value)) {
        value = 0;
      }
      max = Math.max(value, max);
      min = Math.min(value, min);
    }
    return {
      max: max,
      min: min
    };
  };
  scale = function(data, limit) {
    var i, max, min, result, value, _i, _len, _ref;
    _ref = minmax(data), min = _ref.min, max = _ref.max;
    result = new Float64Array(data.length);
    if (limit != null) {
      max = Math.min(max, limit);
    }
    for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
      value = data[i];
      if (max - min === 0) {
        result[i] = 0;
      } else {
        result[i] = saturate((value - min) / (max - min));
      }
    }
    return {
      min: min,
      max: max,
      data: result
    };
  };
  unscale = function(_arg) {
    var data, delta, i, max, min, result, value, _i, _len;
    min = _arg.min, max = _arg.max, data = _arg.data;
    result = new Float64Array(data.length);
    delta = max - min;
    for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
      value = data[i];
      result[i] = min + value * delta;
    }
    return result;
  };
  RGBtoXYLUM = function(data) {
    var L, X, Y, b, g, i, l, pixels, r, x, y, z, _i;
    pixels = data.length / 3;
    L = new Float64Array(pixels);
    X = new Float64Array(pixels);
    Y = new Float64Array(pixels);
    for (i = _i = 0; 0 <= pixels ? _i < pixels : _i > pixels; i = 0 <= pixels ? ++_i : --_i) {
      r = data[i * 3 + 0];
      g = data[i * 3 + 1];
      b = data[i * 3 + 2];
      x = r * 0.2209 + g * 0.1138 + b * 0.0102;
      y = r * 0.339 + g * 0.678 + b * 0.1130;
      z = r * 0.4184 + g * 0.7319 + b * 0.2969;
      l = x + y + z;
      L[i] = l;
      X[i] = x / l;
      Y[i] = y / l;
    }
    return {
      x: X,
      y: Y,
      lum: L
    };
  };
  XYLUMtoRGB = function(data) {
    var b, g, i, lum, pixels, r, result, x, y, z, _i;
    pixels = data.size * data.size;
    result = new Float32Array(pixels * 3);
    for (i = _i = 0; 0 <= pixels ? _i < pixels : _i > pixels; i = 0 <= pixels ? ++_i : --_i) {
      x = data.x[i];
      y = data.y[i];
      lum = data.lum[i];
      z = 1.0 - x - y;
      x *= lum;
      y *= lum;
      z *= lum;
      r = x * 6.0013 + y * -1.332 + z * 0.3007;
      g = x * -2.7 + y * 3.1029 + z * -1.088;
      b = x * -1.7995 + y * -5.772 + z * 5.6268;
      result[i * 3 + 0] = r;
      result[i * 3 + 1] = g;
      result[i * 3 + 2] = b;
    }
    return result;
  };
  compressBlock2 = function(values, xoff, yoff, size, blockSize, writer) {
    var blockValues, dstIdx, i, max, min, shortLimit, shortMax, shortMin, srcIdx, val0, val1, val2, val3, value, valueCount, x, y, _i, _j, _k, _results;
    valueCount = blockSize * blockSize;
    blockValues = new Float64Array(valueCount);
    min = max = values[xoff + yoff * size];
    dstIdx = 0;
    for (y = _i = 0; 0 <= blockSize ? _i < blockSize : _i > blockSize; y = 0 <= blockSize ? ++_i : --_i) {
      for (x = _j = 0; 0 <= blockSize ? _j < blockSize : _j > blockSize; x = 0 <= blockSize ? ++_j : --_j) {
        srcIdx = (xoff + x) + (yoff + y) * size;
        value = values[srcIdx];
        min = Math.min(value, min);
        max = Math.max(value, max);
        blockValues[dstIdx] = value;
        dstIdx += 1;
      }
    }
    shortLimit = 256 * 256 - 1;
    shortMin = Math.round(min * shortLimit);
    shortMax = Math.round(max * shortLimit);
    writer.uint16(shortMin);
    writer.uint16(shortMax);
    min = shortMin / shortLimit;
    max = shortMax / shortLimit;
    _results = [];
    for (i = _k = 0; _k < valueCount; i = _k += 4) {
      val0 = blockValues[i + 0];
      val1 = blockValues[i + 1];
      val2 = blockValues[i + 2];
      val3 = blockValues[i + 3];
      val0 = Math.round(saturate((val0 - min) / (max - min)) * 3);
      val1 = Math.round(saturate((val1 - min) / (max - min)) * 3);
      val2 = Math.round(saturate((val2 - min) / (max - min)) * 3);
      val3 = Math.round(saturate((val3 - min) / (max - min)) * 3);
      _results.push(writer.uint8((val0 << 6) | (val1 << 4) | (val2 << 2) | val3));
    }
    return _results;
  };
  compressBlock4 = function(values, xoff, yoff, size, blockSize, writer) {
    var blockValues, dstIdx, i, max, min, shortLimit, shortMax, shortMin, srcIdx, val0, val1, value, valueCount, x, y, _i, _j, _k, _results;
    valueCount = blockSize * blockSize;
    blockValues = new Float64Array(valueCount);
    min = max = values[xoff + yoff * size];
    dstIdx = 0;
    for (y = _i = 0; 0 <= blockSize ? _i < blockSize : _i > blockSize; y = 0 <= blockSize ? ++_i : --_i) {
      for (x = _j = 0; 0 <= blockSize ? _j < blockSize : _j > blockSize; x = 0 <= blockSize ? ++_j : --_j) {
        srcIdx = (xoff + x) + (yoff + y) * size;
        value = values[srcIdx];
        min = Math.min(value, min);
        max = Math.max(value, max);
        blockValues[dstIdx] = value;
        dstIdx += 1;
      }
    }
    shortLimit = 256 * 256 - 1;
    shortMin = Math.round(min * shortLimit);
    shortMax = Math.round(max * shortLimit);
    writer.uint16(shortMin);
    writer.uint16(shortMax);
    min = shortMin / shortLimit;
    max = shortMax / shortLimit;
    _results = [];
    for (i = _k = 0; _k < valueCount; i = _k += 2) {
      val0 = blockValues[i + 0];
      val1 = blockValues[i + 1];
      val0 = Math.round(saturate((val0 - min) / (max - min)) * 15);
      val1 = Math.round(saturate((val1 - min) / (max - min)) * 15);
      _results.push(writer.uint8((val0 << 4) | val1));
    }
    return _results;
  };
  compress = function(_arg) {
    var bits, blockSize, bpp, bufferSize, compressBlock, data, size, writer, x, y, _i, _j;
    data = _arg.data, size = _arg.size, blockSize = _arg.blockSize, bits = _arg.bits;
    bpp = bits / 8;
    bufferSize = (size / blockSize) * (size / blockSize) * (4 + blockSize * blockSize * bpp);
    writer = new stream.Writer(bufferSize);
    if (bits === 4) {
      compressBlock = compressBlock4;
    } else if (bits === 2) {
      compressBlock = compressBlock2;
    }
    for (y = _i = 0; blockSize > 0 ? _i < size : _i > size; y = _i += blockSize) {
      for (x = _j = 0; blockSize > 0 ? _j < size : _j > size; x = _j += blockSize) {
        compressBlock(data, x, y, size, blockSize, writer);
      }
    }
    return {
      data: writer.getBuffer(),
      blockSize: blockSize,
      bits: bits,
      size: size
    };
  };
  decompressBlock2 = function(result, xoff, yoff, size, blockSize, reader) {
    var byte, max, min, shortLimit, srcIdx, val0, val1, val2, val3, x, y, _i, _j;
    srcIdx = 0;
    shortLimit = 256 * 256 - 1;
    min = reader.uint16() / shortLimit;
    max = reader.uint16() / shortLimit;
    for (y = _i = 0; 0 <= blockSize ? _i < blockSize : _i > blockSize; y = 0 <= blockSize ? ++_i : --_i) {
      for (x = _j = 0; _j < blockSize; x = _j += 4) {
        byte = reader.uint8();
        val0 = (byte >> 6) & 3;
        val1 = (byte >> 4) & 3;
        val2 = (byte >> 2) & 3;
        val3 = byte & 3;
        result[(xoff + x + 0) + (yoff + y) * size] = min + (val0 / 3) * (max - min);
        result[(xoff + x + 1) + (yoff + y) * size] = min + (val1 / 3) * (max - min);
        result[(xoff + x + 2) + (yoff + y) * size] = min + (val2 / 3) * (max - min);
        result[(xoff + x + 3) + (yoff + y) * size] = min + (val3 / 3) * (max - min);
      }
    }
  };
  decompressBlock4 = function(result, xoff, yoff, size, blockSize, reader) {
    var byte, max, min, shortLimit, srcIdx, val0, val1, x, y, _i, _j;
    srcIdx = 0;
    shortLimit = 256 * 256 - 1;
    min = reader.uint16() / shortLimit;
    max = reader.uint16() / shortLimit;
    for (y = _i = 0; 0 <= blockSize ? _i < blockSize : _i > blockSize; y = 0 <= blockSize ? ++_i : --_i) {
      for (x = _j = 0; _j < blockSize; x = _j += 2) {
        byte = reader.uint8();
        val0 = (byte >> 4) & 15;
        val1 = byte & 15;
        result[(xoff + x + 0) + (yoff + y) * size] = min + (val0 / 15) * (max - min);
        result[(xoff + x + 1) + (yoff + y) * size] = min + (val1 / 15) * (max - min);
      }
    }
  };
  decompress = function(_arg) {
    var bits, blockSize, data, decompressBlock, reader, result, size, x, y, _i, _j;
    data = _arg.data, size = _arg.size, blockSize = _arg.blockSize, bits = _arg.bits;
    result = new Float64Array(size * size);
    reader = new stream.Reader(data);
    if (bits === 4) {
      decompressBlock = decompressBlock4;
    } else if (bits === 2) {
      decompressBlock = decompressBlock2;
    }
    for (y = _i = 0; blockSize > 0 ? _i < size : _i > size; y = _i += blockSize) {
      for (x = _j = 0; blockSize > 0 ? _j < size : _j > size; x = _j += blockSize) {
        decompressBlock(result, x, y, size, blockSize, reader);
      }
    }
    return result;
  };
  exports = {
    compress: function(_arg) {
      var data, quality, size;
      data = _arg.data, size = _arg.size, quality = _arg.quality;
      if (quality == null) {
        quality = {
          x: {
            bits: 2,
            blockSize: 8
          },
          y: {
            bits: 2,
            blockSize: 8
          },
          lum: {
            bits: 4,
            blockSize: 4
          }
        };
      }
      data = RGBtoXYLUM(data);
      data.size = size;
      data.lum = scale(data.lum, 192);
      data.x = scale(data.x);
      data.y = scale(data.y);
      data.x.data = compress({
        data: data.x.data,
        size: size,
        blockSize: quality.x.blockSize,
        bits: quality.x.bits
      });
      data.y.data = compress({
        data: data.y.data,
        size: size,
        blockSize: quality.y.blockSize,
        bits: quality.y.bits
      });
      data.lum.data = compress({
        data: data.lum.data,
        size: size,
        blockSize: quality.lum.blockSize,
        bits: quality.lum.bits
      });
      return data;
    },
    decompress: function(data) {
      var lum, x, y;
      x = decompress(data.x.data);
      y = decompress(data.y.data);
      lum = decompress(data.lum.data);
      x = unscale({
        min: data.x.min,
        max: data.x.max,
        data: x
      });
      y = unscale({
        min: data.y.min,
        max: data.y.max,
        data: y
      });
      lum = unscale({
        min: data.lum.min,
        max: data.lum.max,
        data: lum
      });
      return XYLUMtoRGB({
        x: x,
        y: y,
        lum: lum,
        size: data.size
      });
    }
  };
  return exports;
});
sys.defModule('/compression/stream', function(exports, require, fs) {
  var Reader, Writer;
  exports.Writer = Writer = (function() {
    function Writer(initialSize) {
      if (initialSize == null) {
        initialSize = 1024;
      }
      this.buffer = new ArrayBuffer(initialSize);
      this.view = new DataView(this.buffer);
      this.offset = 0;
    }

    Writer.prototype.checkSize = function(bytesToWrite) {
      var remaining;
      remaining = this.buffer.byteLength - this.offset;
      if (remaining < bytesToWrite) {
        return this.enlarge(bytesToWrite - remaining);
      }
    };

    Writer.prototype.enlarge = function(minimum) {
      var dst, newBuffer, newSize, src;
      newSize = Math.max(this.buffer.byteLength * 2, this.buffer.byteLength + minimum * 2);
      newBuffer = new ArrayBuffer(newSize);
      src = new Uint8Array(this.buffer);
      dst = new Uint8Array(newBuffer);
      dst.set(src);
      this.buffer = newBuffer;
      return this.view = new DataView(this.buffer);
    };

    Writer.prototype.uint8 = function(value) {
      this.checkSize(1);
      this.view.setUint8(this.offset, value, true);
      return this.offset += 1;
    };

    Writer.prototype.int8 = function(value) {
      this.checkSize(1);
      this.view.setInt8(this.offset, value, true);
      return this.offset += 1;
    };

    Writer.prototype.uint16 = function(value) {
      this.checkSize(2);
      this.view.setInt16(this.offset, value, true);
      return this.offset += 2;
    };

    Writer.prototype.int16 = function(value) {
      this.checkSize(2);
      this.view.setUint16(this.offset, value, true);
      return this.offset += 2;
    };

    Writer.prototype.uint32 = function(value) {
      this.checkSize(4);
      this.view.setUint32(this.offset, value, true);
      return this.offset += 4;
    };

    Writer.prototype.int32 = function(value) {
      this.checkSize(4);
      this.view.setInt32(this.offset, value, true);
      return this.offset += 4;
    };

    Writer.prototype.float32 = function(value) {
      this.checkSize(4);
      this.view.setFloat32(this.offset, value, true);
      return this.offset += 4;
    };

    Writer.prototype.float64 = function(value) {
      this.checkSize(8);
      this.view.setFloat64(this.offset, value, true);
      return this.offset += 8;
    };

    Writer.prototype.getBuffer = function() {
      return this.buffer.slice(0, this.offset);
    };

    return Writer;

  })();
  exports.Reader = Reader = (function() {
    function Reader(buffer) {
      this.buffer = buffer;
      this.view = new DataView(buffer);
      this.offset = 0;
    }

    Reader.prototype.uint8 = function() {
      var value;
      value = this.view.getUint8(this.offset, true);
      this.offset += 1;
      return value;
    };

    Reader.prototype.uint8array = function(length) {
      var value;
      value = new Uint8Array(this.buffer, this.offset, length);
      this.offset += length;
      return value;
    };

    Reader.prototype.int8 = function() {
      var value;
      value = this.view.getInt8(this.offset, true);
      this.offset += 1;
      return value;
    };

    Reader.prototype.int8array = function(length) {
      var value;
      value = new Int8Array(this.buffer, this.offset, length);
      this.offset += length;
      return value;
    };

    Reader.prototype.uint16 = function() {
      var value;
      value = this.view.getUint16(this.offset, true);
      this.offset += 2;
      return value;
    };

    Reader.prototype.uint16array = function(length) {
      var padding, value;
      padding = this.offset % 2;
      this.offset += padding;
      value = new Uint16Array(this.buffer, this.offset, length);
      this.offset += length * 2;
      return value;
    };

    Reader.prototype.int16 = function() {
      var value;
      value = this.view.getInt16(this.offset, true);
      this.offset += 2;
      return value;
    };

    Reader.prototype.int16array = function(length) {
      var padding, value;
      padding = this.offset % 2;
      this.offset += padding;
      value = new Int16Array(this.buffer, this.offset, length);
      this.offset += length * 2;
      return value;
    };

    Reader.prototype.uint32 = function() {
      var value;
      value = this.view.getUint32(this.offset, true);
      this.offset += 4;
      return value;
    };

    Reader.prototype.uint32array = function(length) {
      var padding, value;
      padding = (4 - (this.offset % 4)) % 4;
      this.offset += padding;
      value = new Uint32Array(this.buffer, this.offset, length);
      this.offset += length * 4;
      return value;
    };

    Reader.prototype.int32 = function() {
      var value;
      value = this.view.getInt32(this.offset, true);
      this.offset += 4;
      return value;
    };

    Reader.prototype.int32array = function(length) {
      var padding, value;
      padding = (4 - (this.offset % 4)) % 4;
      this.offset += padding;
      value = new Int32Array(this.buffer, this.offset, length);
      this.offset += length * 4;
      return value;
    };

    Reader.prototype.float32 = function() {
      var value;
      value = this.view.getFloat32(this.offset, true);
      this.offset += 4;
      return value;
    };

    Reader.prototype.float32array = function(length) {
      var padding, value;
      padding = (4 - (this.offset % 4)) % 4;
      this.offset += padding;
      value = new Float32Array(this.buffer, this.offset, length);
      this.offset += length * 4;
      return value;
    };

    Reader.prototype.float64 = function() {
      var value;
      value = this.view.getFloat64(this.offset, true);
      this.offset += 8;
      return value;
    };

    Reader.prototype.float64array = function(length) {
      var padding, value;
      padding = (8 - (this.offset % 8)) % 8;
      this.offset += padding;
      value = new Float64Array(this.buffer, this.offset, length);
      this.offset += length * 8;
      return value;
    };

    Reader.prototype.arraybuffer = function(length) {
      var result;
      result = this.buffer.slice(this.offset, this.offset + length);
      this.offset += length;
      return result;
    };

    return Reader;

  })();
  return exports;
});
sys.defFile("/display.shader", "#file /display.shader\nvarying vec2 vTexcoord;\nvarying vec3 vNormal;\nvarying vec3 vWorldPosition, vViewPosition;\n\nvertex:\n    attribute vec3 position;\n    attribute vec2 texcoord;\n    attribute vec3 normal;\n\n    uniform mat4 proj, view;\n    uniform vec2 offset;\n\n    void main(){\n        vTexcoord = texcoord;\n        vNormal = normal;\n        vWorldPosition = vec3(offset.x, 0, offset.y) + position;\n        vViewPosition = (view*vec4(vWorldPosition, 1)).xyz;\n        gl_Position = proj * vec4(vViewPosition, 1);\n    }\n\nfragment:\n    uniform sampler2D textureRadiance;\n    uniform vec2 radianceSize;\n\n    vec3 getRadianceMip(vec2 uv, float vOffset, float lod){\n        float size = pow(2.0, lod);\n        \n        float hOffset = pow(2.0, lod)-1.0 + lod*2.0;\n        vec2 texcoord = (vec2(hOffset, vOffset)+1.0+uv*size)/radianceSize;\n        return texture2D(textureRadiance, texcoord).rgb;\n    }\n\n    vec3 getRadianceSlice(vec2 uv, float slice, float angularChange){\n        float size = max(128.0, pow(2.0, slice+4.0));\n        float offset0 = 130.0*min(slice,4.0);\n        float i2 = max(slice-4.0, 0.0);\n        float offset1 = pow(2.0, i2+8.0) - 256.0 + 2.0*i2;\n        float vOffset = offset0 + offset1;\n\n        float maxLod = log(size)/log(2.0);\n\n        float pixelsPerChange = size*0.7*angularChange; // approximately 1/sqrt(2)\n        float lod = log(pixelsPerChange)/log(2.0);\n        lod = clamp(maxLod-lod, 0.0, maxLod);\n        //lod = maxLod;\n\n        return mix(\n            getRadianceMip(uv, vOffset, floor(lod)),\n            getRadianceMip(uv, vOffset, floor(lod)+1.0),\n            fract(lod)\n        );\n    }\n    \n    float translateRoughness(float roughness){\n        float minAngle = 360.0/512.0;\n        float basis = 2.5198420997897464;\n        float angle = mix(minAngle, 180.0, roughness);\n        float factor = 1.0 - logN(180.0/angle, basis)/6.0;\n        return clamp(factor, 0.0, 1.0);\n    }\n\n    uniform float exposure;\n    vec3 getRadiance(vec3 dir, float roughness){\n        roughness = translateRoughness(roughness);\n\n        vec3 dd = fwidth(normalize(dir));\n        //float ddl2 = pow(length(dd), 2.0);\n        float ddl2 = dot(dd,dd);\n        float angularChange = acos(sqrt(4.0 - ddl2)*0.5)/PI;\n\n        //float angularChange = acos(dot(normalize(dir+fwidth(dir)), dir))/PI; // creates artifacts\n\n        vec2 uv = normalToUv(dir);\n\n        float slice = (1.0-roughness)*6.0;\n        float slice0 = floor(slice);\n        float slice1 = slice0 + 1.0;\n        float f = fract(slice);\n        \n        vec3 color0 = getRadianceSlice(uv, slice0, angularChange);\n        vec3 color1 = getRadianceSlice(uv, slice1, angularChange);\n\n        return mix(color0, color1, f)*exposure;\n        //return vec3(angularChange*10.0);\n    }\n    \n    vec3 getDiffuse(vec3 normal){\n        return getRadiance(normal, 1.0)*exposure;\n    }\n\n\n    uniform mat3 invRot;\n    uniform sampler2D textureBaseColor;\n    uniform sampler2D textureAO;\n    uniform sampler2D textureCavity;\n    uniform sampler2D textureShadow;\n\n    uniform float diffuseReflectance, specularReflectance, specularMix, emissivity;\n\n    uniform float roughness1, fresnel1, metallness1;\n    uniform float roughness2, fresnel2, metallness2;\n\n    float getFresnel(vec3 N, vec3 V, float r){\n        float c = dot(N, V);\n        r = pow(r, 5.0);\n        return r+(1.0-r)*pow(1.0-c, 5.0);\n    }\n\n    void test(){\n        vec3 N = normalize(vNormal);\n        vec3 V = invRot * normalize(-vViewPosition);\n        vec3 R = reflect(-V, N);\n        vec3 incident = getRadiance(R, 0.0);\n        float luminance = incident.r+incident.g+incident.b;\n        if(luminance > 4.0){\n            gl_FragColor = vec4(gamma(incident),1);\n        }\n        else{\n            gl_FragColor = vec4(0,0,0,1);\n        }\n    }\n\n    void main(){\n        //test();\n        \n        vec3 N = normalize(vNormal);\n        vec3 V = invRot * normalize(-vViewPosition);\n        vec3 R = reflect(-V, N);\n        \n        //vec3 baseColor = degamma(texture2D(textureBaseColor, vTexcoord).rgb);\n        vec3 baseColor = degamma(vec3(1));\n        vec3 ao = degamma(texture2D(textureAO, vTexcoord).rgb);\n        vec3 cavity = degamma(texture2D(textureCavity, vTexcoord).rgb);\n        vec3 shadow = degamma(texture2D(textureShadow, vTexcoord).rgb);\n\n        vec3 diffuseIncident = getDiffuse(N)*ao;\n        vec3 specularIncident1 = getRadiance(R, roughness1);\n        vec3 specularIncident2 = getRadiance(R, roughness2);\n\n        float f1 = getFresnel(N, V, fresnel1)*specularReflectance;\n        float f2 = getFresnel(N, V, fresnel2)*specularReflectance;\n\n        float f = mix(f1, f2, specularMix);\n\n        vec3 diffuseExcident = diffuseIncident*baseColor*diffuseReflectance*(1.0-f);\n        vec3 specularExcident1 = mix(specularIncident1, specularIncident1*baseColor, metallness1)*f1;\n        vec3 specularExcident2 = mix(specularIncident2, specularIncident2*baseColor, metallness2)*f2;\n        vec3 specularExcident = mix(specularExcident1, specularExcident2, specularMix);\n\n        vec3 excident = diffuseExcident+specularExcident+emissivity*baseColor;\n\n        gl_FragColor = vec4(gamma(excident),1);\n        //gl_FragColor = vec4(gamma(getRadiance(N, 1.0)),1);\n        //gl_FragColor = vec4(1,0,1,1);\n    }");
sys.defModule('/environment/hdr', function(exports, require, fs) {
  var resize, smoothstep;
  smoothstep = function(edge0, edge1, x) {
    x = (x - edge0) / (edge1 - edge0);
    x = Math.min(Math.max(0, x), 1);
    return x * x * x * (x * (x * 6 - 15) + 10);
  };
  resize = function(data, width, height, targetWidth, targetHeight) {
    var a, ab, ag, ar, aw, b, g, get, getNearest, kHeight, kMax, kWidth, kX, kY, l, put, r, result, startTime, weight, x, xRatio, y, yRatio, _i, _j, _k, _l, _ref;
    startTime = performance.now();
    xRatio = width / targetWidth;
    yRatio = height / targetHeight;
    kWidth = Math.ceil(xRatio / 2);
    kHeight = Math.ceil(yRatio / 2);
    kMax = Math.max(kWidth, kHeight);
    result = new Float32Array(targetWidth * targetHeight * 4);
    get = function(x, y) {
      x = Math.round(Math.min(Math.max(0, x), width - 1));
      y = Math.round(Math.min(Math.max(0, y), height - 1));
      return [data[(x + y * width) * 4 + 0], data[(x + y * width) * 4 + 1], data[(x + y * width) * 4 + 2], data[(x + y * width) * 4 + 3]];
    };
    put = function(x, y, r, g, b, a) {
      if (a == null) {
        a = 1;
      }
      result[(x + y * targetWidth) * 4 + 0] = r;
      result[(x + y * targetWidth) * 4 + 1] = g;
      result[(x + y * targetWidth) * 4 + 2] = b;
      return result[(x + y * targetWidth) * 4 + 3] = a;
    };
    getNearest = function(s, t) {
      return s = s * width;
    };
    for (y = _i = 0; 0 <= targetHeight ? _i < targetHeight : _i > targetHeight; y = 0 <= targetHeight ? ++_i : --_i) {
      for (x = _j = 0; 0 <= targetWidth ? _j < targetWidth : _j > targetWidth; x = 0 <= targetWidth ? ++_j : --_j) {
        ar = 0;
        ag = 0;
        ab = 0;
        aw = 0;
        for (kY = _k = -kHeight; -kHeight <= kHeight ? _k <= kHeight : _k >= kHeight; kY = -kHeight <= kHeight ? ++_k : --_k) {
          for (kX = _l = -kWidth; -kWidth <= kWidth ? _l <= kWidth : _l >= kWidth; kX = -kWidth <= kWidth ? ++_l : --_l) {
            l = Math.sqrt(kX * kX + kY * kY);
            weight = smoothstep(0, kMax, l);
            _ref = get((x + 0.5) * xRatio + kX, (y + 0.5) * yRatio + kY), r = _ref[0], g = _ref[1], b = _ref[2], a = _ref[3];
            ar += r * weight;
            ag += g * weight;
            ab += b * weight;
            aw += weight;
          }
        }
        ar /= aw;
        ag /= aw;
        ab /= aw;
        put(x, y, ar, ag, ab);
      }
    }
    console.log(performance.now() - startTime);
    return result;
  };
  exports.parse = function(array) {
    var b, component, e, find, g, getInt, getString, headerEnd, height, heightStart, i, idx, num, pixelCount, pop, r, rgba, rgbe, size, startTime, v, value, width, widthStart, x, y, _i, _j, _k, _l, _m, _ref;
    array = new Uint8Array(array);
    getString = function(index, length) {
      var i, result, _i;
      result = '';
      for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
        result += String.fromCharCode(array[index + i]);
      }
      return result;
    };
    find = function(index, str) {
      if (index == null) {
        index = 0;
      }
      while (getString(index, str.length) !== str && index < array.length) {
        index += 1;
      }
      if (index >= array.length) {
        return null;
      } else {
        return {
          start: index,
          end: index + str.length
        };
      }
    };
    getInt = function(index) {
      var result, start, str;
      start = index;
      result = '';
      str = getString(index, 1);
      while (str.match(/\d/)) {
        result += str;
        index += 1;
        str = getString(index, 1);
      }
      return {
        start: start,
        end: index + 1,
        result: parseInt(result, 10)
      };
    };
    headerEnd = find(0, '\n\n');
    heightStart = find(headerEnd.end, '-Y ');
    height = getInt(heightStart.end);
    widthStart = find(height.end, '+X ');
    width = getInt(widthStart.end);
    size = {
      x: width.result,
      y: height.result
    };
    rgbe = new Uint8Array(size.x * size.y * 4);
    idx = width.end;
    pop = function() {
      return array[idx++];
    };
    startTime = performance.now();
    for (y = _i = 0, _ref = size.y; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
      pop();
      pop();
      pop();
      pop();
      for (component = _j = 0; _j < 4; component = ++_j) {
        x = 0;
        while (x < size.x) {
          num = pop();
          if (num <= 128) {
            for (i = _k = 0; 0 <= num ? _k < num : _k > num; i = 0 <= num ? ++_k : --_k) {
              rgbe[(y * size.x + x) * 4 + component] = pop();
              x += 1;
            }
          } else {
            value = pop();
            num -= 128;
            for (i = _l = 0; 0 <= num ? _l < num : _l > num; i = 0 <= num ? ++_l : --_l) {
              rgbe[(y * size.x + x) * 4 + component] = value;
              x += 1;
            }
          }
        }
      }
    }
    pixelCount = size.x * size.y * 4;
    rgba = new Float32Array(pixelCount);
    for (i = _m = 0; _m < pixelCount; i = _m += 4) {
      r = rgbe[i + 0];
      g = rgbe[i + 1];
      b = rgbe[i + 2];
      e = rgbe[i + 3];
      v = Math.pow(2.0, e - 128.0) / 255.0;
      rgba[i + 0] = r * v;
      rgba[i + 1] = g * v;
      rgba[i + 2] = b * v;
      rgba[i + 3] = 1;
    }
    if (size.x <= 4096) {
      return {
        bytes: rgba,
        width: size.x,
        height: size.y
      };
    } else {
      return {
        bytes: resize(rgba, size.x, size.y, 4096, 2048),
        width: 4096,
        height: 2048
      };
    }
  };
  return exports;
});
sys.defFile("/environment/lookup.shader", "#file /environment/lookup.shader\nuniform sampler2D textureEnv;\nvec3 textureRectEnv(vec3 normal){\n    vec2 dir = normalize(normal.xz);\n    vec2 texcoord = vec2(\n        atan(-dir.x, -dir.y)/TAU+0.5,\n        acos(normal.y)/PI\n    );\n    return texture2D(textureEnv, texcoord).rgb;\n}");
sys.defModule('/environment/module', function(exports, require, fs) {
  var Environment, fileSystem, hdr;
  hdr = require('hdr');
  fileSystem = require('/file-system');
  exports = Environment = (function() {
    function Environment(app) {
      this.app = app;
      this.texture = this.app.fw.texture2D({
        width: 1,
        height: 1,
        filter: 'linear',
        clamp: 'edge',
        type: this.app.fw.usableFloat
      });
      this.lookup = fs.open('lookup.shader');
    }

    Environment.prototype.setUniformsOn = function(state) {
      return state.sampler('textureEnv', this.texture);
    };

    Environment.prototype.openHDR = function() {
      return fileSystem.read('.hdr', (function(_this) {
        return function(array, file) {
          var data, name;
          name = file.name.split('.');
          name.pop();
          _this.filename = name.join('.');
          data = hdr.parse(array);
          _this.texture.dataSized(data.bytes, data.width, data.height);
          return _this.app.emit('environment-update');
        };
      })(this));
    };

    return Environment;

  })();
  return exports;
});
sys.defModule('/events', function(exports, require, fs) {
  var Events;
  exports = Events = (function() {
    function Events() {
      this.handlers = {};
    }

    Events.prototype.on = function(name, callback) {
      var handlers, idx;
      handlers = this.handlers[name];
      if (handlers == null) {
        handlers = this.handlers[name] = [];
      }
      idx = handlers.indexOf(callback);
      if (idx === -1) {
        handlers.push(callback);
      } else {
        handlers.push(handlers.splice(idx, 1));
      }
      return this;
    };

    Events.prototype.off = function(nameOrCallback, callback) {
      var handlers, idx, name, _ref;
      if (typeof nameOrCallback === 'function') {
        name = null;
        callback = nameOrCallback;
      } else {
        name = nameOrCallback;
      }
      if ((name != null) && (callback != null)) {
        handlers = this.handlers[name];
        idx = handlers.indexOf(callback);
        if (idx !== -1) {
          handlers.splice(idx, 1);
        }
      } else if (name != null) {
        delete this.handlers[name];
      } else if (callback != null) {
        _ref = this.handlers;
        for (name in _ref) {
          handlers = _ref[name];
          idx = handlers.indexOf(callback);
          if (idx !== -1) {
            handlers.splice(idx, 1);
          }
        }
      }
      return this;
    };

    Events.prototype.emit = function(name, data) {
      var handler, handlers, _i, _len;
      handlers = this.handlers[name];
      if (handlers != null) {
        for (_i = 0, _len = handlers.length; _i < _len; _i++) {
          handler = handlers[_i];
          handler(data);
        }
      }
      return this;
    };

    return Events;

  })();
  return exports;
});
sys.defModule('/file-system', function(exports, require, fs) {
  var readImage, readText;
  readImage = function(entry, file, onLoad) {
    var reader;
    reader = new FileReader();
    reader.onload = function() {
      var blob, bytes, img, url;
      bytes = reader.result;
      blob = new Blob([bytes], {
        type: file.type
      });
      url = URL.createObjectURL(blob);
      img = new Image();
      img.onload = function() {
        entry.content = img;
        img.url = url;
        img.bytes = bytes;
        img.type = file.type;
        return onLoad();
      };
      return img.src = url;
    };
    return reader.readAsArrayBuffer(file);
  };
  readText = function(entry, file, onLoad) {
    var reader;
    reader = new FileReader();
    reader.onload = function() {
      entry.content = reader.result;
      return onLoad();
    };
    return reader.readAsText(file);
  };
  exports.readImage = function(onLoad) {
    var input;
    return input = $('<input type="file">').attr('accept', 'image/*').change((function(_this) {
      return function() {
        var entry, file;
        file = input.files[0];
        entry = {};
        return readImage(entry, file, function() {
          return onLoad(entry.content, file.name);
        });
      };
    })(this)).click()[0];
  };
  exports.read = function(accept, onLoad) {
    var input;
    return input = $('<input type="file">').attr('accept', accept).change((function(_this) {
      return function() {
        var file, reader;
        file = input.files[0];
        reader = new FileReader();
        reader.onload = function() {
          return onLoad(reader.result, file);
        };
        return reader.readAsArrayBuffer(file);
      };
    })(this)).click()[0];
  };
  exports.openDir = function(onLoad) {
    var input;
    return input = $('<input type="file" webkitdirectory="true">').change((function(_this) {
      return function() {
        var count, entry, ext, file, loaded, name, path, result, _i, _len, _ref, _ref1;
        result = [];
        count = 0;
        loaded = 0;
        _ref = input.files;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          path = (_ref1 = file.webkitRelativePath) != null ? _ref1 : file.name;
          ext = path.split('.').pop().toLowerCase();
          name = path.split('/').pop();
          entry = {
            path: path,
            ext: ext,
            type: file.type,
            name: name
          };
          result.push(entry);
          switch (ext) {
            case 'jpeg':
            case 'jpg':
            case 'png':
            case 'gif':
              count += 1;
              readImage(entry, file, function() {
                loaded += 1;
                if (loaded === count) {
                  return onLoad(result);
                }
              });
              break;
            case 'dae':
              count += 1;
              readText(entry, file, function() {
                loaded += 1;
                if (loaded === count) {
                  return onLoad(result);
                }
              });
          }
        }
        if (loaded === count) {
          return onLoad(result);
        }
      };
    })(this)).click()[0];
  };
  exports.save = function(name, data, mime) {
    var blob, event, link, url;
    if (mime == null) {
      mime = 'application/octet-stream';
    }
    if (data instanceof Blob) {
      blob = data;
    } else {
      blob = new Blob([data], {
        type: mime
      });
    }
    url = URL.createObjectURL(blob);
    link = document.createElement('a');
    link.download = name;
    link.href = url;
    event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, false, false, false, false, 0, null);
    return link.dispatchEvent(event);
  };
  return exports;
});
sys.defModule('/get-buffer', function(exports, require, fs) {
  exports = function(url, handlers) {
    var compressed, contentLength, entityLength, initiated, xhr;
    if (typeof handlers === 'function') {
      handlers = {
        load: handlers,
        init: function() {},
        progress: function() {}
      };
    }
    compressed = false;
    contentLength = null;
    entityLength = null;
    initiated = false;
    xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      return handlers.load(xhr.response);
    };
    xhr.onreadystatechange = function(event) {
      if (xhr.readyState === xhr.HEADERS_RECEIVED) {
        compressed = xhr.getResponseHeader('Content-Encoding') != null;
        contentLength = xhr.getResponseHeader('Content-Length');
        entityLength = xhr.getResponseHeader('X-Entity-Length');
        if (contentLength != null) {
          contentLength = parseFloat(contentLength);
        }
        if (entityLength != null) {
          return entityLength = parseFloat(entityLength);
        }
      }
    };
    xhr.onprogress = function(event) {
      var loaded, total;
      if (compressed) {
        if (entityLength != null) {
          loaded = event.loaded;
          total = entityLength;
        } else {
          total = null;
          loaded = null;
        }
      } else {
        if (event.lengthComputable) {
          loaded = event.loaded;
          total = event.total;
        } else {
          loaded = null;
          total = null;
        }
      }
      if (!initiated) {
        initiated = true;
        handlers.init(total);
      }
      if (loaded != null) {
        return handlers.progress(loaded);
      }
    };
    return xhr.send();
  };
  return exports;
});
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

sys.defModule('/module', function(exports, require, fs) {
  var Accumulators, Application, Camera, Chart, Environment, Events, Samples, WebGL, compression, display, fileSystem, getBuffer, sphere;
  WebGL = require('webgl');
  Environment = require('environment');
  Accumulators = require('accumulator');
  Events = require('events');
  Camera = require('camera');
  Samples = require('samples');
  Chart = require('chart');
  compression = require('compression');
  sphere = require('sphere');
  getBuffer = require('get-buffer');
  fileSystem = require('/file-system');
  Application = (function() {
    function Application() {
      this.update = __bind(this.update, this);
      this.fw = new WebGL();
      $(this.fw.canvas).appendTo('body');
      this.hub = new Events();
      this.camera = new Camera(this);
      this.samples = new Samples(this);
      this.environment = new Environment(this);
      this.accumulators = new Accumulators(this);
      this.chart = new Chart();
      this.params = {};
      $('<button>Open HDR</button>').css({
        position: 'absolute',
        top: 10,
        left: 10
      }).appendTo('body').click((function(_this) {
        return function() {
          return _this.environment.openHDR();
        };
      })(this));
      $('<button>Save</button>').css({
        position: 'absolute',
        top: 30,
        left: 10
      }).appendTo('body').click((function(_this) {
        return function() {
          return _this.save();
        };
      })(this));
      this.addSlider('diffuseReflectance', 50 + 0 * 20);
      this.addSlider('specularReflectance', 50 + 1 * 20);
      this.addSlider('specularMix', 50 + 2 * 20);
      this.addSlider('emissivity', 50 + 3 * 20);
      this.addSlider('roughness1', 50 + 5 * 20);
      this.addSlider('fresnel1', 50 + 6 * 20);
      this.addSlider('metallness1', 50 + 7 * 20);
      this.addSlider('roughness2', 50 + 9 * 20);
      this.addSlider('fresnel2', 50 + 10 * 20);
      this.addSlider('metallness2', 50 + 11 * 20);
      this.addSlider('exposure', 50 + 13 * 20, -1, 1);
      getBuffer('model.bin', (function(_this) {
        return function(data) {
          return _this.display = _this.fw.state({
            shader: [fs.open('octahedral.shader'), fs.open('display.shader')],
            vertexbuffer: {
              pointers: [
                {
                  name: 'position',
                  size: 3
                }, {
                  name: 'texcoord',
                  size: 2
                }, {
                  name: 'normal',
                  size: 3
                }
              ],
              vertices: data
            },
            depthTest: true
          });
        };
      })(this));
      this.baseColor = this.fw.texture2D({
        filter: 'linear',
        width: 1,
        height: 1
      }).loadImage('images/base-color.png', true);
      this.ao = this.fw.texture2D({
        filter: 'linear',
        width: 1,
        height: 1
      }).loadImage('images/ao.png', true);
      this.cavity = this.fw.texture2D({
        filter: 'linear',
        width: 1,
        height: 1
      }).loadImage('images/cavity.png', true);
      this.shadow = this.fw.texture2D({
        filter: 'linear',
        width: 1,
        height: 1
      }).loadImage('images/shadow.png', true);
      this.update();
    }

    Application.prototype.addSlider = function(name, top, min, max, value) {
      var row;
      if (min == null) {
        min = 0;
      }
      if (max == null) {
        max = 1;
      }
      if (value == null) {
        value = 0;
      }
      row = $('<div></div>').appendTo('body').css({
        position: 'absolute',
        left: 20,
        top: top
      });
      $('<label></label>').text(name).css({
        color: 'black',
        display: 'inline-block',
        width: 100
      }).appendTo(row);
      return this.params[name] = $('<input type="range" step="0.001">').attr({
        min: min,
        max: max,
        value: value
      }).css({
        width: 300
      }).appendTo(row)[0];
    };

    Application.prototype.getParams = function() {
      var input, name, result, _ref;
      result = {};
      _ref = this.params;
      for (name in _ref) {
        input = _ref[name];
        result[name] = parseFloat(input.value);
      }
      return result;
    };

    Application.prototype.update = function() {
      var name, params, value, _, _i;
      if (this.display != null) {
        this.fw.frameStart();
        this.camera.update();
        for (_ = _i = 0; _i < 1; _ = ++_i) {
          this.samples.generate();
          this.accumulators.update();
        }
        params = this.getParams();
        params.exposure = Math.pow(2, params.exposure * 5);
        for (name in params) {
          value = params[name];
          this.display.float(name, value);
        }
        this.display.uniformSetter(this.camera).sampler('textureRadiance', this.accumulators.specular).vec2('radianceSize', this.accumulators.specular.width(), this.accumulators.specular.height()).sampler('textureBaseColor', this.baseColor).sampler('textureAO', this.ao).sampler('textureCavity', this.cavity).sampler('textureShadow', this.shadow).vec2('offset', 0, 0).draw();

        /*
            
        for x in [0..10]
            @display
                .vec2('offset', (x-5)*2.2, 0)
                .float('roughness', x/10)
                .draw()
         */
        this.fw.frameEnd();
      }
      this.updateChart();
      return requestAnimationFrame(this.update);
    };

    Application.prototype.on = function(name, callback) {
      return this.hub.on(name, callback);
    };

    Application.prototype.emit = function(name, data) {
      return this.hub.emit(name, data);
    };

    Application.prototype.doUpdateChart = function() {
      var avgs;
      avgs = this.accumulators.getAvg();
      return this.chart.update(avgs);
    };

    Application.prototype.updateChart = function() {
      if (this.lastChartUpdate != null) {
        if (performance.now() - this.lastChartUpdate > 100) {
          this.lastChartUpdate = performance.now();
          return this.doUpdateChart();
        }
      } else {
        this.lastChartUpdate = performance.now();
        return this.doUpdateChart();
      }
    };

    Application.prototype.save = function() {
      var avgs, exposure, params, result, slice, _i, _len, _ref;
      params = this.getParams();
      exposure = Math.pow(2, params.exposure * 5);
      result = [];
      avgs = this.accumulators.getAvg();
      _ref = this.accumulators.save(exposure);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        slice = _ref[_i];
        result.push(compression.compress(slice));
      }
      result = JICKLE.encode(result);
      return fileSystem.save("" + this.environment.filename + "-" + (exposure.toFixed(2)) + ".env", result);
    };

    return Application;

  })();
  $(function() {
    var app;
    return app = new Application();
  });
  display = function(data, size) {
    var b, canvas, ctx, e, g, i, image, imageData, pixels, r, saturate, _i;
    saturate = function(value) {
      if (value < 0) {
        return 0;
      } else if (value > 1) {
        return 1;
      } else {
        return value;
      }
    };
    canvas = $('<canvas></canvas>').appendTo('body').css({
      width: size,
      height: size,
      position: 'absolute',
      backgroundColor: 'red',
      zIndex: 1,
      top: 0,
      left: 0
    })[0];
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext('2d');
    imageData = ctx.getImageData(0, 0, size, size);
    image = imageData.data;
    e = 1.0;
    pixels = size * size;
    for (i = _i = 0; 0 <= pixels ? _i < pixels : _i > pixels; i = 0 <= pixels ? ++_i : --_i) {
      r = Math.round(saturate(data[i * 3 + 0] * e) * 255);
      g = Math.round(saturate(data[i * 3 + 1] * e) * 255);
      b = Math.round(saturate(data[i * 3 + 2] * e) * 255);
      image[i * 4 + 0] = r;
      image[i * 4 + 1] = g;
      image[i * 4 + 2] = b;
      image[i * 4 + 3] = 255;
    }
    return ctx.putImageData(imageData, 0, 0);
  };
  return exports;
});
sys.defFile("/octahedral.shader", "#file /octahedral.shader\n#define sectorize(value) step(0.0, (value))*2.0-1.0\n#define sum(value) dot(clamp((value), 1.0, 1.0), (value))\n#define PI 3.141592653589793\n\nvec2 normalToUvRectOct(vec3 normal){\n    normal /= sum(abs(normal));\n    if(normal.y > 0.0){\n        return normal.xz*0.5+0.5;\n    }\n    else{\n        vec2 suv = sectorize(normal.xz);\n        vec2 uv = suv-suv*abs(normal.zx);\n        return uv*0.5+0.5;\n    }\n}\n\nvec3 uvToNormalRectOct(vec2 uv){\n    uv = uv*2.0-1.0;\n    vec2 auv = abs(uv);\n    vec2 suv = sectorize(uv);\n    float l = sum(auv);\n\n    if(l > 1.0){\n        uv = (1.0-auv.ts)*suv;\n    }\n\n    return normalize(vec3(uv.s,1.0-l,uv.t));\n}\n\nvec2 normalToUvSphOct(vec3 normal){\n    normal = normalize(normal);\n    vec3 aNorm = abs(normal);\n    vec3 sNorm = sectorize(normal);\n\n    vec2 dir = max(aNorm.xz, 1e-20);\n    float orient = atan(dir.x, dir.y)/(PI*0.5);\n\n    dir = max(vec2(aNorm.y, length(aNorm.xz)), 1e-20);\n    float pitch = atan(dir.y, dir.x)/(PI*0.5);\n\n    vec2 uv = vec2(sNorm.x*orient, sNorm.z*(1.0-orient))*pitch;\n\n    if(normal.y < 0.0){\n        uv = sNorm.xz - abs(uv.ts)*sNorm.xz;\n    }\n    return uv*0.5+0.5;\n}\n\nvec3 uvToNormalSphOct(vec2 uv){\n    uv = uv*2.0-1.0;\n    vec2 suv = sectorize(uv);\n    float pitch = sum(abs(uv))*PI*0.5;\n\n    if(sum(abs(uv)) > 1.0){\n        uv = (1.0-abs(uv.ts))*suv;\n    }\n\n    float orient = (abs(uv.s)/sum(abs(uv)))*PI*0.5;\n    float sOrient = sin(orient);\n    float cOrient = cos(orient);\n    float sPitch = sin(pitch);\n    float cPitch = cos(pitch);\n\n    return vec3(\n        sOrient*suv.s*sPitch,\n        cPitch,\n        cOrient*suv.t*sPitch\n    );\n}\n\n#define uvToNormal uvToNormalSphOct\n#define normalToUv normalToUvSphOct\n//#define uvToNormal uvToNormalRectOct\n//#define normalToUv normalToUvRectOct");
sys.defModule('/samples', function(exports, require, fs) {
  var Halton2D, Samples, halton, rnd;
  rnd = function() {
    return ROT.RNG.getUniform();
  };
  halton = function(i, base) {
    var f, result;
    result = 0;
    f = 1 / base;
    while (i > 0) {
      result = result + f * (i % base);
      i = Math.floor(i / base);
      f = f / base;
    }
    return result;
  };
  Halton2D = (function() {
    function Halton2D(baseX, baseY, i) {
      this.baseX = baseX != null ? baseX : 2;
      this.baseY = baseY != null ? baseY : 3;
      this.i = i != null ? i : 100;
      this.initial = this.i;
    }

    Halton2D.prototype.get = function(index) {
      var i, x, y;
      i = index != null ? index : this.i;
      x = halton(i, this.baseX);
      y = halton(i, this.baseY);
      if (index == null) {
        this.i += 1;
      }
      return [x, y];
    };

    Halton2D.prototype.index = function() {
      return this.i;
    };

    Halton2D.prototype.reset = function() {
      return this.i = this.initial;
    };

    return Halton2D;

  })();
  exports = Samples = (function() {
    function Samples(app) {
      var num;
      this.app = app;
      num = 50;
      this.samples = new Float32Array(num * 2);
      this.hIndex = 0;
      this.app.on('environment-update', (function(_this) {
        return function() {
          return _this.hIndex = 0;
        };
      })(this));
    }

    Samples.prototype.randomVec = function(idx) {
      this.samples[idx + 0] = rnd();
      return this.samples[idx + 1] = rnd();
    };

    Samples.prototype.haltonVec = function(idx) {
      this.samples[idx + 0] = halton(this.hIndex, 2);
      this.samples[idx + 1] = halton(this.hIndex, 3);
      return this.hIndex += 1;
    };

    Samples.prototype.generate = function() {
      var i, _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.samples.length; _i < _ref; i = _i += 2) {
        _results.push(this.randomVec(i));
      }
      return _results;
    };

    Samples.prototype.data = function() {
      return this.samples;
    };

    return Samples;

  })();
  return exports;
});
sys.defModule('/sphere', function(exports, require, fs) {
  var dump, faces, icosahedron, midp, normalize, octahedron, phi, pi, sphere, subdivide, v1, v10, v11, v12, v2, v3, v4, v5, v6, v7, v8, v9, vxm, vxp, vym, vyp, vzm, vzp;
  pi = Math.PI;
  midp = function(v1, v2) {
    var x1, x2, x3, y1, y2, y3, z1, z2, z3;
    x1 = v1[0];
    y1 = v1[1];
    z1 = v1[2];
    x2 = v2[0];
    y2 = v2[1];
    z2 = v2[2];
    x3 = (x1 + x2) / 2;
    y3 = (y1 + y2) / 2;
    z3 = (z1 + z2) / 2;
    return [x3, y3, z3];
  };
  normalize = function(faces, r) {
    var face, l, new_face, result, vertex, x, y, z, _i, _j, _len, _len1;
    if (r == null) {
      r = 1;
    }
    result = [];
    for (_i = 0, _len = faces.length; _i < _len; _i++) {
      face = faces[_i];
      new_face = [];
      result.push(new_face);
      for (_j = 0, _len1 = face.length; _j < _len1; _j++) {
        vertex = face[_j];
        x = vertex[0];
        y = vertex[1];
        z = vertex[2];
        l = Math.sqrt(x * x + y * y + z * z);
        new_face.push([(r * x) / l, (r * y) / l, (r * z) / l]);
      }
    }
    return result;
  };
  subdivide = function(faces) {
    var face, result, v0, v1, v2, va, vb, vc, _i, _len;
    result = [];
    for (_i = 0, _len = faces.length; _i < _len; _i++) {
      face = faces[_i];
      v0 = face[0];
      v1 = face[1];
      v2 = face[2];
      va = midp(v0, v1);
      vb = midp(v1, v2);
      vc = midp(v2, v0);
      result.push([v0, va, vc], [va, v1, vb], [vc, vb, v2], [va, vb, vc]);
    }
    return result;
  };
  phi = (1 + Math.sqrt(5)) / 2;
  v1 = [1, phi, 0];
  v2 = [-1, phi, 0];
  v3 = [0, 1, phi];
  v4 = [0, 1, -phi];
  v5 = [phi, 0, 1];
  v6 = [-phi, 0, 1];
  v7 = [-phi, 0, -1];
  v8 = [phi, 0, -1];
  v9 = [0, -1, phi];
  v10 = [0, -1, -phi];
  v11 = [-1, -phi, 0];
  v12 = [1, -phi, 0];
  faces = [[v1, v2, v3], [v2, v1, v4], [v1, v3, v5], [v2, v6, v3], [v2, v7, v6], [v2, v4, v7], [v1, v5, v8], [v1, v8, v4], [v9, v3, v6], [v3, v9, v5], [v4, v10, v7], [v4, v8, v10], [v6, v7, v11], [v6, v11, v9], [v7, v10, v11], [v5, v12, v8], [v12, v5, v9], [v12, v10, v8], [v11, v12, v9], [v12, v11, v10]];
  icosahedron = normalize(faces);
  vxp = [1, 0, 0];
  vxm = [-1, 0, 0];
  vyp = [0, 1, 0];
  vym = [0, -1, 0];
  vzp = [0, 0, 1];
  vzm = [0, 0, -1];
  faces = [[vzp, vxp, vyp], [vxm, vzp, vyp], [vyp, vxp, vzm], [vyp, vzm, vxm], [vym, vxp, vzp], [vym, vzp, vxm], [vzm, vxp, vym], [vxm, vzm, vym]];
  octahedron = normalize(faces);
  dump = function(faces) {
    var face, l, result, vertex, x, y, z, _i, _j, _len, _len1;
    result = [];
    for (_i = 0, _len = faces.length; _i < _len; _i++) {
      face = faces[_i];
      for (_j = 0, _len1 = face.length; _j < _len1; _j++) {
        vertex = face[_j];
        x = vertex[0];
        y = vertex[1];
        z = vertex[2];
        l = Math.sqrt(x * x + y * y + z * z);
        result.push(x, y, z, x / l, y / l, z / l);
      }
    }
    return result;
  };
  sphere = function(template, subdivisions) {
    var i, _i;
    if (subdivisions == null) {
      subdivisions = 3;
    }
    for (i = _i = 0; 0 <= subdivisions ? _i < subdivisions : _i > subdivisions; i = 0 <= subdivisions ? ++_i : --_i) {
      template = subdivide(template);
      template = normalize(template);
    }
    return template;
  };
  exports.octahedron = function(subdivisions) {
    var result;
    result = sphere(octahedron, subdivisions);
    return dump(normalize(result));
  };
  exports.icosahedron = function(subdivisions) {
    var result;
    result = sphere(icosahedron, subdivisions);
    return dump(normalize(result));
  };
  return exports;
});
sys.defModule('/test', function(exports, require, fs) {
  $(function() {
    var PI, PIH, S2, TAU, abs, acos, asin, atan2, avgDist, canvas, clamp, cos, ctx, distance, dot, drawError, drawGrid, drawMeridians, drawNormals, gradient, linstep, map, mapRect, mapSphere, mix, mix2, normalize, pow, sh, sign, sin, size, sqrt, step, unmap, unmapRect, unmapSphere;
    canvas = $('<canvas></canvas>').appendTo('body')[0];
    size = 800;
    sh = size / 2;
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext('2d');
    drawGrid = function() {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sh, 0);
      ctx.lineTo(0, sh);
      ctx.lineTo(sh, size);
      ctx.lineTo(size, sh);
      ctx.lineTo(sh, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, sh + 0.5);
      ctx.lineTo(size, sh + 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sh + 0.5, 0);
      ctx.lineTo(sh + 0.5, size);
      return ctx.stroke();
    };
    abs = Math.abs;
    sign = function(value) {
      if (value < 0) {
        return -1;
      } else {
        return 1;
      }
    };
    sqrt = Math.sqrt;
    pow = Math.pow;
    acos = Math.acos;
    cos = Math.cos;
    asin = Math.asin;
    sin = Math.sin;
    atan2 = Math.atan2;
    PI = Math.PI;
    PIH = PI / 2;
    TAU = PI * 2;
    S2 = 1.41421356237309514547;
    clamp = function(value, low, high) {
      if (value < low) {
        return low;
      } else if (value > high) {
        return high;
      } else {
        return value;
      }
    };
    linstep = function(edge0, edge1, value) {
      return clamp((value - edge0) / (edge1 - edge0), 0, 1);
    };
    dot = function(s, t, r, g, b) {
      var x, y;
      x = s * size;
      y = t * size;
      ctx.fillStyle = "rgba(" + ((r * 255).toFixed(0)) + "," + ((g * 255).toFixed(0)) + "," + ((b * 255).toFixed(0)) + ",1)";
      ctx.beginPath();
      ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      return ctx.fill();
    };
    step = function(edge, value) {
      if (value < edge) {
        return -1;
      } else {
        return 1;
      }
    };
    mix = function(v0, v1, a) {
      return v0 * (1 - a) + v1 * a;
    };
    mix2 = function(_arg, _arg1, a) {
      var x0, x1, y0, y1;
      x0 = _arg[0], y0 = _arg[1];
      x1 = _arg1[0], y1 = _arg1[1];
      return [mix(x0, x1, a), mix(y0, y1, a)];
    };
    mapRect = function(x, y, z) {
      var l, sx, sz;
      l = abs(x) + abs(y) + abs(z);
      x /= l;
      y /= l;
      z /= l;
      if (y > 0) {
        return [x, z];
      } else {
        sx = sign(x);
        sz = sign(z);
        return [sx - sx * abs(z), sz - sz * abs(x)];
      }
    };
    normalize = function(_arg) {
      var l, x, y, z;
      x = _arg[0], y = _arg[1], z = _arg[2];
      l = sqrt(x * x + y * y + z * z);
      return [x / l, y / l, z / l];
    };
    unmapRect = function(s, t) {
      var l, sx, sz, x, y, z;
      s = s * 2 - 1;
      t = t * 2 - 1;
      l = abs(s) + abs(t);
      if (l < 1) {
        x = s;
        z = t;
        y = 1 - l;
      } else {
        sx = sign(s);
        sz = sign(t);
        x = sx * abs(t - sz);
        z = sz * abs(s - sx);
        y = abs(x) + abs(z) - 1;
      }
      return normalize([x, y, z]);
    };
    mapSphere = function(x, y, z) {
      var e, o, s, t;
      o = acos(abs(z) / sqrt(x * x + z * z)) / PIH;
      e = acos(abs(y)) / PIH;
      s = sign(x) * o * e;
      t = sign(z) * (1 - o) * e;
      if (y > 0) {
        return [s, t];
      } else {
        return [sign(x) - abs(t) * sign(x), sign(z) - abs(s) * sign(z)];
      }
    };
    unmapSphere = function(s, t) {
      var e, o, x, y, z;
      s = s * 2 - 1;
      t = t * 2 - 1;
      if (abs(s) + abs(t) < 1) {
        x = s;
        z = t;
      } else {
        x = (1 - abs(t)) * sign(s);
        z = (1 - abs(s)) * sign(t);
      }
      o = (abs(x) / (abs(x) + abs(z))) * PIH;
      e = ((abs(s) + abs(t)) / 2.0) * PI;
      x = sin(o) * sign(s) * sin(e);
      y = cos(e);
      z = cos(o) * sign(t) * sin(e);
      return [x, y, z];
    };
    map = mapSphere;
    unmap = unmapSphere;
    drawMeridians = function() {
      var e, o, s, t, x, y, z, _i, _j, _k, _ref, _results;
      for (e = _i = 0; _i <= 180; e = _i += 0.25) {
        e = (e / 180) * Math.PI;
        y = Math.cos(e);
        for (o = _j = 0; _j <= 360; o = _j += 10) {
          o = (o / 360) * Math.PI * 2;
          x = Math.sin(o) * Math.sin(e);
          z = Math.cos(o) * Math.sin(e);
          _ref = map(x, y, z), s = _ref[0], t = _ref[1];
          dot(s * 0.5 + 0.5, t * 0.5 + 0.5, x * 0.5 + 0.5, y * 0.5 + 0.5, z * 0.5 + 0.5);
        }
      }
      _results = [];
      for (e = _k = 0; _k <= 180; e = _k += 10) {
        e = (e / 180) * Math.PI;
        y = Math.cos(e);
        _results.push((function() {
          var _l, _ref1, _results1;
          _results1 = [];
          for (o = _l = 0; _l <= 360; o = _l += 0.25) {
            o = (o / 360) * Math.PI * 2;
            x = Math.sin(o) * Math.sin(e);
            z = Math.cos(o) * Math.sin(e);
            _ref1 = map(x, y, z), s = _ref1[0], t = _ref1[1];
            _results1.push(dot(s * 0.5 + 0.5, t * 0.5 + 0.5, x * 0.5 + 0.5, y * 0.5 + 0.5, z * 0.5 + 0.5));
          }
          return _results1;
        })());
      }
      return _results;
    };
    drawNormals = function() {
      var data, idx, imageData, s, t, x, xn, y, yn, zn, _i, _j, _ref;
      imageData = ctx.getImageData(0, 0, size, size);
      data = imageData.data;
      for (y = _i = 0; 0 <= size ? _i < size : _i > size; y = 0 <= size ? ++_i : --_i) {
        for (x = _j = 0; 0 <= size ? _j < size : _j > size; x = 0 <= size ? ++_j : --_j) {
          idx = (x + y * size) * 4;
          s = (x + 0.5) / size;
          t = (y + 0.5) / size;
          _ref = unmap(s, t), xn = _ref[0], yn = _ref[1], zn = _ref[2];
          data[idx + 0] = (xn * 0.5 + 0.5) * 255;
          data[idx + 1] = (yn * 0.5 + 0.5) * 255;
          data[idx + 2] = (zn * 0.5 + 0.5) * 255;
          data[idx + 3] = 255;
        }
      }
      return ctx.putImageData(imageData, 0, 0);
    };
    distance = function(_arg, _arg1) {
      var x, x0, x1, y, y0, y1, z, z0, z1;
      x0 = _arg[0], y0 = _arg[1], z0 = _arg[2];
      x1 = _arg1[0], y1 = _arg1[1], z1 = _arg1[2];
      x = x1 - x0;
      y = y1 - y0;
      z = z1 - z0;
      return sqrt(x * x + y * y + z * z);
    };
    gradient = function(value) {
      value = clamp(value, 0, 1);
      return [value, 0, 1 - value];
    };
    drawError = function() {
      var avg, avgError, b, count, d0, d1, d2, d3, data, dist, error, g, idx, imageData, maxError, minError, n00, n01, n10, n11, r, s0, s1, t0, t1, x, y, _i, _j, _ref, _ref1, _ref2;
      avg = avgDist();
      imageData = ctx.getImageData(0, 0, size, size);
      data = imageData.data;
      avgError = 0;
      count = 0;
      for (y = _i = 0, _ref = size - 1; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
        for (x = _j = 0, _ref1 = size - 1; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
          idx = (x + y * size) * 4;
          s0 = (x + 0.5) / size;
          t0 = (y + 0.5) / size;
          s1 = (x + 1.5) / size;
          t1 = (y + 1.5) / size;
          n00 = unmap(s0, t0);
          n10 = unmap(s1, t0);
          n01 = unmap(s0, t1);
          n11 = unmap(s1, t1);
          d0 = distance(n00, n10);
          d1 = distance(n00, n01);
          d2 = distance(n01, n11);
          d3 = distance(n10, n11);
          dist = (d0 + d1 + d2 + d3) / 4;
          error = (dist - avg) * 200;
          avgError += abs(error);
          if (typeof minError !== "undefined" && minError !== null) {
            minError = Math.min(minError, abs(error));
            maxError = Math.max(maxError, abs(error));
          } else {
            minError = abs(error);
            maxError = abs(error);
          }
          count += 1;
          _ref2 = gradient(error + 0.5), r = _ref2[0], g = _ref2[1], b = _ref2[2];
          data[idx + 0] = r * 255;
          data[idx + 1] = g * 255;
          data[idx + 2] = b * 255;
          data[idx + 3] = 255;
        }
      }
      console.log(avgError / count, minError, maxError);
      return ctx.putImageData(imageData, 0, 0);
    };
    avgDist = function() {
      var count, dist, idx, n00, n01, n10, n11, s0, s1, t0, t1, x, y, _i, _j, _ref, _ref1;
      dist = 0;
      count = 0;
      for (y = _i = 0, _ref = size - 1; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
        for (x = _j = 0, _ref1 = size - 1; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
          idx = (x + y * size) * 4;
          s0 = (x + 0.5) / size;
          t0 = (y + 0.5) / size;
          s1 = (x + 1.5) / size;
          t1 = (y + 1.5) / size;
          n00 = unmap(s0, t0);
          n10 = unmap(s1, t0);
          n01 = unmap(s0, t1);
          n11 = unmap(s1, t1);
          dist += distance(n00, n10);
          dist += distance(n00, n01);
          dist += distance(n01, n11);
          dist += distance(n10, n11);
          count += 4;
        }
      }
      return dist / count;
    };
    drawNormals();
    drawMeridians();
    return drawError();
  });
  return exports;
});
sys.defFile("/webgl/blit.shader", "#file /webgl/blit.shader\nvarying vec2 texcoord;\n\nvertex:\n    attribute vec2 position;\n    uniform vec2 viewport;\n\n    void main(){\n        texcoord = position*0.5+0.5;\n        gl_Position = vec4(position, 0, 1);\n    }\n\nfragment:\n    uniform sampler2D source;\n    uniform float scale;\n\n    void main(){\n        gl_FragColor.rgb = pow(texture2D(source, texcoord*scale).rgb, vec3(1.0/2.2));\n        gl_FragColor.a = 1.0;\n    }");
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

sys.defModule('/webgl/framebuffer', function(exports, require, fs) {
  var Depthbuffer, Framebuffer, FramebufferCube, Renderbuffer, texture;
  texture = require('texture');
  exports.Framebuffer = Framebuffer = (function() {
    function Framebuffer(gf, params) {
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      this.gl = this.gf.gl;
      this.buffer = this.gl.createFramebuffer();
    }

    Framebuffer.prototype.generateMipmap = function() {
      return this.colorTexture.generateMipmap();
    };

    Framebuffer.prototype.anisotropy = function() {
      return this.colorTexture.anisotropy();
    };

    Framebuffer.prototype.bind = function(unit) {
      if (unit == null) {
        unit = 0;
      }
      return this.colorTexture.bind(unit);
    };

    Framebuffer.prototype.check = function() {
      var result;
      result = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
      switch (result) {
        case this.gl.FRAMEBUFFER_UNSUPPORTED:
          throw 'Framebuffer is unsupported';
          break;
        case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
          throw 'Framebuffer incomplete attachment';
          break;
        case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
          throw 'Framebuffer incomplete dimensions';
          break;
        case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
          throw 'Framebuffer incomplete missing attachment';
      }
      return this;
    };

    Framebuffer.prototype.unuse = function() {
      if (this.gf.currentFramebuffer != null) {
        this.gf.currentFramebuffer = null;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      }
      return this;
    };

    return Framebuffer;

  })();
  exports.Framebuffer2D = Framebuffer = (function(_super) {
    __extends(Framebuffer, _super);

    function Framebuffer(gf, params) {
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      Framebuffer.__super__.constructor.call(this, this.gf, params);
      if (params.color != null) {
        if (params.color instanceof texture.Texture) {
          this.color(params.color);
          this.ownColor = false;
        } else {
          this.color(this.gf.texture2D(params.color));
          this.ownColor = true;
        }
      } else {
        this.ownColor = false;
      }
      if (params.depth != null) {
        this.depth(params.depth);
      }
    }

    Framebuffer.prototype.color = function(colorTexture) {
      this.colorTexture = colorTexture;
      this.use();
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.colorTexture.target, this.colorTexture.handle, 0);
      this.check();
      this.unuse();
      return this;
    };

    Framebuffer.prototype.depth = function(param) {
      if (param instanceof exports.Depthbuffer) {
        this.depthbuffer = param;
      } else {
        this.depthbuffer = new exports.Depthbuffer(this.gf);
      }
      if (this.colorTexture != null) {
        this.depthbuffer.setSize(this.colorTexture.width, this.colorTexture.height);
      } else {
        throw Error('unimplemented');
      }
      this.use();
      this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthbuffer.id);
      this.check();
      return this;
    };

    Framebuffer.prototype.use = function() {
      if (this.gf.currentFramebuffer !== this) {
        this.gf.currentFramebuffer = this;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.buffer);
      }
      return this;
    };

    Framebuffer.prototype.viewport = function(width, height) {
      if (width == null) {
        width = this.colorTexture.width;
      }
      if (height == null) {
        height = this.colorTexture.height;
      }
      return this.gl.viewport(0, 0, width, height);
    };

    Framebuffer.prototype.destroy = function() {
      this.gl.deleteFramebuffer(this.buffer);
      if (this.ownColor) {
        this.color.destroy();
      }
      if (this.depthbuffer != null) {
        this.depthbuffer.destroy();
      }
      return this;
    };

    Framebuffer.prototype.setSize = function(width, height) {
      if (this.colorTexture != null) {
        this.colorTexture.size(width, height);
      }
      if (this.depthbuffer != null) {
        return this.depthbuffer.setSize(width, height);
      }
    };

    Framebuffer.prototype.width = function() {
      if (this.colorTexture != null) {
        return this.colorTexture.width;
      } else if (this.depthbuffer) {
        return this.depthbuffer.width;
      } else {
        throw Error('unimplemented');
      }
    };

    Framebuffer.prototype.height = function() {
      if (this.colorTexture != null) {
        return this.colorTexture.height;
      } else if (this.depthbuffer) {
        return this.depthbuffer.height;
      } else {
        throw Error('unimplemented');
      }
    };

    Framebuffer.prototype.blit = function() {
      if (this.colorTexture != null) {
        return this.colorTexture.draw();
      } else {
        throw Error('unimplemented');
      }
    };

    Framebuffer.prototype.readPixels = function(x, y, width, height) {
      var result, type;
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      if (width == null) {
        width = this.colorTexture.width;
      }
      if (height == null) {
        height = this.colorTexture.height;
      }
      type = this.colorTexture.type;
      if (type === this.gl.UNSIGNED_BYTE) {
        result = new Uint8Array(width * height * 4);
      } else if (type = this.gl.FLOAT) {
        result = new Float32Array(width * height * 4);
      } else {
        throw new Error('unsupported read type: ' + type);
      }
      this.use();
      this.gl.readPixels(x, y, width, height, this.gl.RGBA, type, result);
      return result;
    };

    Framebuffer.prototype.sizeEqual = function(width, height) {
      if (width !== this.width()) {
        return false;
      }
      if (height !== this.height()) {
        return false;
      }
      return true;
    };

    return Framebuffer;

  })(exports.Framebuffer);
  exports.FramebufferCube = FramebufferCube = (function(_super) {
    __extends(FramebufferCube, _super);

    function FramebufferCube(gf, params) {
      var color;
      this.gf = gf;
      FramebufferCube.__super__.constructor.call(this, this.gf, params);
      this.negativeX = new exports.Framebuffer2D(this.gf);
      this.negativeY = new exports.Framebuffer2D(this.gf);
      this.negativeZ = new exports.Framebuffer2D(this.gf);
      this.positiveX = new exports.Framebuffer2D(this.gf);
      this.positiveY = new exports.Framebuffer2D(this.gf);
      this.positiveZ = new exports.Framebuffer2D(this.gf);
      this.currentSide = this.negativeX;
      color = params.color;
      if (color != null) {
        if (params.color instanceof texture.Texture) {
          this.color(params.color);
        } else {
          this.color(this.gf.textureCube(params.color));
        }
      }
    }

    FramebufferCube.prototype.color = function(colorTexture) {
      this.colorTexture = colorTexture;
      this.negativeX.color(this.colorTexture.negativeX);
      this.negativeY.color(this.colorTexture.negativeY);
      this.negativeZ.color(this.colorTexture.negativeZ);
      this.positiveX.color(this.colorTexture.positiveX);
      this.positiveY.color(this.colorTexture.positiveY);
      return this.positiveZ.color(this.colorTexture.positiveZ);
    };

    FramebufferCube.prototype.destroy = function() {
      this.negativeX.destroy();
      this.negativeY.destroy();
      this.negativeZ.destroy();
      this.positiveX.destroy();
      this.positiveY.destroy();
      return this.positiveZ.destroy();
    };

    FramebufferCube.prototype.cubeSide = function(name) {
      return this.currentSide = this[name];
    };

    FramebufferCube.prototype.use = function() {
      return this.currentSide.use();
    };

    FramebufferCube.prototype.viewport = function(width, height) {
      if (width == null) {
        width = this.colorTexture.size;
      }
      if (height == null) {
        height = this.colorTexture.size;
      }
      return this.gl.viewport(0, 0, width, height);
    };

    return FramebufferCube;

  })(exports.Framebuffer);
  exports.Renderbuffer = Renderbuffer = (function() {
    function Renderbuffer(gf) {
      this.gf = gf;
      this.gl = this.gf.gl;
      this.id = this.gl.createRenderbuffer();
    }

    Renderbuffer.prototype.bind = function() {
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.id);
      return this;
    };

    Renderbuffer.prototype.setSize = function(width, height) {
      this.width = width;
      this.height = height;
      this.bind();
      this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl[this.format], this.width, this.height);
      return this.unbind();
    };

    Renderbuffer.prototype.unbind = function() {
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
      return this;
    };

    Renderbuffer.prototype.destroy = function() {
      return this.gl.deleteRenderbuffer(this.id);
    };

    return Renderbuffer;

  })();
  exports.Depthbuffer = Depthbuffer = (function(_super) {
    __extends(Depthbuffer, _super);

    function Depthbuffer() {
      return Depthbuffer.__super__.constructor.apply(this, arguments);
    }

    Depthbuffer.prototype.format = 'DEPTH_COMPONENT16';

    return Depthbuffer;

  })(Renderbuffer);
  return exports;
});
sys.defModule('/webgl/matrix', function(exports, require, fs) {
  var Mat3, Mat4, arc, deg, tau;
  tau = Math.PI * 2;
  deg = 360 / tau;
  arc = tau / 360;
  exports.Mat3 = Mat3 = (function() {
    function Mat3(data) {
      if (data == null) {
        data = null;
      }
      this.data = data != null ? data : new Float32Array(9);
      this.identity();
    }

    Mat3.prototype.identity = function() {
      var d;
      d = this.data;
      d[0] = 1;
      d[1] = 0;
      d[2] = 0;
      d[3] = 0;
      d[4] = 1;
      d[5] = 0;
      d[6] = 0;
      d[7] = 0;
      d[8] = 1;
      return this;
    };

    Mat3.prototype.value = function(value) {
      var i, _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.data.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.data[i] = value);
      }
      return _results;
    };

    Mat3.prototype.rotatex = function(angle) {
      var c, s;
      s = Math.sin(angle * arc);
      c = Math.cos(angle * arc);
      return this.amul(1, 0, 0, 0, c, s, 0, -s, c);
    };

    Mat3.prototype.rotatey = function(angle) {
      var c, s;
      s = Math.sin(angle * arc);
      c = Math.cos(angle * arc);
      return this.amul(c, 0, -s, 0, 1, 0, s, 0, c);
    };

    Mat3.prototype.rotatez = function(angle) {
      var c, s;
      s = Math.sin(angle * arc);
      c = Math.cos(angle * arc);
      return this.amul(c, s, 0, -s, c, 0, 0, 0, 1);
    };

    Mat3.prototype.amul = function(b00, b10, b20, b01, b11, b21, b02, b12, b22, b03, b13, b23) {
      var a, a00, a01, a02, a10, a11, a12, a20, a21, a22;
      a = this.data;
      a00 = a[0];
      a10 = a[1];
      a20 = a[2];
      a01 = a[3];
      a11 = a[4];
      a21 = a[5];
      a02 = a[6];
      a12 = a[7];
      a22 = a[8];
      a[0] = a00 * b00 + a01 * b10 + a02 * b20;
      a[1] = a10 * b00 + a11 * b10 + a12 * b20;
      a[2] = a20 * b00 + a21 * b10 + a22 * b20;
      a[3] = a00 * b01 + a01 * b11 + a02 * b21;
      a[4] = a10 * b01 + a11 * b11 + a12 * b21;
      a[5] = a20 * b01 + a21 * b11 + a22 * b21;
      a[6] = a00 * b02 + a01 * b12 + a02 * b22;
      a[7] = a10 * b02 + a11 * b12 + a12 * b22;
      a[8] = a20 * b02 + a21 * b12 + a22 * b22;
      return this;
    };

    Mat3.prototype.mulVec3 = function(vec, dst) {
      if (dst == null) {
        dst = vec;
      }
      this.mulVal3(vec.x, vec.y, vec.z, dst);
      return dst;
    };

    Mat3.prototype.mulVal3 = function(x, y, z, dst) {
      var d;
      d = this.data;
      dst.x = d[0] * x + d[3] * y + d[6] * z;
      dst.y = d[1] * x + d[4] * y + d[7] * z;
      dst.z = d[2] * x + d[5] * y + d[8] * z;
      return this;
    };

    return Mat3;

  })();
  exports.Mat4 = Mat4 = (function() {
    function Mat4(data) {
      if (data != null) {
        if (!data instanceof Float32Array) {
          data = new Float32Array(data);
        }
        this.data = data;
      } else {
        this.data = new Float32Array(16);
        this.identity();
      }
    }

    Mat4.prototype.identity = function() {
      var d;
      d = this.data;
      d[0] = 1;
      d[1] = 0;
      d[2] = 0;
      d[3] = 0;
      d[4] = 0;
      d[5] = 1;
      d[6] = 0;
      d[7] = 0;
      d[8] = 0;
      d[9] = 0;
      d[10] = 1;
      d[11] = 0;
      d[12] = 0;
      d[13] = 0;
      d[14] = 0;
      d[15] = 1;
      return this;
    };

    Mat4.prototype.value = function(value) {
      var i, _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.data.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.data[i] = value);
      }
      return _results;
    };

    Mat4.prototype.zero = function() {
      var d;
      d = this.data;
      d[0] = 0;
      d[1] = 0;
      d[2] = 0;
      d[3] = 0;
      d[4] = 0;
      d[5] = 0;
      d[6] = 0;
      d[7] = 0;
      d[8] = 0;
      d[9] = 0;
      d[10] = 0;
      d[11] = 0;
      d[12] = 0;
      d[13] = 0;
      d[14] = 0;
      d[15] = 0;
      return this;
    };

    Mat4.prototype.multiply = function(other) {
      var a, a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33, b, b0, b1, b2, b3, out;
      b = this.data;
      a = other.data;
      out = b;
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      a30 = a[12];
      a31 = a[13];
      a32 = a[14];
      a33 = a[15];
      b0 = b[0];
      b1 = b[1];
      b2 = b[2];
      b3 = b[3];
      out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[4];
      b1 = b[5];
      b2 = b[6];
      b3 = b[7];
      out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[8];
      b1 = b[9];
      b2 = b[10];
      b3 = b[11];
      out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[12];
      b1 = b[13];
      b2 = b[14];
      b3 = b[15];
      out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      return this;
    };

    Mat4.prototype.transpose = function() {
      var a, a01, a02, a03, a12, a13, a23, out;
      a = out = this.data;
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a12 = a[6];
      a13 = a[7];
      a23 = a[11];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a01;
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a02;
      out[9] = a12;
      out[11] = a[14];
      out[12] = a03;
      out[13] = a13;
      out[14] = a23;
      return this;
    };

    Mat4.prototype.copy = function(dest) {
      var dst, src;
      if (dest == null) {
        dest = new Mat4();
      }
      src = this.data;
      dst = dest.data;
      dst[0] = src[0];
      dst[1] = src[1];
      dst[2] = src[2];
      dst[3] = src[3];
      dst[4] = src[4];
      dst[5] = src[5];
      dst[6] = src[6];
      dst[7] = src[7];
      dst[8] = src[8];
      dst[9] = src[9];
      dst[10] = src[10];
      dst[11] = src[11];
      dst[12] = src[12];
      dst[13] = src[13];
      dst[14] = src[14];
      dst[15] = src[15];
      return dest;
    };


    /*
    perspective: (fov, aspect, near, far) ->
        fov ?= 60
        aspect ?= 1
        near ?= 0.01
        far ?= 100
        
         * diagonal fov
        hyp = Math.sqrt(1 + aspect*aspect)
        rel = 1/hyp
        vfov = fov*rel
        
        @zero()
        d = @data
        top = near * Math.tan(vfov*Math.PI/360)
        right = top*aspect
        left = -right
        bottom = -top
        
        d[0] = (2*near)/(right-left)
        d[5] = (2*near)/(top-bottom)
        d[8] = (right+left)/(right-left)
        d[9] = (top+bottom)/(top-bottom)
        d[10] = -(far+near)/(far-near)
        d[11] = -1
        d[14] = -(2*far*near)/(far-near)
        
        return @
     */

    Mat4.prototype.perspective = function(fov, aspect, near, far) {
      var bottom, d, hyp, left, rel, right, top, vfov;
      this.zero();
      d = this.data;
      hyp = Math.sqrt(1 + aspect * aspect);
      rel = 1 / hyp;
      vfov = fov * rel;
      top = near * Math.tan(vfov * Math.PI / 360);
      right = top * aspect;
      left = -right;
      bottom = -top;
      d[0] = (2 * near) / (right - left);
      d[5] = (2 * near) / (top - bottom);
      d[8] = (right + left) / (right - left);
      d[9] = (top + bottom) / (top - bottom);
      d[10] = -(far + near) / (far - near);
      d[11] = -1;
      d[14] = -(2 * far * near) / (far - near);
      return this;
    };

    Mat4.prototype.inversePerspective = function(fov, aspect, near, far) {
      var bottom, dst, hyp, left, rel, right, top, vfov;
      this.zero();
      dst = this.data;
      hyp = Math.sqrt(1 + aspect * aspect);
      rel = 1 / hyp;
      vfov = fov * rel;
      top = near * Math.tan(vfov * Math.PI / 360);
      right = top * aspect;
      left = -right;
      bottom = -top;
      dst[0] = (right - left) / (2 * near);
      dst[5] = (top - bottom) / (2 * near);
      dst[11] = -(far - near) / (2 * far * near);
      dst[12] = (right + left) / (2 * near);
      dst[13] = (top + bottom) / (2 * near);
      dst[14] = -1;
      dst[15] = (far + near) / (2 * far * near);
      return this;
    };

    Mat4.prototype.ortho = function(near, far, top, bottom, left, right) {
      var fn, rl, tb;
      if (near == null) {
        near = -1;
      }
      if (far == null) {
        far = 1;
      }
      if (top == null) {
        top = -1;
      }
      if (bottom == null) {
        bottom = 1;
      }
      if (left == null) {
        left = -1;
      }
      if (right == null) {
        right = 1;
      }
      rl = right - left;
      tb = top - bottom;
      fn = far - near;
      return this.set(2 / rl, 0, 0, -(left + right) / rl, 0, 2 / tb, 0, -(top + bottom) / tb, 0, 0, -2 / fn, -(far + near) / fn, 0, 0, 0, 1);
    };

    Mat4.prototype.inverseOrtho = function(near, far, top, bottom, left, right) {
      var a, b, c, d, e, f, g;
      if (near == null) {
        near = -1;
      }
      if (far == null) {
        far = 1;
      }
      if (top == null) {
        top = -1;
      }
      if (bottom == null) {
        bottom = 1;
      }
      if (left == null) {
        left = -1;
      }
      if (right == null) {
        right = 1;
      }
      a = (right - left) / 2;
      b = (right + left) / 2;
      c = (top - bottom) / 2;
      d = (top + bottom) / 2;
      e = (far - near) / -2;
      f = (near + far) / 2;
      g = 1;
      return this.set(a, 0, 0, b, 0, c, 0, d, 0, 0, e, f, 0, 0, 0, g);
    };

    Mat4.prototype.translate = function(x, y, z) {
      var a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, d;
      d = this.data;
      a00 = d[0];
      a01 = d[1];
      a02 = d[2];
      a03 = d[3];
      a10 = d[4];
      a11 = d[5];
      a12 = d[6];
      a13 = d[7];
      a20 = d[8];
      a21 = d[9];
      a22 = d[10];
      a23 = d[11];
      d[12] = a00 * x + a10 * y + a20 * z + d[12];
      d[13] = a01 * x + a11 * y + a21 * z + d[13];
      d[14] = a02 * x + a12 * y + a22 * z + d[14];
      d[15] = a03 * x + a13 * y + a23 * z + d[15];
      return this;
    };

    Mat4.prototype.scale = function(x, y, z) {
      var d;
      d = this.data;
      d[0] = d[0] * x;
      d[1] = d[1] * x;
      d[2] = d[2] * x;
      d[3] = d[3] * x;
      d[4] = d[4] * y;
      d[5] = d[5] * y;
      d[6] = d[6] * y;
      d[7] = d[7] * y;
      d[8] = d[8] * z;
      d[9] = d[9] * z;
      d[10] = d[10] * z;
      d[11] = d[11] * z;
      return this;
    };

    Mat4.prototype.rotatex = function(angle) {
      var a10, a11, a12, a13, a20, a21, a22, a23, c, d, rad, s;
      d = this.data;
      rad = tau * (angle / 360);
      s = Math.sin(rad);
      c = Math.cos(rad);
      a10 = d[4];
      a11 = d[5];
      a12 = d[6];
      a13 = d[7];
      a20 = d[8];
      a21 = d[9];
      a22 = d[10];
      a23 = d[11];
      d[4] = a10 * c + a20 * s;
      d[5] = a11 * c + a21 * s;
      d[6] = a12 * c + a22 * s;
      d[7] = a13 * c + a23 * s;
      d[8] = a10 * -s + a20 * c;
      d[9] = a11 * -s + a21 * c;
      d[10] = a12 * -s + a22 * c;
      d[11] = a13 * -s + a23 * c;
      return this;
    };

    Mat4.prototype.rotatey = function(angle) {
      var a00, a01, a02, a03, a20, a21, a22, a23, c, d, rad, s;
      d = this.data;
      rad = tau * (angle / 360);
      s = Math.sin(rad);
      c = Math.cos(rad);
      a00 = d[0];
      a01 = d[1];
      a02 = d[2];
      a03 = d[3];
      a20 = d[8];
      a21 = d[9];
      a22 = d[10];
      a23 = d[11];
      d[0] = a00 * c + a20 * -s;
      d[1] = a01 * c + a21 * -s;
      d[2] = a02 * c + a22 * -s;
      d[3] = a03 * c + a23 * -s;
      d[8] = a00 * s + a20 * c;
      d[9] = a01 * s + a21 * c;
      d[10] = a02 * s + a22 * c;
      d[11] = a03 * s + a23 * c;
      return this;
    };

    Mat4.prototype.rotatez = function(angle) {
      var a00, a01, a02, a03, a10, a11, a12, a13, c, d, rad, s;
      d = this.data;
      rad = tau * (angle / 360);
      s = Math.sin(rad);
      c = Math.cos(rad);
      a00 = d[0];
      a01 = d[1];
      a02 = d[2];
      a03 = d[3];
      a10 = d[4];
      a11 = d[5];
      a12 = d[6];
      a13 = d[7];
      d[0] = a00 * c + a10 * s;
      d[1] = a01 * c + a11 * s;
      d[2] = a02 * c + a12 * s;
      d[3] = a03 * c + a13 * s;
      d[4] = a10 * c - a00 * s;
      d[5] = a11 * c - a01 * s;
      d[6] = a12 * c - a02 * s;
      d[7] = a13 * c - a03 * s;
      return this;
    };

    Mat4.prototype.invert = function(destination) {
      var a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33, b00, b01, b02, b03, b04, b05, b06, b07, b08, b09, b10, b11, d, dst, invDet, src;
      if (destination == null) {
        destination = this;
      }
      src = this.data;
      dst = destination.data;
      a00 = src[0];
      a01 = src[1];
      a02 = src[2];
      a03 = src[3];
      a10 = src[4];
      a11 = src[5];
      a12 = src[6];
      a13 = src[7];
      a20 = src[8];
      a21 = src[9];
      a22 = src[10];
      a23 = src[11];
      a30 = src[12];
      a31 = src[13];
      a32 = src[14];
      a33 = src[15];
      b00 = a00 * a11 - a01 * a10;
      b01 = a00 * a12 - a02 * a10;
      b02 = a00 * a13 - a03 * a10;
      b03 = a01 * a12 - a02 * a11;
      b04 = a01 * a13 - a03 * a11;
      b05 = a02 * a13 - a03 * a12;
      b06 = a20 * a31 - a21 * a30;
      b07 = a20 * a32 - a22 * a30;
      b08 = a20 * a33 - a23 * a30;
      b09 = a21 * a32 - a22 * a31;
      b10 = a21 * a33 - a23 * a31;
      b11 = a22 * a33 - a23 * a32;
      d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (d === 0) {
        return;
      }
      invDet = 1 / d;
      dst[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
      dst[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
      dst[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
      dst[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
      dst[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
      dst[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
      dst[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
      dst[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
      dst[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
      dst[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
      dst[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
      dst[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
      dst[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
      dst[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
      dst[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
      dst[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;
      return destination;
    };

    Mat4.prototype.toMat3Rot = function(dest) {
      var a00, a01, a02, a10, a11, a12, a20, a21, a22, b01, b11, b21, d, dst, id, src;
      dst = dest.data;
      src = this.data;
      a00 = src[0];
      a01 = src[1];
      a02 = src[2];
      a10 = src[4];
      a11 = src[5];
      a12 = src[6];
      a20 = src[8];
      a21 = src[9];
      a22 = src[10];
      b01 = a22 * a11 - a12 * a21;
      b11 = -a22 * a10 + a12 * a20;
      b21 = a21 * a10 - a11 * a20;
      d = a00 * b01 + a01 * b11 + a02 * b21;
      id = 1 / d;
      dst[0] = b01 * id;
      dst[3] = (-a22 * a01 + a02 * a21) * id;
      dst[6] = (a12 * a01 - a02 * a11) * id;
      dst[1] = b11 * id;
      dst[4] = (a22 * a00 - a02 * a20) * id;
      dst[7] = (-a12 * a00 + a02 * a10) * id;
      dst[2] = b21 * id;
      dst[5] = (-a21 * a00 + a01 * a20) * id;
      dst[8] = (a11 * a00 - a01 * a10) * id;
      return this;
    };

    Mat4.prototype.set = function(a00, a10, a20, a30, a01, a11, a21, a31, a02, a12, a22, a32, a03, a13, a23, a33) {
      var d;
      d = this.data;
      d[0] = a00;
      d[4] = a10;
      d[8] = a20;
      d[12] = a30;
      d[1] = a01;
      d[5] = a11;
      d[9] = a21;
      d[13] = a31;
      d[2] = a02;
      d[6] = a12;
      d[10] = a22;
      d[14] = a32;
      d[3] = a03;
      d[7] = a13;
      d[11] = a23;
      d[15] = a33;
      return this;
    };

    Mat4.prototype.mulVec3 = function(vec, dst) {
      if (dst == null) {
        dst = vec;
      }
      return this.mulVal3(vec.x, vec.y, vec.z, dst);
    };

    Mat4.prototype.mulVal3 = function(x, y, z, dst) {
      var d;
      d = this.data;
      dst.x = d[0] * x + d[4] * y + d[8] * z;
      dst.y = d[1] * x + d[5] * y + d[9] * z;
      dst.z = d[2] * x + d[6] * y + d[10] * z;
      return dst;
    };

    Mat4.prototype.mulVec4 = function(vec, dst) {
      if (dst == null) {
        dst = vec;
      }
      return this.mulVal4(vec[0], vec[1], vec[2], vec[3], dst);
    };

    Mat4.prototype.mulVal4 = function(x, y, z, w, dst) {
      var d;
      d = this.data;
      dst.x = d[0] * x + d[4] * y + d[8] * z + d[12] * w;
      dst.y = d[1] * x + d[5] * y + d[9] * z + d[13] * w;
      dst.z = d[2] * x + d[6] * y + d[10] * z + d[14] * w;
      dst.w = d[3] * x + d[7] * y + d[11] * z + d[15] * w;
      return dst;
    };

    return Mat4;

  })();
  return exports;
});
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

sys.defModule('/webgl/module', function(exports, require, fs) {
  var Shader, ShaderProxy, State, VertexBuffer, WebGLFramework, framebuffer, getExtension, getSupportedExtensions, matrix, shims, texture, textureFloat, vector, vendorRe, vendors, _ref;
  if (window.WebGLRenderingContext != null) {
    vendors = ['WEBKIT', 'MOZ', 'MS', 'O'];
    vendorRe = /^WEBKIT_(.*)|MOZ_(.*)|MS_(.*)|O_(.*)/;
    getExtension = WebGLRenderingContext.prototype.getExtension;
    WebGLRenderingContext.prototype.getExtension = function(name) {
      var extobj, match, vendor, _i, _len;
      match = name.match(vendorRe);
      if (match !== null) {
        name = match[1];
      }
      extobj = getExtension.call(this, name);
      if (extobj === null) {
        for (_i = 0, _len = vendors.length; _i < _len; _i++) {
          vendor = vendors[_i];
          extobj = getExtension.call(this, vendor + '_' + name);
          if (extobj !== null) {
            return extobj;
          }
        }
        return null;
      } else {
        return extobj;
      }
    };
    getSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
      var extension, match, result, supported, _i, _len;
      supported = getSupportedExtensions.call(this);
      result = [];
      for (_i = 0, _len = supported.length; _i < _len; _i++) {
        extension = supported[_i];
        match = extension.match(vendorRe);
        if (match !== null) {
          extension = match[1];
        }
        if (__indexOf.call(result, extension) < 0) {
          result.push(extension);
        }
      }
      return result;
    };
  }
  shims = require('shims');
  textureFloat = require('texture-float');
  texture = require('texture');
  matrix = require('matrix');
  vector = require('vector');
  State = require('state');
  VertexBuffer = require('vertexbuffer').VertexBuffer;
  _ref = require('shader'), Shader = _ref.Shader, ShaderProxy = _ref.ShaderProxy;
  framebuffer = require('framebuffer');
  exports = WebGLFramework = (function() {
    function WebGLFramework(params) {
      var debug, float16, float32, i, perf, _ref1, _ref2, _ref3;
      if (params == null) {
        params = {};
      }
      debug = (_ref1 = params.debug) != null ? _ref1 : false;
      delete params.debug;
      perf = (_ref2 = params.perf) != null ? _ref2 : false;
      delete params.perf;
      this.canvas = (_ref3 = params.canvas) != null ? _ref3 : document.createElement('canvas');
      delete params.canvas;
      this.gl = this.getContext('webgl', params);
      this.gl.getExtension('OES_standard_derivatives');
      if (this.gl == null) {
        this.gl = this.getContext('experimental-webgl');
      }
      if (this.gl == null) {
        throw new Error('WebGL is not supported');
      }
      this.textureFloat = textureFloat(this.gl);
      float32 = this.textureFloat.float32;
      float16 = this.textureFloat.float16;
      if (float32.renderable && float32.linear) {
        this.usableFloat = float32.type;
      } else if (float16.renderable && float16.linear) {
        this.usableFloat = float16.type;
      }
      this.vao = null;
      if ((window.WebGLPerfContext != null) && perf) {
        console.log('webgl perf context enabled');
        this.gl = new WebGLPerfContext.create(this.gl);
      } else if ((window.WebGLDebugUtils != null) && debug) {
        console.log('webgl debug enabled');
        this.gl = WebGLDebugUtils.makeDebugContext(this.gl, function(err, funcName, args) {
          throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
        });
      }
      this.currentVertexBuffer = null;
      this.currentShader = null;
      this.currentFramebuffer = null;
      this.currentState = null;
      this.maxAttribs = this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS);
      this.vertexUnits = (function() {
        var _i, _ref4, _results;
        _results = [];
        for (i = _i = 0, _ref4 = this.maxAttribs; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
          _results.push({
            enabled: false,
            pointer: null,
            location: i
          });
        }
        return _results;
      }).call(this);
      this.textureUnits = (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i < 16; i = ++_i) {
          _results.push(null);
        }
        return _results;
      })();
      this.lineWidth = 1;
      this.quadVertices = this.vertexbuffer({
        pointers: [
          {
            name: 'position',
            size: 2
          }
        ],
        vertices: [-1, -1, 1, -1, 1, 1, -1, 1, -1, -1, 1, 1]
      });
      this.blit = this.state({
        shader: fs.open('blit.shader')
      });
      this.readFBO = this.framebuffer();
    }

    WebGLFramework.prototype.haveExtension = function(search) {
      var name, _i, _len, _ref1;
      _ref1 = this.gl.getSupportedExtensions();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        name = _ref1[_i];
        if (name.indexOf(search) >= 0) {
          return true;
        }
      }
      return false;
    };

    WebGLFramework.prototype.getContext = function(name, params) {
      var error;
      try {
        return this.canvas.getContext(name, params);
      } catch (_error) {
        error = _error;
        return null;
      }
    };

    WebGLFramework.prototype.state = function(params) {
      return new State(this, params);
    };

    WebGLFramework.prototype.vertexbuffer = function(params) {
      return new VertexBuffer(this, params);
    };

    WebGLFramework.prototype.framebuffer = function(params) {
      if (params == null) {
        params = {};
      }
      if (params.type != null) {
        if (params.type === '2d') {
          return new framebuffer.Framebuffer2D(this, params);
        } else if (params.type === 'cube') {
          return new framebuffer.FramebufferCube(this, params);
        } else {
          throw new Error('unknown framebuffer type: ' + params.type);
        }
      } else {
        return new framebuffer.Framebuffer2D(this, params);
      }
    };

    WebGLFramework.prototype.depthbuffer = function(params) {
      return new framebuffer.Depthbuffer(this, params);
    };

    WebGLFramework.prototype.shader = function(params) {
      return new Shader(this, params);
    };

    WebGLFramework.prototype.shaderProxy = function(shader) {
      return new ShaderProxy(shader);
    };

    WebGLFramework.prototype.mat4 = function(view) {
      return new matrix.Mat4(view);
    };

    WebGLFramework.prototype.mat3 = function(view) {
      return new matrix.Mat3(view);
    };

    WebGLFramework.prototype.vec3 = function(x, y, z) {
      return new vector.Vec3(x, y, z);
    };

    WebGLFramework.prototype.vec4 = function(x, y, z, w) {
      return new vector.Vec4(x, y, z, w);
    };

    WebGLFramework.prototype.clearColor = function(r, g, b, a) {
      this.gl.clearColor(r, g, b, a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      return this;
    };

    WebGLFramework.prototype.frameStart = function() {
      var factor;
      factor = 1;
      if (this.canvas.offsetWidth * factor !== this.canvas.width) {
        this.canvas.width = this.canvas.offsetWidth * factor;
      }
      if (this.canvas.offsetHeight * factor !== this.canvas.height) {
        this.canvas.height = this.canvas.offsetHeight * factor;
      }
      if (this.gl.performance != null) {
        this.gl.performance.start();
      }
      return this;
    };

    WebGLFramework.prototype.frameEnd = function() {
      if (this.gl.performance != null) {
        this.gl.performance.stop();
      }
      return this;
    };

    WebGLFramework.prototype.texture2D = function(params) {
      return new texture.Texture2D(this, params);
    };

    WebGLFramework.prototype.textureCube = function(params) {
      return new texture.TextureCube(this, params);
    };

    WebGLFramework.prototype.getExtension = function(name) {
      return this.gl.getExtension(name);
    };

    WebGLFramework.prototype.htmlColor2Vec = function(value) {
      var b, g, r;
      r = parseInt(value.slice(0, 2), 16) / 255;
      g = parseInt(value.slice(2, 4), 16) / 255;
      b = parseInt(value.slice(4), 16) / 255;
      return {
        r: r,
        g: g,
        b: b
      };
    };

    return WebGLFramework;

  })();
  return exports;
});
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

sys.defModule('/webgl/shader', function(exports, require, fs) {
  var Shader, ShaderObj, ShaderProxy, Vec3, Vec4, boilerplate, matrix, _ref;
  matrix = require('matrix');
  _ref = require('vector'), Vec3 = _ref.Vec3, Vec4 = _ref.Vec4;
  exports.ShaderObj = ShaderObj = (function() {
    function ShaderObj() {}

    return ShaderObj;

  })();
  boilerplate = '    #extension GL_OES_standard_derivatives : enable\n\n    precision highp int;\n    precision highp float;\n    #define PI 3.141592653589793\n    #define TAU 6.283185307179586\n    #define PIH 1.5707963267948966\n    #define E 2.7182818284590451\n    #define logN(x, base) (log(x)/log(base))\n    float angleBetween(vec3 a, vec3 b){return acos(dot(a,b));}\n\n    vec3 gammasRGB(vec3 color){\n        return mix(\n            color*12.92,\n            pow(color, vec3(1.0/2.4))*1.055-0.055,\n            step((0.04045/12.92), color)\n        );\n    }\n\n    vec3 degammasRGB(vec3 color){\n        return mix(\n            color/12.92,\n            pow((color+0.055)/1.055, vec3(2.4)),\n            step(0.04045, color)\n        );\n    }\n\n    vec3 gamma(vec3 color){\n        //return gammasRGB(color);\n        return pow(color, vec3(1.0/2.2));\n    }\n\n    vec3 degamma(vec3 color){\n        //return degammasRGB(color);\n        return pow(color, vec3(2.2));\n    }\n    \n    float linstep(float edge0, float edge1, float value){\n        return clamp((value-edge0)/(edge1-edge0), 0.0, 1.0);\n    }\n    \n    float linstepOpen(float edge0, float edge1, float value){\n        return (value-edge0)/(edge1-edge0);\n    }\n\n    vec2 linstep(vec2 edge0, vec2 edge1, vec2 value){\n        return clamp((value-edge0)/(edge1-edge0), vec2(0.0), vec2(1.0));\n    }\n    \n    vec2 linstepOpen(vec2 edge0, vec2 edge1, vec2 value){\n        return (value-edge0)/(edge1-edge0);\n    }\n\n    float pyramidstep(float edge0, float edge1, float value){\n        float f = (value-edge0)/(edge1-edge0);\n        return clamp(abs(f*2.0-1.0), 0.0, 1.0);\n    }\n    \n    vec2 pyramidstep(vec2 edge0, vec2 edge1, vec2 value){\n        vec2 f = (value-edge0)/(edge1-edge0);\n        return abs(f*2.0-1.0);\n    }\n    \n    vec3 pyramidstep(vec3 edge0, vec3 edge1, vec3 value){\n        vec3 f = (value-edge0)/(edge1-edge0);\n        return abs(f*2.0-1.0);\n    }\n    \n    vec2 encodeNormal(vec3 n){\n        float f = sqrt(8.0*n.z+8.0);\n        return n.xy / f + 0.5;\n    }\n\n    vec3 decodeNormal(vec2 enc){\n        vec2 fenc = enc*4.0-2.0;\n        float f = dot(fenc,fenc);\n        float g = sqrt(1.0-f/4.0);\n        return vec3(\n            fenc*g,\n            1.0-f/2.0\n        );\n    }\n\n    vec2 pack16(float value){\n        float sMax = 65535.0;\n        int v = int(clamp(value, 0.0, 1.0)*sMax+0.5);\n        int digit0 = v/256;\n        int digit1 = v-digit0*256;\n        return vec2(float(digit0)/255.0, float(digit1)/255.0);\n    }\n\n    vec2 pack16(int v){\n        int digit0 = v/256;\n        int digit1 = v-digit0*256;\n        return vec2(float(digit0)/255.0, float(digit1)/255.0);\n    }\n\n    float unpack16(vec2 value){\n        return (\n            value.x*0.996108949416342426275150501169264316558837890625 +\n            value.y*0.00389105058365758760263730664519243873655796051025390625\n        );\n    }';
  exports.Shader = Shader = (function(_super) {
    __extends(Shader, _super);

    function Shader(gf, params) {
      this.gf = gf;
      this.gl = this.gf.gl;
      this.program = this.gl.createProgram();
      this.vs = this.gl.createShader(this.gl.VERTEX_SHADER);
      this.fs = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      this.gl.attachShader(this.program, this.vs);
      this.gl.attachShader(this.program, this.fs);
      this.source(params);
    }

    Shader.prototype.source = function(params) {
      var c, common, f, file, fragment, v, vertex, _i, _len, _ref1, _ref2, _ref3;
      if (typeof params === 'string') {
        _ref1 = this.splitSource(params), common = _ref1[0], vertex = _ref1[1], fragment = _ref1[2];
      } else if (params instanceof sys.File) {
        _ref2 = this.splitSource(params.read()), common = _ref2[0], vertex = _ref2[1], fragment = _ref2[2];
      } else if (params instanceof Array) {
        common = [];
        vertex = [];
        fragment = [];
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          file = params[_i];
          _ref3 = this.splitSource(file.read()), c = _ref3[0], v = _ref3[1], f = _ref3[2];
          if (c.length > 0) {
            common.push(c);
          }
          if (v.length > 0) {
            vertex.push(v);
          }
          if (f.length > 0) {
            fragment.push(f);
          }
        }
        common = common.join('\n');
        vertex = vertex.join('\n');
        fragment = fragment.join('\n');
      }
      return this.setSource({
        common: common,
        vertex: vertex,
        fragment: fragment
      });
    };

    Shader.prototype.destroy = function() {
      this.gl.deleteShader(this.vs);
      this.gl.deleteShader(this.fs);
      return this.gl.deleteProgram(this.program);
    };

    Shader.prototype.splitSource = function(source) {
      var common, current, filename, fragment, line, linenum, lines, vertex, _i, _len;
      common = [];
      vertex = [];
      fragment = [];
      current = common;
      lines = source.trim().split('\n');
      filename = lines.shift().split(' ')[1];
      for (linenum = _i = 0, _len = lines.length; _i < _len; linenum = ++_i) {
        line = lines[linenum];
        if (line.match(/vertex:$/)) {
          current = vertex;
        } else if (line.match(/fragment:$/)) {
          current = fragment;
        } else {
          current.push("#line " + linenum + " " + filename);
          current.push(line);
        }
      }
      return [common.join('\n').trim(), vertex.join('\n').trim(), fragment.join('\n').trim()];
    };

    Shader.prototype.preprocess = function(source) {
      var filename, line, lineno, lines, match, result, _i, _len, _ref1;
      lines = [];
      result = [];
      filename = 'no file';
      lineno = 1;
      _ref1 = source.trim().split('\n');
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        line = _ref1[_i];
        match = line.match(/#line (\d+) (.*)/);
        if (match) {
          lineno = parseInt(match[1], 10) + 1;
          filename = match[2];
        } else {
          lines.push({
            source: line,
            lineno: lineno,
            filename: filename
          });
          result.push(line);
          lineno += 1;
        }
      }
      return [result.join('\n'), lines];
    };

    Shader.prototype.setSource = function(_arg) {
      var common, fragment, vertex;
      common = _arg.common, vertex = _arg.vertex, fragment = _arg.fragment;
      this.uniformCache = {};
      this.attributeCache = {};
      if (common == null) {
        common = '';
      }
      this.compileShader(this.vs, [common, vertex].join('\n'));
      this.compileShader(this.fs, [common, fragment].join('\n'));
      return this.link();
    };

    Shader.prototype.compileShader = function(shader, source) {
      var error, lines, _ref1;
      source = [boilerplate, source].join('\n');
      _ref1 = this.preprocess(source), source = _ref1[0], lines = _ref1[1];
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        error = this.gl.getShaderInfoLog(shader);
        throw this.translateError(error, lines);
      }
    };

    Shader.prototype.link = function() {
      this.gl.linkProgram(this.program);
      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        throw new Error("Shader Link Error: " + (this.gl.getProgramInfoLog(this.program)));
      }
    };

    Shader.prototype.translateError = function(error, lines) {
      var i, line, lineno, match, message, result, sourceline, _i, _len, _ref1;
      result = ['Shader Compile Error'];
      _ref1 = error.split('\n');
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        line = _ref1[i];
        match = line.match(/ERROR: \d+:(\d+): (.*)/);
        if (match) {
          lineno = parseFloat(match[1]) - 1;
          message = match[2];
          sourceline = lines[lineno];
          result.push("File \"" + sourceline.filename + "\", Line " + sourceline.lineno + ", " + message);
          result.push("   " + sourceline.source);
        } else {
          result.push(line);
        }
      }
      return result.join('\n');
    };

    Shader.prototype.attributeLocation = function(name, index) {
      var location;
      if (index != null) {
        this.attributeCache[name] = index;
        this.gl.bindAttribLocation(this.program, index, name);
        return index;
      } else {
        location = this.attributeCache[name];
        if (location === void 0) {
          location = this.gl.getAttribLocation(this.program, name);
          if (location >= 0) {
            this.attributeCache[name] = location;
            return location;
          } else {
            this.attributeCache[name] = null;
            return null;
          }
        } else {
          return location;
        }
      }
    };

    Shader.prototype.uniformLocation = function(name) {
      var location;
      location = this.uniformCache[name];
      if (location === void 0) {
        location = this.gl.getUniformLocation(this.program, name);
        if (location != null) {
          this.uniformCache[name] = location;
          return location;
        } else {
          this.uniformCache[name] = null;
          return null;
        }
      } else {
        return location;
      }
    };

    Shader.prototype.use = function() {
      if (this.gf.currentShader !== this) {
        this.gf.currentShader = this;
        return this.gl.useProgram(this.program);
      }
    };

    Shader.prototype.mat4 = function(name, value) {
      var location;
      if (value instanceof matrix.Mat4) {
        value = value.data;
      }
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        this.gl.uniformMatrix4fv(location, false, value);
      }
      return this;
    };

    Shader.prototype.mat3 = function(name, value) {
      var location;
      if (value instanceof matrix.Mat3) {
        value = value.data;
      }
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        this.gl.uniformMatrix3fv(location, false, value);
      }
      return this;
    };

    Shader.prototype.vec2 = function(name, a, b) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        if (a instanceof Array || a instanceof Float32Array) {
          this.gl.uniform2fv(location, a);
        } else {
          this.gl.uniform2f(location, a, b);
        }
      }
      return this;
    };

    Shader.prototype.vec3 = function(name, a, b, c) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        if (a instanceof Array || a instanceof Float32Array) {
          this.gl.uniform3fv(location, a);
        } else if (a instanceof Vec3) {
          this.gl.uniform3f(location, a.x, a.y, a.z);
        } else {
          this.gl.uniform3f(location, a, b, c);
        }
      }
      return this;
    };

    Shader.prototype.vec4 = function(name, a, b, c, d) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        if (a instanceof Array || a instanceof Float32Array) {
          this.gl.uniform4fv(location, a);
        } else {
          this.gl.uniform4f(location, a, b, c, d);
        }
      }
      return this;
    };

    Shader.prototype.int = function(name, value) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        this.gl.uniform1i(location, value);
      }
      return this;
    };

    Shader.prototype.uniformSetter = function(obj) {
      obj.setUniformsOn(this);
      return this;
    };

    Shader.prototype.float = function(name, value) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        if (value instanceof Array || value instanceof Float32Array) {
          this.gl.uniform1fv(location, value);
        } else {
          this.gl.uniform1f(location, value);
        }
      }
      return this;
    };

    return Shader;

  })(ShaderObj);
  exports.ShaderProxy = ShaderProxy = (function(_super) {
    __extends(ShaderProxy, _super);

    function ShaderProxy(shader) {
      this.shader = shader != null ? shader : null;
    }

    ShaderProxy.prototype.attributeLocation = function(name) {
      return this.shader.attributeLocation(name);
    };

    ShaderProxy.prototype.uniformLocation = function(name) {
      return this.shader.uniformLocation(name);
    };

    ShaderProxy.prototype.use = function() {
      this.shader.use();
      return this;
    };

    ShaderProxy.prototype.mat4 = function(name, value) {
      this.shader.mat4(name, value);
      return this;
    };

    ShaderProxy.prototype.vec2 = function(name, a, b) {
      this.shader.vec2(name, a, b);
      return this;
    };

    ShaderProxy.prototype.vec3 = function(name, a, b, c) {
      this.shader.vec3(name, a, b, c);
      return this;
    };

    ShaderProxy.prototype.vec4 = function(name, a, b, c, d) {
      this.shader.vec4(name, a, b, c, d);
      return this;
    };

    ShaderProxy.prototype.int = function(name, value) {
      this.shader.int(name, value);
      return this;
    };

    ShaderProxy.prototype.uniformSetter = function(obj) {
      this.shader.uniformSetter(obj);
      return this;
    };

    ShaderProxy.prototype.float = function(name, value) {
      this.shader.float(name, value);
      return this;
    };

    return ShaderProxy;

  })(ShaderObj);
  return exports;
});
sys.defModule('/webgl/shims', function(exports, require, fs) {
  var getAttrib, getAttribName, startTime, vendorName, vendors, _ref;
  vendors = [null, 'webkit', 'apple', 'moz', 'o', 'xv', 'ms', 'khtml', 'atsc', 'wap', 'prince', 'ah', 'hp', 'ro', 'rim', 'tc'];
  vendorName = function(name, vendor) {
    if (vendor === null) {
      return name;
    } else {
      return vendor + name[0].toUpperCase() + name.substr(1);
    }
  };
  getAttribName = function(obj, name) {
    var attrib, attrib_name, vendor, _i, _len;
    for (_i = 0, _len = vendors.length; _i < _len; _i++) {
      vendor = vendors[_i];
      attrib_name = vendorName(name, vendor);
      attrib = obj[attrib_name];
      if (attrib != null) {
        return attrib_name;
      }
    }
  };
  getAttrib = function(obj, name, def) {
    var attrib, attrib_name, vendor, _i, _len;
    if (obj) {
      for (_i = 0, _len = vendors.length; _i < _len; _i++) {
        vendor = vendors[_i];
        attrib_name = vendorName(name, vendor);
        attrib = obj[attrib_name];
        if (attrib != null) {
          return attrib;
        }
      }
    }
    return def;
  };
  window.performance = getAttrib(window, 'performance');
  if (window.performance == null) {
    window.performance = {};
  }
  window.performance.now = getAttrib(window.performance, 'now');
  if (window.performance.now == null) {
    startTime = Date.now();
    window.performance.now = function() {
      return Date.now() - startTime;
    };
  }
  window.requestAnimationFrame = getAttrib(window, 'requestAnimationFrame', function(callback) {
    return setTimeout(callback, 1000 / 60);
  });
  window.fullscreen = {
    enabled: (_ref = getAttrib(document, 'fullScreenEnabled')) != null ? _ref : getAttrib(document, 'fullscreenEnabled'),
    element: function() {
      var _ref1;
      return (_ref1 = getAttrib(document, 'fullScreenElement')) != null ? _ref1 : getAttrib(document, 'fullscreenElement');
    },
    exit: function() {
      var name, _ref1, _ref2, _ref3;
      name = (_ref1 = (_ref2 = (_ref3 = getAttribName(document, 'exitFullScreen')) != null ? _ref3 : getAttribName(document, 'exitFullscreen')) != null ? _ref2 : getAttribName(document, 'cancelFullScreen')) != null ? _ref1 : getAttribName(document, 'cancelFullscreen');
      if (name != null) {
        return document[name]();
      }
    },
    request: function(element) {
      var name, _ref1;
      name = (_ref1 = getAttribName(element, 'requestFullScreen')) != null ? _ref1 : getAttribName(element, 'requestFullscreen');
      if (name != null) {
        return element[name]();
      }
    },
    addEventListener: function(callback) {
      var onChange, vendor, _i, _len, _ref1;
      onChange = function(event) {
        event.entered = fullscreen.element() != null;
        return callback(event);
      };
      document.addEventListener('fullscreenchange', onChange);
      _ref1 = vendors.slice(1);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        vendor = _ref1[_i];
        document.addEventListener(vendor + 'fullscreenchange', onChange);
      }
    }
  };
  fullscreen.addEventListener(function(event) {
    var element;
    element = event.target;
    if (event.entered) {
      return element.className += ' fullscreen';
    } else {
      return element.className = element.className.replace(' fullscreen', '').replace('fullscreen', '');
    }
  });
  return exports;
});
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

sys.defModule('/webgl/state', function(exports, require, fs) {
  var BaseBuffer, ShaderObj, State, VertexBuffer, framebuffer, util, _ref;
  util = require('util');
  _ref = require('vertexbuffer'), BaseBuffer = _ref.BaseBuffer, VertexBuffer = _ref.VertexBuffer;
  ShaderObj = require('shader').ShaderObj;
  framebuffer = require('framebuffer');
  exports = State = (function() {
    function State(gf, params) {
      var uniform, _i, _len, _ref1, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      this.gf = gf;
      this.blendMultiply = __bind(this.blendMultiply, this);
      this.blendAdd = __bind(this.blendAdd, this);
      this.blendAlpha = __bind(this.blendAlpha, this);
      this.gl = this.gf.gl;
      if (params.shader instanceof ShaderObj) {
        this.shader = params.shader;
        this.ownShader = false;
      } else {
        this.shader = this.gf.shader(params.shader);
        this.ownShader = true;
      }
      if (params.framebuffer != null) {
        if (params.framebuffer instanceof framebuffer.Framebuffer) {
          this.framebuffer = params.framebuffer;
          this.ownFramebuffer = false;
        } else {
          this.framebuffer = this.gf.framebuffer(params.framebuffer);
          this.ownFramebuffer = true;
        }
      } else {
        this.framebuffer = null;
        this.ownFramebuffer = false;
      }
      if (params.vertexbuffer != null) {
        this.vertexbuffer(params.vertexbuffer);
      } else {
        this.vertexbuffer(this.gf.quadVertices);
      }
      this.texturesByName = {};
      this.textures = [];
      this.depthTest = (_ref1 = params.depthTest) != null ? _ref1 : false;
      this.depthWrite = (_ref2 = params.depthWrite) != null ? _ref2 : true;
      if (params.colorMask != null) {
        if (typeof params.colorMask === 'boolean') {
          this.colorWrite = [params.colorMask, params.colorMask, params.colorMask, params.colorMask];
        } else {
          this.colorWrite = [(_ref3 = params.colorMask[0]) != null ? _ref3 : true, (_ref4 = params.colorMask[1]) != null ? _ref4 : true, (_ref5 = params.colorMask[2]) != null ? _ref5 : true, (_ref6 = params.colorMask[3]) != null ? _ref6 : true];
        }
      } else {
        this.colorWrite = [true, true, true, true];
      }
      if (params.depthFunc != null) {
        this.depthFunc = (_ref7 = this.gl[params.depthFunc.toUpperCase()]) != null ? _ref7 : this.gl.LESS;
      } else {
        this.depthFunc = this.gl.LESS;
      }
      if (params.cull != null) {
        this.cullFace = (_ref8 = this.gl[params.cull.toUpperCase()]) != null ? _ref8 : this.gl.BACK;
      } else {
        this.cullFace = false;
      }
      this.lineWidth = (_ref9 = params.lineWidth) != null ? _ref9 : 1;
      if (params.blend != null) {
        switch (params.blend) {
          case 'alpha':
            this.blend = this.blendAlpha;
            break;
          case 'add':
            this.blend = this.blendAdd;
            break;
          case 'multiply':
            this.blend = this.blendMultiply;
            break;
          default:
            throw new Error('blend mode is not implemented: ' + params.blend);
        }
      } else {
        this.blend = null;
      }
      if (params.uniforms != null) {
        _ref10 = params.uniforms;
        for (_i = 0, _len = _ref10.length; _i < _len; _i++) {
          uniform = _ref10[_i];
          this[uniform.type](uniform.name, uniform.value);
        }
      }
      if (this.gf.vao != null) {
        this.vao = this.gf.vao.createVertexArrayOES();
        this.gf.vao.bindVertexArrayOES(this.vao);
        this.setPointers();
        this.gf.vao.bindVertexArrayOES(null);
      } else {
        this.vao = null;
      }
    }

    State.prototype.vertexbuffer = function(buffer) {
      var location, pointer, _i, _len, _ref1, _results;
      if (buffer instanceof BaseBuffer) {
        this.vbo = buffer;
        this.ownvbo = false;
      } else {
        this.vbo = this.gf.vertexbuffer(buffer);
        this.ownvbo = true;
      }
      this.pointers = (function() {
        var _i, _ref1, _results;
        _results = [];
        for (location = _i = 0, _ref1 = this.gf.maxAttribs; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; location = 0 <= _ref1 ? ++_i : --_i) {
          _results.push(null);
        }
        return _results;
      }).call(this);

      /*
      location = 0
      for pointer in @vbo.pointers
          @shader.attributeLocation(pointer.name)?
              pointer = util.clone pointer
              pointer.location = location
              @shader.attributeLocation(pointer.name, location)
              @pointers[location] = pointer
              location += 1
       */
      _ref1 = this.vbo.getPointers();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pointer = _ref1[_i];
        location = this.shader.attributeLocation(pointer.name);
        if (location != null) {
          pointer = util.clone(pointer);
          pointer.location = location;
          this.shader.attributeLocation(pointer.name, location);
          _results.push(this.pointers[location] = pointer);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    State.prototype.destroy = function() {
      if (this.ownShader) {
        this.shader.destroy();
      }
      if (this.ownvbo) {
        this.vbo.destroy();
      }
      if (this.vao != null) {
        return this.gf.vao.deleteVertexArrayOES(this.vao);
      }
    };

    State.prototype.blendAlpha = function() {
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      return this.gl.enable(this.gl.BLEND);
    };

    State.prototype.blendAdd = function() {
      this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
      return this.gl.enable(this.gl.BLEND);
    };

    State.prototype.blendMultiply = function() {
      this.gl.blendFunc(this.gl.DST_COLOR, this.gl.ZERO);
      return this.gl.enable(this.gl.BLEND);
    };

    State.prototype.clearColor = function(r, g, b, a) {
      if (r == null) {
        r = 0;
      }
      if (g == null) {
        g = 0;
      }
      if (b == null) {
        b = 0;
      }
      if (a == null) {
        a = 1;
      }
      this.setSurface();
      this.gl.colorMask(true, true, true, true);
      this.gl.clearColor(r, g, b, a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      return this;
    };

    State.prototype.clearDepth = function(value) {
      if (value == null) {
        value = 1;
      }
      this.setSurface();
      this.gl.depthMask(true);
      this.gl.clearDepth(value);
      this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
      return this;
    };

    State.prototype.setViewport = function(width, height) {
      if (width == null) {
        width = this.gl.canvas.width;
      }
      if (height == null) {
        height = this.gl.canvas.height;
      }
      return this.gl.viewport(0, 0, width, height);
    };

    State.prototype.setPointers = function() {
      var location, pointer, _i, _len, _ref1;
      this.vbo.bind();
      _ref1 = this.pointers;
      for (location = _i = 0, _len = _ref1.length; _i < _len; location = ++_i) {
        pointer = _ref1[location];
        if (pointer != null) {
          if (!this.gf.vertexUnits[location].enabled) {
            this.gf.vertexUnits[location].enabled = true;
            this.gl.enableVertexAttribArray(pointer.location);
          }
          this.gl.vertexAttribPointer(pointer.location, pointer.size, pointer.type, true, pointer.stride, pointer.offset);
        } else {
          if (this.gf.vertexUnits[location].enabled) {
            this.gf.vertexUnits[location].enabled = false;
            this.gl.disableVertexAttribArray(location);
          }
        }
      }
    };

    State.prototype.setupVertexBuffer = function() {
      if (this.vao != null) {
        return this.gf.vao.bindVertexArrayOES(this.vao);
      } else {
        return this.setPointers();
      }
    };

    State.prototype.colorMask = function(r, g, b, a) {
      if (r == null) {
        r = true;
      }
      if (g == null) {
        g = true;
      }
      if (b == null) {
        b = true;
      }
      if (a == null) {
        a = true;
      }
      this.gl.colorMask(r, g, b, a);
      this.colorWrite[0] = r;
      this.colorWrite[1] = g;
      this.colorWrite[2] = b;
      this.colorWrite[3] = a;
      return this;
    };

    State.prototype.setupState = function() {
      this.setSurface();
      if (this.depthTest) {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.depthFunc);
      } else {
        this.gl.disable(this.gl.DEPTH_TEST);
      }
      this.gl.depthMask(this.depthWrite);
      this.gl.colorMask(this.colorWrite[0], this.colorWrite[1], this.colorWrite[2], this.colorWrite[3]);
      if (this.cullFace) {
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.cullFace);
      } else {
        this.gl.disable(this.gl.CULL_FACE);
      }
      if (this.blend != null) {
        this.blend();
      } else {
        this.gl.disable(this.gl.BLEND);
      }
      if (this.vbo.getMode() === this.gl.LINES || this.vbo.getMode() === this.gl.LINE_STRIP) {
        if (this.gf.lineWidth !== this.lineWidth) {
          this.gf.lineWidth = this.lineWidth;
          this.gl.lineWidth(this.lineWidth);
        }
      }
      this.shader.use();
      this.setupVertexBuffer();
      return this.gf.currentState = this;
    };

    State.prototype.viewport = function(x, y, width, height) {
      if (this.viewportParams != null) {
        this.viewportParams.x = x;
        this.viewportParams.y = y;
        this.viewportParams.width = width;
        this.viewportParams.height = height;
      } else {
        this.viewportParams = {
          x: x,
          y: y,
          width: width,
          height: height
        };
      }
      this.gl.viewport(x, y, width, height);
      return this;
    };

    State.prototype.setSurface = function() {
      if (this.framebuffer != null) {
        if (this.viewportParams != null) {
          this.gl.viewport(this.viewportParams.x, this.viewportParams.y, this.viewportParams.width, this.viewportParams.height);
        } else {
          this.framebuffer.viewport();
        }
        return this.framebuffer.use();
      } else {
        this.setViewport();
        if (this.gf.currentFramebuffer != null) {
          return this.gf.currentFramebuffer.unuse();
        }
      }
    };

    State.prototype.draw = function(first, count, mode) {
      var texture, unit, _i, _len, _ref1;
      _ref1 = this.textures;
      for (unit = _i = 0, _len = _ref1.length; _i < _len; unit = ++_i) {
        texture = _ref1[unit];
        texture.texture.bind(unit);
        this.int(texture.name, unit);
      }
      if (this.gf.currentState !== this) {
        this.setupState();
      }
      this.vbo.draw(first, count, mode);
      return this;
    };

    State.prototype.mat4 = function(name, value) {
      this.shader.mat4(name, value);
      return this;
    };

    State.prototype.mat3 = function(name, value) {
      this.shader.mat3(name, value);
      return this;
    };

    State.prototype.int = function(name, value) {
      this.shader.int(name, value);
      return this;
    };

    State.prototype.vec2 = function(name, a, b) {
      this.shader.vec2(name, a, b);
      return this;
    };

    State.prototype.vec3 = function(name, a, b, c) {
      this.shader.vec3(name, a, b, c);
      return this;
    };

    State.prototype.vec4 = function(name, a, b, c, d) {
      this.shader.vec4(name, a, b, c, d);
      return this;
    };

    State.prototype.uniformSetter = function(obj) {
      obj.setUniformsOn(this);
      return this;
    };

    State.prototype.float = function(name, value) {
      this.shader.float(name, value);
      return this;
    };

    State.prototype.sampler = function(name, texture) {
      var stored;
      stored = this.texturesByName[name];
      if (stored == null) {
        stored = {
          name: name,
          texture: texture
        };
        this.texturesByName[name] = stored;
        this.textures.push(stored);
      }
      if (stored.texture !== texture) {
        stored.texture = texture;
      }
      return this;
    };

    State.prototype.bind = function(unit) {
      if (unit == null) {
        unit = 0;
      }
      if (this.framebuffer != null) {
        this.framebuffer.bind(unit);
      } else {
        throw new Error('State has no attached framebuffer');
      }
      return this;
    };

    State.prototype.generateMipmap = function() {
      if (this.framebuffer != null) {
        this.framebuffer.generateMipmap();
      } else {
        throw new Error('State has no attached framebuffer');
      }
      return this;
    };

    State.prototype.anisotropy = function() {
      if (this.framebuffer != null) {
        this.framebuffer.anisotropy();
      } else {
        throw new Error('State has no attached framebuffer');
      }
      return this;
    };

    State.prototype.vertices = function(data) {
      this.vbo.vertices(data);
      return this;
    };

    State.prototype.cubeSide = function(name) {
      if (this.framebuffer != null) {
        this.framebuffer.cubeSide(name);
      } else {
        throw new Error('State has no attached framebuffer');
      }
      return this;
    };

    State.prototype.sizeEqual = function(width, height) {
      if (this.framebuffer != null) {
        return this.framebuffer.sizeEqual(width, height);
      } else {
        throw new Error('State has no attached framebuffer');
      }
    };

    State.prototype.setSize = function(width, height) {
      if (this.framebuffer != null) {
        return this.framebuffer.setSize(width, height);
      } else {
        throw new Error('State has no attached framebuffer');
      }
    };

    State.prototype.width = function() {
      if (this.framebuffer != null) {
        return this.framebuffer.width();
      } else {
        throw new Error('State has no attached framebuffer');
      }
    };

    State.prototype.height = function() {
      if (this.framebuffer != null) {
        return this.framebuffer.height();
      } else {
        throw new Error('State has no attached framebuffer');
      }
    };

    State.prototype.blit = function() {
      return this.framebuffer.blit();
    };

    State.prototype.readPixels = function(x, y, width, height) {
      if (this.framebuffer != null) {
        return this.framebuffer.readPixels(x, y, width, height);
      } else {
        throw new Error('State has no attached framebuffer');
      }
    };

    return State;

  })();
  return exports;
});
sys.defModule('/webgl/texture-float', function(exports, require, fs) {
  var draw, renderable;
  draw = function(gl, _arg) {
    var buffer, fragment, fragmentShader, positionLoc, program, sourceLoc, vertex, vertexShader, vertices;
    vertex = _arg.vertex, fragment = _arg.fragment;
    gl.activeTexture(gl.TEXTURE0);
    program = gl.createProgram();
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.attachShader(program, vertexShader);
    gl.shaderSource(vertexShader, vertex);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(vertexShader);
    }
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.attachShader(program, fragmentShader);
    gl.shaderSource(fragmentShader, fragment);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(fragmentShader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }
    gl.useProgram(program);
    vertices = new Float32Array([1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1]);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    sourceLoc = gl.getUniformLocation(program, 'source');
    if (sourceLoc != null) {
      gl.uniform1i(sourceLoc, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    return gl.deleteBuffer(buffer);
  };
  renderable = function(gl, targetType, channels) {
    var check, pixels, readbackFramebuffer, readbackTexture, sourceFramebuffer, sourceTexture;
    sourceTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, channels, 2, 2, 0, channels, targetType, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    sourceFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, sourceFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sourceTexture, 0);
    check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (check !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteTexture(sourceTexture);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return false;
    }
    draw(gl, {
      vertex: 'attribute vec2 position;\nvoid main(){\n    gl_Position = vec4(position, 0, 1);\n}',
      fragment: 'void main(){\n    gl_FragColor = vec4(0.5);\n}'
    });
    gl.deleteFramebuffer(sourceFramebuffer);
    readbackTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, readbackTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    readbackFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, readbackFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, readbackTexture, 0);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    draw(gl, {
      vertex: 'varying vec2 texcoord;\nattribute vec2 position;\nvoid main(){\n    texcoord = position*0.5+0.5;\n    gl_Position = vec4(position, 0, 1);\n}',
      fragment: 'precision highp int;\nprecision highp float;\nvarying vec2 texcoord;\nuniform sampler2D source;\nvoid main(){\n    gl_FragColor = texture2D(source, texcoord);\n}'
    });
    pixels = new Uint8Array(2 * 2 * 4);
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.deleteTexture(sourceTexture);
    gl.deleteTexture(readbackTexture);
    gl.deleteFramebuffer(readbackFramebuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    console.assert(gl.getError() === gl.NO_ERROR);
    return pixels[0] >= 126 && pixels[0] <= 128;
  };
  exports = function(gl) {
    var float16, float16linear, float32, float32linear, result;
    float16 = gl.getExtension('OES_texture_half_float');
    float16linear = gl.getExtension('OES_texture_half_float_linear');
    float32 = gl.getExtension('OES_texture_float');
    float32linear = gl.getExtension('OES_texture_float_linear');
    result = {};
    if (float16 != null) {
      result.float16 = {
        linear: float16linear != null,
        type: float16.HALF_FLOAT_OES,
        renderable: renderable(gl, float16.HALF_FLOAT_OES, gl.RGBA)
      };
    }
    if (float32 != null) {
      result.float32 = {
        linear: float32linear != null,
        type: gl.FLOAT,
        renderable: renderable(gl, gl.FLOAT, gl.RGBA)
      };
    }
    return result;
  };
  return exports;
});
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

sys.defModule('/webgl/texture', function(exports, require, fs) {
  var ConcreteTexture, CubeSide, Texture, Texture2D, TextureCube;
  exports.Texture = Texture = (function() {
    function Texture() {}

    return Texture;

  })();
  ConcreteTexture = (function(_super) {
    __extends(ConcreteTexture, _super);

    function ConcreteTexture(gf, params) {
      var clamp, filter, sClamp, tClamp, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      this.gl = this.gf.gl;
      this.handle = this.gl.createTexture();
      this.channels = this.gl[((_ref = params.channels) != null ? _ref : 'rgba').toUpperCase()];
      this.bind();
      if (typeof params.type === 'string') {
        this.type = this.gl[((_ref1 = params.type) != null ? _ref1 : 'unsigned_byte').toUpperCase()];
      } else {
        this.type = (_ref2 = params.type) != null ? _ref2 : this.gl.UNSIGNED_BYTE;
      }
      filter = (_ref3 = params.filter) != null ? _ref3 : 'nearest';
      if (typeof filter === 'string') {
        this[filter]();
      } else {
        this.minify = (_ref4 = this.gl[filter.minify.toUpperCase()]) != null ? _ref4 : this.gl.LINEAR;
        this.magnify = (_ref5 = this.gl[filter.magnify.toUpperCase()]) != null ? _ref5 : this.gl.LINEAR;
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.magnify);
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.minify);
      }
      clamp = (_ref6 = params.clamp) != null ? _ref6 : 'edge';
      if (typeof clamp === 'string') {
        this[clamp]();
      } else {
        if (clamp.s === 'edge') {
          sClamp = this.gl.CLAMP_TO_EDGE;
        } else if (clamp.s === 'repeat') {
          sClamp = this.gl.REPEAT;
        } else {
          throw new Error('unknown S clamp mode: ' + clamp.s);
        }
        if (clamp.t === 'edge') {
          tClamp = this.gl.CLAMP_TO_EDGE;
        } else if (clamp.t === 'repeat') {
          tClamp = this.gl.REPEAT;
        } else {
          throw new Error('unknown T clamp mode: ' + clamp.t);
        }
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, sClamp);
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, tClamp);
      }
    }

    ConcreteTexture.prototype.destroy = function() {
      return this.gl.deleteTexture(this.handle);
    };

    ConcreteTexture.prototype.generateMipmap = function() {
      this.mipmapped = true;
      this.bind();
      this.gl.generateMipmap(this.target);
      return this;
    };

    ConcreteTexture.prototype.anisotropy = function() {
      var ext, max;
      this.anisotropic = true;
      ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
      if (ext) {
        max = this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        this.gl.texParameterf(this.target, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
      }
      return this;
    };

    ConcreteTexture.prototype.linear = function() {
      this.bind();
      this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      return this;
    };

    ConcreteTexture.prototype.nearest = function() {
      this.bind();
      this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      return this;
    };

    ConcreteTexture.prototype.repeat = function() {
      this.bind();
      this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
      this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
      return this;
    };

    ConcreteTexture.prototype.edge = function() {
      this.bind();
      this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      return this;
    };

    ConcreteTexture.prototype.bind = function(unit) {
      if (unit == null) {
        unit = 0;
      }

      /*
      if @gf.textureUnits[unit] isnt @
          @gf.textureUnits[unit] = @
          @gl.activeTexture @gl.TEXTURE0+unit
          @gl.bindTexture @target, @handle
       */
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.gl.bindTexture(this.target, this.handle);
      return this;
    };

    return ConcreteTexture;

  })(exports.Texture);
  CubeSide = (function(_super) {
    __extends(CubeSide, _super);

    function CubeSide(handle, target) {
      this.handle = handle;
      this.target = target;
    }

    return CubeSide;

  })(exports.Texture);
  exports.TextureCube = TextureCube = (function(_super) {
    __extends(TextureCube, _super);

    function TextureCube(gf, params) {
      var _ref;
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      this.target = this.gf.gl.TEXTURE_CUBE_MAP;
      TextureCube.__super__.constructor.call(this, this.gf, params);
      this.negativeX = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
      this.negativeY = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
      this.negativeZ = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
      this.positiveX = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X);
      this.positiveY = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
      this.positiveZ = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
      this.size(params.size);
      if ((_ref = this.minify) === this.gl.NEAREST_MIPMAP_NEAREST || _ref === this.gl.LINEAR_MIPMAP_NEAREST || _ref === this.gl.NEAREST_MIPMAP_LINEAR || _ref === this.gl.LINEAR_MIPMAP_LINEAR) {
        this.generateMipmap();
      }
    }

    TextureCube.prototype.size = function(size) {
      this.size = size;
      this.bind();
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      return this;
    };

    TextureCube.prototype.dataSized = function(data, side, size) {
      this.size = size;
      this.bind();
      this.gl.texImage2D(this[side].target, 0, this.channels, this.size, this.size, 0, this.channels, this.type, data);
      return this;
    };

    return TextureCube;

  })(ConcreteTexture);
  exports.Texture2D = Texture2D = (function(_super) {
    __extends(Texture2D, _super);

    function Texture2D(gf, params) {
      var _ref;
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      this.target = this.gf.gl.TEXTURE_2D;
      Texture2D.__super__.constructor.call(this, this.gf, params);
      if (params.data instanceof Image) {
        this.dataImage(params.data);
      } else if ((params.width != null) && (params.height != null)) {
        if (params.data != null) {
          this.dataSized(params.data, params.width, params.height);
        } else {
          this.size(params.width, params.height);
        }
      }
      if ((_ref = this.minify) === this.gl.NEAREST_MIPMAP_NEAREST || _ref === this.gl.LINEAR_MIPMAP_NEAREST || _ref === this.gl.NEAREST_MIPMAP_LINEAR || _ref === this.gl.LINEAR_MIPMAP_LINEAR) {
        if (params.data != null) {
          this.generateMipmap();
        }
      }
    }

    Texture2D.prototype.loadImage = function(url, flipped) {
      var image;
      if (flipped == null) {
        flipped = false;
      }
      image = new Image();
      image.onload = (function(_this) {
        return function() {
          return _this.dataImage(image, flipped);
        };
      })(this);
      image.src = url;
      return this;
    };

    Texture2D.prototype.dataImage = function(data, flipped) {
      if (flipped == null) {
        flipped = false;
      }
      this.bind();
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, flipped);
      this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      this.gl.pixelStorei(this.gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this.gl.NONE);
      this.width = data.width;
      this.height = data.height;
      this.gl.texImage2D(this.target, 0, this.channels, this.channels, this.type, data);
      return this;
    };

    Texture2D.prototype.dataSized = function(data, width, height, flipped) {
      if (flipped == null) {
        flipped = false;
      }
      if (data instanceof Array) {
        data = new Uint8Array(data);
      }
      this.bind(10);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, flipped);
      this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
      this.width = width;
      this.height = height;
      this.gl.texImage2D(this.target, 0, this.channels, this.width, this.height, 0, this.channels, this.type, data);
      return this;
    };

    Texture2D.prototype.size = function(width, height) {
      this.width = width;
      this.height = height;
      this.bind();
      this.gl.texImage2D(this.target, 0, this.channels, this.width, this.height, 0, this.channels, this.type, null);
      return this;
    };

    Texture2D.prototype.draw = function(scale) {
      if (scale == null) {
        scale = 1;
      }
      return this.gf.blit.float('scale', scale).sampler('source', this).draw();
    };

    Texture2D.prototype.blit = function() {
      return this.draw();
    };

    Texture2D.prototype.read = function() {
      this.gf.readFBO.color(this);
      return console.log('here', this.width, this.height);
    };

    return Texture2D;

  })(ConcreteTexture);
  return exports;
});
sys.defModule('/webgl/util', function(exports, require, fs) {
  exports.clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };
  return exports;
});
sys.defModule('/webgl/vector', function(exports, require, fs) {
  var Vec3, Vec4, tau;
  tau = Math.PI * 2;
  exports.Vec3 = Vec3 = (function() {
    function Vec3(x, y, z) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      this.z = z != null ? z : 0;
      null;
    }

    Vec3.prototype.set = function(x, y, z) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      this.z = z != null ? z : 0;
      return this;
    };

    Vec3.prototype.set = function(x, y, z) {
      var other;
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      if (z == null) {
        z = 0;
      }
      if (typeof x === 'number') {
        this.x = x;
        this.y = y;
        this.z = z;
      } else {
        other = x;
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
      }
      return this;
    };

    Vec3.prototype.rotatey = function(angle) {
      var c, rad, s, x, z;
      rad = tau * (angle / 360);
      s = Math.sin(rad);
      c = Math.cos(rad);
      x = this.z * s + this.x * c;
      z = this.z * c - this.x * s;
      this.x = x;
      this.z = z;
      return this;
    };

    Vec3.prototype.normalize = function() {
      var l;
      l = this.slength();
      if (l > 0) {
        l = Math.sqrt(l);
        this.x /= l;
        this.y /= l;
        this.z /= l;
      }
      return this;
    };

    Vec3.prototype.multiply = function(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      this.w *= scalar;
      return this;
    };

    Vec3.prototype.add = function(other) {
      this.x += other.x;
      this.y += other.y;
      this.z += other.z;
      return this;
    };

    return Vec3;

  })();
  exports.Vec4 = Vec4 = (function() {
    function Vec4(x, y, z, w) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      this.z = z != null ? z : 0;
      this.w = w != null ? w : 1;
    }

    Vec4.prototype.normalize = function() {
      var l;
      l = this.slength();
      if (l > 0) {
        l = Math.sqrt(l);
        this.x /= l;
        this.y /= l;
        this.z /= l;
      }
      return this;
    };

    Vec4.prototype.slength = function() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    };

    Vec4.prototype.multiply = function(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      this.w *= scalar;
      return this;
    };

    Vec4.prototype.add = function(other) {
      this.x += other.x;
      this.y += other.y;
      this.z += other.z;
      this.w += other.w;
      return this;
    };

    Vec4.prototype.set = function(other) {
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
      this.w = other.w;
      return this;
    };

    return Vec4;

  })();
  return exports;
});
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

sys.defModule('/webgl/vertexbuffer', function(exports, require, fs) {
  var BaseBuffer, VertexBuffer, util;
  util = require('util');
  exports.BaseBuffer = BaseBuffer = (function() {
    function BaseBuffer() {}

    BaseBuffer.prototype.destroy = function() {
      throw new Error('base method');
    };

    BaseBuffer.prototype.bind = function() {
      throw new Error('base method');
    };

    BaseBuffer.prototype.getMode = function() {
      throw new Error('base method');
    };

    BaseBuffer.prototype.draw = function(first, count, mode) {
      throw new Error('base method');
    };

    BaseBuffer.prototype.getPointers = function() {
      throw new Error('base method');
    };

    return BaseBuffer;

  })();
  exports.VertexBuffer = VertexBuffer = (function(_super) {
    __extends(VertexBuffer, _super);

    function VertexBuffer(gf, _arg) {
      var mode, pointers, size, vertices, _ref;
      this.gf = gf;
      _ref = _arg != null ? _arg : {}, pointers = _ref.pointers, vertices = _ref.vertices, mode = _ref.mode, size = _ref.size, this.interleaved = _ref.interleaved;
      if (this.interleaved == null) {
        this.interleaved = true;
      }
      this.gl = this.gf.gl;
      this.buffer = this.gl.createBuffer();
      if (mode != null) {
        this.mode = this.gl[mode.toUpperCase()];
      } else {
        this.mode = this.gl.TRIANGLES;
      }
      if (pointers != null) {
        this.pointers(pointers);
      }
      if (vertices != null) {
        this.vertices(vertices);
      } else if (size != null) {
        this.size(size);
      }
    }

    VertexBuffer.prototype.getMode = function() {
      return this.mode;
    };

    VertexBuffer.prototype.getPointers = function() {
      return this.pointers;
    };

    VertexBuffer.prototype.destroy = function() {
      this.gl.deleteBuffer(this.buffer);
      return this;
    };

    VertexBuffer.prototype.update = function(params) {
      if (params.pointers != null) {
        this.pointers(params.pointers);
      }
      if (params.vertices != null) {
        this.vertices(params.vertices);
      }
      return this;
    };

    VertexBuffer.prototype.pointers = function(data) {
      var offset, pointer, _i, _len, _ref;
      offset = 0;
      this.pointers = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          pointer = data[_i];
          pointer = util.clone(pointer);
          if (pointer.size == null) {
            pointer.size = 4;
          }
          if (pointer.type == null) {
            pointer.type = 'float';
          }
          switch (pointer.type) {
            case 'float':
              pointer.type = this.gl.FLOAT;
              pointer.typeSize = 4;
              break;
            case 'byte':
              pointer.type = this.gl.BYTE;
              pointer.typeSize = 1;
              break;
            case 'short':
              pointer.type = this.gl.SHORT;
              pointer.typeSize = 2;
              break;
            case 'ubyte':
              pointer.type = this.gl.UNSIGNED_BYTE;
              pointer.typeSize = 1;
              break;
            case 'ushort':
              pointer.type = this.gl.UNSIGNED_SHORT;
              pointer.typeSize = 2;
              break;
            default:
              throw new Error('unknown pointer type: ' + pointer.type);
          }
          pointer.byteSize = pointer.typeSize * pointer.size;
          if (pointer.offset == null) {
            pointer.offset = offset;
          }
          offset += pointer.byteSize;
          _results.push(pointer);
        }
        return _results;
      }).call(this);
      if (this.interleaved) {
        _ref = this.pointers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pointer = _ref[_i];
          if (pointer.stride == null) {
            pointer.stride = offset;
          }
        }
        this.stride = offset;
      } else {
        this.stride = null;
      }
      return this;
    };

    VertexBuffer.prototype.vertices = function(data) {
      if (data instanceof Array) {
        data = new Float32Array(data);
      }
      if (this.interleaved) {
        this.count = data.byteLength / this.stride;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      } else {
        this.count = data.count;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data.data, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      }
      return this;
    };

    VertexBuffer.prototype.size = function(size) {
      this.count = size / this.stride;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, size, this.gl.STATIC_DRAW);
      return this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    };

    VertexBuffer.prototype.subData = function(offset, data) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offset, data);
      return this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    };

    VertexBuffer.prototype.bind = function() {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      return this;
    };

    VertexBuffer.prototype.unbind = function() {
      this.gf.currentVertexbuffer = null;
      return this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    };

    VertexBuffer.prototype.draw = function(first, count, mode) {
      if (first == null) {
        first = 0;
      }
      if (count == null) {
        count = this.count;
      }
      if (mode == null) {
        mode = this.mode;
      }
      this.gl.drawArrays(mode, first, count);
      return this;
    };

    return VertexBuffer;

  })(BaseBuffer);
  return exports;
});
sys.main();
})();