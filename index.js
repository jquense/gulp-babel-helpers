'use strict';
var babel   = require("babel-core")
  , gutil = require('gulp-util')
  , through = require('through2')
  , mkdirp  = require('mkdirp')
  , applySourceMap = require('vinyl-sourcemaps-apply')
  , path = require('path')
  , fs = require('fs');

module.exports = babelTransform

// for the bits that aren't mine:
// https://github.com/babel/gulp-babel/blob/master/license
function babelTransform(opts, helperPath, dest){

  var helpers = [];

  opts = opts || {};

  return through.obj(function transpile(file, enc, cb) {
    var res;

    if (file.isNull())   return cb(null, file)
    if (file.isStream()) return cb(
      new gutil.PluginError('gulp-babel-helpers', 'Streaming not supported'))

    try {
      opts.filename = file.path
      opts.filename = file.relative
      opts.sourceMap = !!file.sourceMap
      opts.externalHelpers = true
      opts.returnUsedHelpers = true

      res = babel.transform(file.contents.toString(), opts);

      if (file.sourceMap && res.map) 
        applySourceMap(file, res.map);
      
      res.usedHelpers.forEach(function(helper){
        helpers.push(helper)
      })

      if ( res.usedHelpers.length )
        res.code = insertHelperRequire(file, res.code, helperPath)

      file.contents = new Buffer(res.code)

      this.push(file);
    } 
    catch (err) {
      this.emit('error'
        , new gutil.PluginError('gulp-babel-helpers', err, { fileName: file.path }));
   }

    cb();
  }
  , function onEnd(cb){

    if ( !helpers.length ) 
      return cb()

    var str = babel.buildExternalHelpers(helpers, 'umd');

    try {
      fs.writeFileSync(dest, str) //async didn't work...
    }
    catch (err) {
      if (err.code == 'ENOENT') {
        mkdirp.sync(path.dirname(dest));
        fs.writeFileSync(dest, str)
      }
      else throw err
    }
    finally {
      cb()
    }
  });
}

function insertHelperRequire(file, code, dest){
  var requirePath = path.relative(
        path.dirname(file.path), 
        path.join(file.base, dest)
      )
    , lines = code.split(/\r\n|\r|\n/g)
    , idx = lines[0].indexOf('use strict') !== -1 ? 1 : 0;

  if ( requirePath[0] !== path.sep && requirePath[0] !== '.')
    requirePath = '.' + path.sep + requirePath

  lines.splice(idx, 0, 'var babelHelpers = require("' + requirePath.replace(/\\/g, '/') + '");')

  return lines.join('\n');
}