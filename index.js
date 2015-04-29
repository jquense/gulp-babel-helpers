'use strict';
var babel   = require("babel-core")
  , gutil = require('gulp-util')
  , through = require('through2')
  , applySourceMap = require('vinyl-sourcemaps-apply')
  , path = require('path')
  , assign = require('xtend')
  , Transformer = babel.Transformer
  , t = babel.types
  , fs = require('fs');

module.exports = babelTransform

// for the bits that aren't mine:
// https://github.com/babel/gulp-babel/blob/master/license
function babelTransform(opts, helperPath){
  var helpers = []
    , helperOpts
    , outputType
    , plugins, base, cwd;

  if (typeof opts === 'string')
    helperPath = opts, opts = {}

  opts = assign(opts || {})
  
  plugins = (opts.plugins || []).slice()

  helperOpts = opts.babelHelpers || {}

  delete opts.babelHelpers
  
  outputType = helperOpts.outputType || 'umd'

  return through.obj(function transpile(file, enc, cb) {
    var res;

    if (file.isNull())   return cb(null, file);
    if (file.isStream()) return cb(new gutil.PluginError('gulp-babel-helpers', 'Streaming not supported'))


    !base && (base = file.base)
    !cwd  && (cwd = file.cwd)

    try {
      opts.filename = file.relative
      opts.sourceMap = !!file.sourceMap
      opts.externalHelpers = true
      opts.metadataUsedHelpers = true
      console.log(opts.plugins, plugins)
      opts.plugins = plugins.concat({ 
        transformer: getHelperPlugin(file, helperPath, outputType), 
        position: 'after' 
      })

      res = babel.transform(file.contents.toString(), opts);

      if (file.sourceMap && res.map) 
        applySourceMap(file, res.map);
      
      res.metadata.usedHelpers.forEach(function(helper){
        helpers.push(helper)
      })

      file.contents = new Buffer(res.code)      
    } 
    catch (err) {
      return cb(new gutil.PluginError('gulp-babel-helpers', err, { fileName: file.path }) );
    }

    cb(null, file)
  }
  , function onEnd(cb){
    if ( !helpers.length ) 
      return cb()

    var str = babel.buildExternalHelpers(helpers, outputType)

    this.push(new gutil.File({
      path: helperPath,
      contents: new Buffer(str)
    }))

    cb()
  });
}

function getHelperPlugin(file, dest, outputType){
  var requirePath = path.relative(
        path.dirname(file.path), 
        path.join(file.base, dest)
      );

  if ( requirePath[0] !== path.sep && requirePath[0] !== '.')
    requirePath = '.' + path.sep + requirePath

  requirePath = requirePath.replace(/\\/g, '/')

  return new Transformer('insert-helper-require', {
    Program: function(node, parent, scope, file) {
      var modulePath = file.resolveModuleSource(requirePath)
        , name = 'babelHelpers'
        , id = file.dynamicImportIds[name] = t.identifier(name);

      var hasHelper = Object.keys(file.usedHelpers || {}).some(function(key){
        return file.usedHelpers[key]
      })

      if ( !hasHelper) 
        return node

      var first = node.body[0]
        , declar = t.variableDeclaration("var", [
          t.variableDeclarator(id, 
            t.callExpression(
              t.identifier("require"), [ t.literal(modulePath) ]
            )
          )
        ])

      if (t.isExpressionStatement(first) && t.isLiteral(first.expression, { value: "use strict" })) {
        node.body.splice(1, 0, declar)
      }
      else
        node.body.unshift(declar)

      return node
    }
  })
}
