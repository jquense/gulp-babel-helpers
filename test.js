var should = require('should');
var gutil = require('gulp-util');
var join = require('path').join;

var plugin = require('./index')
  , rimraf  = require('rimraf');

var CODE = 'let hi = () => 5;';


describe('gulp babel helpers', function(){

  afterEach(function(done){
    rimraf('./helpers.js', done)
  });

  it('should pass the file on if null', function(done){
   var stream = plugin();
    var emptyFile = {
      isNull: function () { return true; }
    };
    
    stream.once('data', function (data) {
      data.should.equal(emptyFile);
      done();
    });
    stream.write(emptyFile);
    stream.end();
  });


  it('should emit error when file isStream()', function (done) {
    var stream = plugin();
    var streamFile = {
      isNull: function () { return false; },
      isStream: function () { return true; }
    };
    stream.once('error', function (err) {
      err.message.should.equal('babel: Streaming not supported');
      done();
    });
    stream.write(streamFile);
    stream.end();
  });

  it('should transform file', function (done) {
    var stream = plugin();
    var streamFile = createFile('let hi = 5;');

    stream.once('data', function (data) {
      data.contents.toString().should.equal('"use strict";\n\nvar hi = 5;')
      done();
    });

    stream.write(streamFile);
    stream.end();
  });


  it('should inject helper module', function (done) {
    var stream = plugin({ 
      experimental: true 
    }, "./dir/helpers.js", "./helpers.js");

    var streamFile = createFile('var { hi, ...rest } = { hi: 5, a: 3, b: 4 };');

    stream.once('data', function (data) {
      
      data.contents.toString()
        .should.containEql('var babelHelpers = require("./helpers.js")');

      done();
    });

    stream.write(streamFile);
    stream.end();
  });

  it('should create helpers', function (done) {
    var stream = plugin({ 
      experimental: true 
    }, "./dir/helpers.js", "./helpers.js");

    var streamFile = createFile('var { hi, ...rest } = { hi: 5, a: 3, b: 4 };');

    stream.once('finish', function () {
      var helpers = require('./helpers')

      helpers.should.have.property('objectWithoutProperties')

      done();
    });

    stream.write(streamFile);
    stream.end();
  });

})


function createFile(contents){
  var base = join(__dirname, 'dir');
  var path = join(__dirname, 'somefile.jsx');

  return new gutil.File({
    cwd: __dirname,
    base: base,
    path: path,
    contents: new Buffer(contents)
  })
}