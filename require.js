/*jshint node: true*/
'use strict';

function extract(object) {
  var values = Object.create(null);
  Object.keys(object).forEach(function (key) {
    values[key] = object[key];
    delete object[key];
  });
  return values;
}

function clear(object) {
  Object.keys(object).forEach(function (key) {
    delete object[key];
  });
}

function update(object, values) {
  Object.keys(values).forEach(function (key) {
    object[key] = values[key];
  });
  return object;
}

module.exports = function forceRequire(module, require) {
  var cache = extract(require.cache);
  var exports = require(module);
  clear(require.cache);
  update(require.cache, cache);
  return exports;
};
