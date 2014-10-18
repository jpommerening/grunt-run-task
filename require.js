/*jshint node: true*/
'use strict';

module.exports = function forceRequire(module, require) {
  var cache = extract(require.cache);
  var file = require.resolve(module);
  var exports = require(module);
  delete require.cache[file];
  update(require.cache, cache);
  return exports;
};

function extract(object) {
  var values = Object.create(null);
  Object.keys(object).forEach(function (key) {
    values[key] = object[key];
    delete object[key];
  });
  return values;
}

function update(object, values) {
  Object.keys(values).forEach(function (key) {
    object[key] = values[key];
  });
  return object;
}
