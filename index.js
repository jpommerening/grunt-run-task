/*jshint node: true*/
'use strict';

var forceRequire = require('./require');
var grunt = forceRequire('grunt', require);
var log = require('grunt-legacy-log');
var Writable = require('readable-stream').Writable;
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var inherits = require('inherits');
var rimraf = require('rimraf');
var multiTasks = [];

function BufferStream(done, options) {
  Writable.call(this, options);

  var data = [];

  this._write = function (chunk, encoding, callback) {
    data.push(chunk);
    callback();
  };
  this.on('finish', function () {
    done(null, Buffer.concat(data));
  });
  this.on('error', function (err) {
    done(err);
  });
}
inherits(BufferStream, Writable);

function spy(obj, method, callback) {
  var original = obj[method];
  return (obj[method] = function () {
    callback.apply(obj, arguments);
    return original.apply(obj, arguments);
  });
}

grunt.registerMultiTask = spy(grunt.task, 'registerMultiTask', function (name) {
  multiTasks.push(name);
});

grunt.renameTask = spy(grunt.task, 'renameTask', function (oldName, newName) {
  var i;
  if ((i = multiTasks.indexOf(oldName)) >= 0) {
    multiTasks[i] = newName;
  }
});

function Task(name, config) {
  if (!(this instanceof Task)) {
    return new Task(name, config);
  }

  EventEmitter2.apply(this);

  var args = name.split(':');

  this.grunt = grunt;
  this.grunt.log = new log.Log({muted: true});
  this.grunt.verbose = this.grunt.log.verbose;
  this.name = args.shift();
  this.config = config;
  this.multi = multiTasks.indexOf(this.name) >= 0;
  this.target = this.multi ? args.shift() : null;
  this.args = args;
  this.data = {};
  this.files = [];
  this.stdout = null;
}
inherits(Task, EventEmitter2);

Task.prototype.run = function (/* [arguments...], done */) {
  var args = this.args.concat([].slice.apply(arguments));
  var task = this;

  if (task.target) {
    args.unshift(task.target);
  } else if (task.multi) {
    args.unshift('');
  }
  args.unshift(task.name);

  function run(done) {
    var warn = task.grunt.fail.warn;
    var fatal = task.grunt.fail.fatal;
    var outStream = task.grunt.log.options.outStream;
    var config = task.config || {};
    var finished = false;

    /*jshint validthis: true*/
    function any() {
      var args = [].slice.apply(arguments);
      args.unshift(this.event);
      task.emit.apply(task, args);
    }

    function end() {
      if (!finished) {
        finished = true;

        task.grunt.log.options.outStream.end();
        task.grunt.log.options.outStream = outStream;
        task.grunt.fail.warn = warn;
        task.grunt.fail.fatal = fatal;

        task.grunt.event.offAny(any);

        done.apply(task, arguments);
      }
    }

    task.grunt.config.set(task.name, config);
    config = task.grunt.config.get(task.name);
    task.target = task.multi ? (task.target || Object.keys(config)[0] || 'default') : null;
    task.data = task.multi ? config[task.target] : config;
    task.files = task.grunt.task.normalizeMultiTaskFiles(task.data, task.target);

    task.grunt.log.options.outStream = new BufferStream(function (err, data) {
      task.stdout = data;
    });

    task.grunt.fail.warn = end;
    task.grunt.fail.fatal = end;

    task.grunt.task.options({
      error: end,
      done: end
    });

    task.grunt.event.onAny(any);

    task.grunt.task.run(args.join(':'));
    task.grunt.task.start({asyncDone: true});
  }

  if (typeof args[args.length-1] === 'function') {
    run(args.pop());
    return this;
  } else {
    return run;
  }
};

Task.prototype.fail = function() {
  var args = [].slice.apply(arguments);
  var task = this;

  function expectError(done) {
    return function (err) {
      if (!err) {
        done(new Error('Expected ' + task.name + ' task to fail'));
      } else {
        done(null, err);
      }
    };
  }

  if (typeof args[args.length-1] === 'function') {
    args.push(expectError(args.pop()));
    return task.run.apply(task, args);
  } else {
    return function(done) {
      args.push(expectError(done));
      task.run.apply(task, args);
    };
  }
};

Task.prototype.clean = function(/* [files...], [done] */) {
  var args = [].slice.apply(arguments);
  var task = this;

  function clean(done) {
    var remain = task.files.length;

    function one(err) {
      if (err && remain > 0) {
        remain = 0;
        return done(err);
      }

      remain -= 1;
      if (remain === 0) {
        done();
      }
    }

    if (remain) {
      task.files.forEach(function (file) {
        rimraf(file.dest, one);
      });
    } else {
      done();
    }
  }

  if (typeof args[args.length-1] === 'function') {
    clean(args.pop());
    return this;
  } else {
    return clean;
  }
};

function runTask(name, config /* [arguments...], [done] */) {
  var task = new Task(name, config);

  return task.run.apply(task, [].slice.call(arguments, 2));
}

runTask.task = function create(name, config) {
  return new Task(name, config);
};

[ 'initConfig',
  'registerTask',
  'registerMultiTask',
  'renameTask',
  'loadTasks',
  'option',
  'loadNpmTasks' ].forEach(function (fn) {
  runTask[fn] = grunt[fn].bind(grunt);
});

/* load this module's task */
if( grunt.file.exists( 'tasks' ) ) {
  runTask.loadTasks( 'tasks' );
}

module.exports = runTask;
