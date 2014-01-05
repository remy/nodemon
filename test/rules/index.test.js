'use strict';
/*global describe:true, it: true, beforeEach: true */
var fs = require('fs'),
    nodemon = require('../../lib/nodemon'),
    rules = require('../../lib/rules'),
    assert = require('assert');

function loadfixtures(sample) {
  var path = './test/fixtures/' + sample;
  return {
    content: fs.readFileSync(path, 'utf8'),
    path: path
  };
}

describe('nodemon rules', function () {
  var fixtures = {
    comments: loadfixtures('comments'),
    regexp: loadfixtures('regexp'),
    default: loadfixtures('default'),
    simple: loadfixtures('simple'),
    simplejson: loadfixtures('simple.json')
  };

  beforeEach(function () {
    nodemon.reset();
  });

  it('should be resetable', function (done) {
    nodemon.reset();
    rules.load('./test/fixtures/simple.json', function () {
      nodemon.reset();

      rules.load('./test/fixtures/comments', function (error, rules) {
        assert.deepEqual(rules, { watch: [], ignore: [] }, 'rules are empty: ' + JSON.stringify(rules));
        done();
      });

    });
  });


  it('should read json', function (done) {
    rules.load('./test/fixtures/simple.json', function (error, rules) {
      assert(typeof rules === 'object', 'rules file is parsed');
      done();
    });
  });

  it('should ignore comments files', function (done) {
    rules.load(fixtures.comments.path, function (error, rules) {
      assert.equal(rules.ignore.length, 0, 'zero ignore rules');
      done();
    });
  });

  it('should allow comments on lines', function (done) {
    rules.load(fixtures.simple.path, function (error, rules) {
      rules.ignore.forEach(function (rule) {
        assert.equal(rule.indexOf('# comment'), -1, 'no comment found');
      });
      done();
    });
  });

  it('should ignore regular expressions', function (done) {
    rules.load(fixtures.regexp.path, function (error, rules) {
      assert.deepEqual(rules, { 'watch': [], 'ignore': [] }, 'rules are empty');
      done();
    });
  });
});