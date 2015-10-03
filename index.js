'use strict';
var babel   = require("babel-core")
  , gulpBabel = require('gulp-babel')
  , plugin = require('babel-plugin-external-helpers')
  , gutil = require('gulp-util')
  , through = require('through2')
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

    opts.extra = assign(opts.extra, {
      externalHelperPlugin: {
        path: helperPath,
        base: file.base
      }
    })

    opts.plugins = plugins.concat(
      getPlugin())

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

function getPlugin() {
  return {
    position: 'after',
    transformer: plugin
  }
}
