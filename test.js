var should = require('should');
var gutil = require('gulp-util');
var join = require('path').join;

var plugin = require('./index')
  , rimraf  = require('rimraf');

var CODE = 'let hi = () => 5;';


describe('gulp babel helpers', function(){

  it('should transform file', function (done) {
    var stream = plugin({ stage: 0}, "./dir/helpers.js");
    var streamFile = createFile('let hi = 5;');

    stream.once('data', function (data) {
      data.contents.toString().should.equal('"use strict";\n\nvar hi = 5;')
      done()
    });

    stream.write(streamFile);
    stream.end();
  });


  it('should inject helper module', function (done) {
    var stream = plugin({
       stage: 0
    }, "./dir/helpers.js");

    var streamFile = createFile('var { hi, ...rest } = { hi: 5, a: 3, b: 4 };');

    stream.once('data', function (data) {
      data.contents.toString()
        .should.containEql('var babelHelpers = require("./helpers.js")')
          .and.containEql(' babelHelpers.objectWithoutProperties');

      done();
    });

    stream.write(streamFile);
    stream.end();
  });

  it('should inject below use strict', function (done) {
    var stream = plugin({
       stage: 0
    }, "./dir/helpers.js");

    var streamFile = createFile('//hey\n "use strict";\n\nvar { hi, ...rest } = { hi: 5, a: 3, b: 4 };');

    stream.once('data', function (data) {
      data.contents.toString()
        .should.containEql('var babelHelpers = require("./helpers.js")')
          .and.containEql(' babelHelpers.objectWithoutProperties');

      done();
    });

    stream.write(streamFile);
    stream.end();
  });

  it('should not inject when helpers aren\'t used', function (done) {
    var stream = plugin({
       stage: 0
    }, "./dir/helpers.js");

    var streamFile = createFile('\n\nvar { hi} = { hi: 5, a: 3, b: 4 };');

    stream.once('data', function (data) {
      data.contents.toString()
        .should.not.containEql('var babelHelpers = require("./helpers.js")')
          .and.not.containEql(' babelHelpers.objectWithoutProperties');

      done();
    });

    stream.write(streamFile);
    stream.end();
  });

  it('should work with multiple files', function (done) {
    var stream = plugin({
       stage: 0
    }, "./dir/helpers.js");

    var streamFile = createFile('\n\nvar { hi} = { hi: 5, a: 3, b: 4 };');

    stream.once('finish', function () {
      done();
    });

    stream.write(streamFile);
    stream.write(streamFile);
    stream.end();
  });

  it('should add helpers to stream', function (done) {
    var stream = plugin({
      stage: 0
    }, "./dir/helpers.js");

    var streamFile = createFile('var { hi, ...rest } = { hi: 5, a: 3, b: 4 };')
      , files = [];

    stream.on('data', function(file){
      files.push(file)
      //console.log('hi')
    })

    stream.once('finish', function () {
      var helpers = files.pop()

      helpers.contents.toString()
        .should.containEql(' babelHelpers.objectWithoutProperties = ')

      done();
    });

    stream.write(streamFile);
    stream.end();
  });

})


function createFile(contents){
  var path = join(__dirname, './dir/somefile.jsx');

  return new gutil.File({
    cwd: __dirname,
    base: __dirname,
    path: path,
    contents: new Buffer(contents)
  })
}