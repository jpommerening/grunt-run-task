var grunt = require('grunt');
var log = require('grunt-legacy-log');
var Writable = require('stream').Writable;
var inherits = require('util').inherits;
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

grunt.registerMultiTask = (function (obj, method) {
  return function (name) {
    multiTasks.push(name);
    method.apply(obj, arguments);
  };
})(grunt.task, grunt.task.registerMultiTask);

function Task(name, config) {
  if (!(this instanceof Task)) {
    return new Task(name, config);
  }

  var args = name.split(':');

  this.grunt = grunt;
  this.grunt.log = new log.Log({muted: true});
  this.grunt.verbose = this.grunt.log.verbose;
  this.name = args.shift();
  this.multi = multiTasks.indexOf(name) >= 0;
  this.target = this.multi ? args.shift() : null;
  this.args = args;
  this.config = {};
  this.files = [];
  this.stdout = null;

  var c = {};
  c[this.name] = config || {};

  this.grunt.initConfig(c);
}

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
    var outStream = task.grunt.log.outStream;
    var config = task.grunt.config.get(task.name);


    task.target = task.multi ? (tark.target || Object.keys(config)[0] || 'default') : null;
    task.config = task.multi ? config[task.target] : config;
    task.files = task.grunt.task.normalizeMultiTaskFiles(task.config);

    task.grunt.log.options.outStream = new BufferStream(function (err, data) {
      if (err) {
        return done(err);
      }
      task.stdout = data;
    });

    task.grunt.task.options({
      error: function (err) {
        console.log('error');
        console.log(task.stdout);
        task.grunt.log.options.outStream.end();
        task.grunt.log.options.outStream = outStream;
        done(err);
      },
      done: function () {
        console.log('done');
        done()
      }
    });

    console.log(args.join(':'), config);
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

Task.prototype.clean = function(/* [files...], [done] */) {
  var args = [].slice.apply(arguments);
  var task = this;

  function clean(done) {
    console.log(task.files);
    done();
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
  'loadNpmTasks' ].forEach(function (fn) {
  runTask[fn] = grunt[fn].bind(grunt);
});

module.exports = runTask;
