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
var initTasks = [];

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

grunt.registerInitTask = spy(grunt.task, 'registerInitTask', function (name) {
  initTasks.push(name);
});

grunt.renameTask = spy(grunt.task, 'renameTask', function (oldName, newName) {
  var i;
  if ((i = multiTasks.indexOf(oldName)) >= 0) {
    multiTasks[i] = newName;
  }
  if ((i = initTasks.indexOf(oldName)) >= 0) {
    initTasks[i] = newName;
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
  this.init = initTasks.indexOf(this.name) >= 0;
  this.target = this.multi ? args.shift() : null;
  this.args = args;
  this.files = [];
  this.stdout = null;
}
inherits(Task, EventEmitter2);

Task.prototype.run = function (/* [arguments...], done */) {
  var args = this.args.concat([].slice.apply(arguments));
  var task = this;
  var grunt = task.grunt;


  function run(done) {
    var warn = grunt.fail.warn;
    var fatal = grunt.fail.fatal;
    var outStream = grunt.log.options.outStream;
    var name = task.name;
    var target;
    var data;
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

        grunt.log.options.outStream.end();
        grunt.log.options.outStream = outStream;
        grunt.fail.warn = warn;
        grunt.fail.fatal = fatal;

        grunt.event.offAny(any);

        done.apply(task, arguments);
      }
    }

    if (task.config) {
      grunt.config.set(name, task.config);
    }

    grunt.log.options.outStream = new BufferStream(function (err, data) {
      task.stdout = data;
    });

    grunt.fail.warn = end;
    grunt.fail.fatal = end;

    grunt.task.options({
      error: end,
      done: end
    });

    grunt.event.onAny(any);

    if (task.multi) {
      target = task.target || Object.keys(task.config)[0] || 'default';
      data = grunt.config.get([name, target]);
      args.unshift(name, target);
      grunt.task.normalizeMultiTaskFiles(data, target).forEach(function (file) {
        task.files.push(file.dest);
      });
    } else {
      data = grunt.config.get([name]);
      args.unshift(name);
    }

    grunt.task.run(args.join(':'));
    grunt.task.start({asyncDone: true});
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
    var files = task.files;
    var remain = files.length;

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
      task.files = [];
      files.forEach(function (file) {
        rimraf(file, one);
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
  'registerInitTask',
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
