
var grunt;

function Task(name, config) {
  if (!(this instanceof Task)) {
    return new Task(name, config);
  }

  this.name = name;
  this.config = config;
  this.multi = true;
}

Task.prototype.run = function (/* [arguments...], [done] */) {
  var args;
  var done;

  return this;
};

task.prototype.clean = function(/* [files...], [done] */) {
  var files;
  var done;

  return this;
};

function runTask(name, config /* [arguments...], [done] */) {
  var task = new Task(name, config);

  return task.run.apply(task, [].slice.call(arguments, 2));
}

runTask.task = function create(name, config) {
  return new Task(name, config);
};

runTask.grunt = function(g) {
  grunt = g;
  return runTask;
};

module.exports = runTask;
