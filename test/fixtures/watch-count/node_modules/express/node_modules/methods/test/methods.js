var http = require('http');
var assert = require('assert');
var methods = require('..');

describe('methods', function() {

  if (http.METHODS) {

    it('is a lowercased http.METHODS', function() {
      var lowercased = http.METHODS.map(function(method) {
        return method.toLowerCase();
      });
      assert.deepEqual(lowercased, methods);
    });

  } else {

    it('contains GET, POST, PUT, and DELETE', function() {
      assert.notEqual(methods.indexOf('get'), -1);
      assert.notEqual(methods.indexOf('post'), -1);
      assert.notEqual(methods.indexOf('put'), -1);
      assert.notEqual(methods.indexOf('delete'), -1);
    });

    it('is all lowercase', function() {
      for (var i = 0; i < methods.length; i ++) {
        assert(methods[i], methods[i].toLowerCase(), methods[i] + " isn't all lowercase");
      }
    });

  }

});
