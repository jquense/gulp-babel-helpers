'use strict';
var babel   = require("babel-core")
  , gulpBabel = require('gulp-babel')
  , gutil = require('gulp-util')
  , through = require('through2')
  , applySourceMap = require('vinyl-sourcemaps-apply')
  , path = require('path')
  , assign = require('xtend')
  , fs = require('fs');

module.exports = gulpBabelHelpers
module.exports.plugin = plugin


function gulpBabelHelpers(opts, helperPath) {
  var helpers = []
    , helperOpts, outputType, plugins, base, cwd;

  if (typeof opts === 'string')
    helperPath = opts, opts = {}

  opts = assign(opts || {})
  plugins = (opts.plugins || []).slice()

  helperOpts = opts.babelHelpers || {}
  outputType = helperOpts.outputType || 'umd'

  delete opts.babelHelpers

  return through.obj(function(file, enc, cb) {
    var self = this;

    opts.externalHelpers = true

    opts.plugins = plugins.concat(
      plugin(helperPath))

    var stream = gulpBabel(opts)

    stream.on('readable', function(){
      var file;
      while (file = this.read()){
        file.babel.usedHelpers.forEach(function(helper){
          helpers.push(helper)
        })
        self.push(file)
      }
      cb()
    })

    stream.write(file)
  }, onEnd)

  function onEnd(cb){
    if (!helpers.length) return cb()

    var str = babel.buildExternalHelpers(helpers, outputType)

    this.push(new gutil.File({
      path: helperPath,
      contents: new Buffer(str)
    }))
    cb()
  }
}

function plugin(helperPath) {

  return {
    position: 'after',
    transformer: plugin
  }

  function plugin(babel) {
    var Plugin = babel.Plugin || babel.Transformer
      , t = babel.types;

    return new Plugin('insert-helper-require', {
      visitor: {

        Program: function(node, parent, scope, file) {
          var filepath = path.normalize(file.opts.filename)
            , cwd = filepath.substr(0, filepath.indexOf(path.normalize(file.opts.filenameRelative)))
            , importPath = getPath(filepath, cwd, helperPath)

          var modulePath = file.resolveModuleSource(importPath)
            , name = 'babelHelpers'
            , id = file.dynamicImportIds[name] = t.identifier(name);

          if (!Object.keys(file.usedHelpers || {}).length)
            return node

          var first = node.body[0]
            , declar = t.variableDeclaration("var", [
              t.variableDeclarator(id,
                t.callExpression(
                  t.identifier("require"), [ t.literal(modulePath) ]
                )
              )
            ])

          if (t.isExpressionStatement(first) && t.isLiteral(first.expression, { value: "use strict" }))
            node.body.splice(1, 0, declar)
          else
            node.body.unshift(declar)

          return node
        }
      }
    })
  }
}

function getPath(filePath, pathBase, dest) {
  var requirePath = path.relative(
        path.dirname(filePath),
        path.join(pathBase, dest)
      );

  if (requirePath[0] !== path.sep && requirePath[0] !== '.')
    requirePath = '.' + path.sep + requirePath

  return requirePath.replace(/\\/g, '/')
}

