# grunt-run-task

> Run Grunt tasks in you tests, so you can test them.

So you want to test your Grunt tasks, eh? And you don't want to litter your
project's _Gruntfile_ with tasks that are needed "just for the tests"? And
you want your tests to be self-contained? _Then this module is for you!_

## Whatsitdo?

This package gives you the tools to run Grunt tasks inside your tests and
clean up afterwards. You can use your test tool's setup and tear down methods
to run the Grunt task you want to test with arbitrary configuration.

If you're using BDD it could look like this:

```javascript
var grunt = require('grunt');
var runTask = require('grunt-run-task');

describe('my awesome Grunt task', function () {
  runTask.loadTasks('tasks');

  describe('when using the default options', function () {
    var task = runTask.task('awesome_task', {
      options: {},
      src: [ 'test/fixtures/src.js' ],
      dest: 'tmp/src.out.js'
    });

    beforeEach(task.run);
    afterEach(task.clean);

    it('does awesome stuff', function() {
      grunt.file.exists(task.config.dest);
    });
  });
});
```

## API

### runTask(name, config, done)
Run the given task immediately with the given config. Call the callback,
once the task has finished.

#### Options

- name `String` The name of the task to run
- config `Object` The configuration to use for the task
- multi `Boolean` When specified, don't try to guess the kind of task, instead
  assume it is a multi-task if `true` or a regular task if `false`

#### Example

Run the [`jshint`](https://github.com/gruntjs/grunt-contrib-jshint) task.

```js
runTask('jshint', {
  // JSHint is a multi-task, setup the "default" target
  default: {
    options: {},
    files: [ '**/*.js' ]
  }
}, function (err, task) {
  if (err) {
    // The task did encounter an error
  }
});
```

### runTask.task(name, config, [multi])
- name `String` The name of the task to run
- config `Object` The configuration to use for the task
- return: a `Task` object

### runTask.initConfig(configObject)
_Wrapper for the [`grunt.initConfig`](http://gruntjs.com/api/grunt.config#grunt.config.init) method._

### runTask.registerTask(taskName, ...)
_Wrapper for the [`grunt.registerTask`](http://gruntjs.com/api/grunt.task#grunt.task.registerTask) method._

### runTask.registerMultiTask(taskName, ...)
_Wrapper for the [`grunt.loadTasks`](http://gruntjs.com/api/grunt.task#grunt.task.registerMultiTask) method._

### runTask.loadTasks(tasksPath)
_Wrapper for the [`grunt.loadTasks`](http://gruntjs.com/api/grunt.task#grunt.task.loadtasks) method._

### runTask.loadNpmTasks(pluginName)
_Wrapper for the [`grunt.loadTasks`](http://gruntjs.com/api/grunt.task#grunt.task.loadtasks) method._

### Class: Task

#### task.name
#### task.multi
#### task.target
#### task.config
#### task.files

#### task.run([arguments...], done)

#### task.clean(done)
