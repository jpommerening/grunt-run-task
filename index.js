var grunt = require('grunt');
var multiTasks = [];

grunt.registerMultiTask = (function (obj, method) {
  return function(name) {
    multiTasks.push(name);
    method.apply(obj, arguments);
  };
})(grunt.task, grunt.task.registerMultiTask);

function Task(name, config) {
  if (!(this instanceof Task)) {
    return new Task(name, config);
  }

  this.name = name;
  this.config = config;
  this.multi = multiTasks.indexOf(name) >= 0;
}

Task.prototype.run = function (/* [arguments...], [done] */) {
  var args = [].slice.apply(arguments);
  var task = this.name;
  var done;

  if (typeof args[args.length-1] === 'function') {
    done = args.pop();
  }

  grunt.task.options( {
    error: function( err ) {
      done( err );
    },
    done: done
  } );
  grunt.initConfig( {} );

  if (this.multi) {
    task += ':default';
    grunt.config(this.name, {
      default: this.config
    });
  } else {
    grunt.config(this.name, this.config);
  }

  if (args.length > 0) {
    task += ':' + args.join(':');
  }

  grunt.task.run(task);
  grunt.task.start({ asyncDone: true });

  return this;
};

Task.prototype.clean = function(/* [files...], [done] */) {
  var files = [].slice.apply(arguments);
  var done;

  if (typeof files[files.length-1] === 'function') {
    done = files.pop();
  }

  return this;
};

function runTask(name, config /* [arguments...], [done] */) {
  var task = new Task(name, config);

  return task.run.apply(task, [].slice.call(arguments, 2));
}

runTask.task = function create(name, config) {
  return new Task(name, config);
};

runTask.loadTasks = grunt.loadTasks.bind(grunt);
runTask.loadNpmTasks = grunt.loadNpmTasks.bind(grunt);

module.exports = runTask;
