# grunt-run-task

> Run Grunt tasks in you tests, so you can test them.

So you want to test your Grunt tasks, eh? And you don't want to litter your
projectâ€™s _Gruntfile_ with tasks that are needed â€œjust for the testsâ€�? And
you want your tests to be self-contained? _Then this module is for you!_

## Whatsitdo?

This package gives you the tools to run Grunt tasks inside your tests and
clean up afterwards. You can use your test toolâ€™s setup and tear down methods
to run the Grunt task you want to test with arbitrary configuration.

If youâ€™re using BDD it could look like this:

```javascript
var assert = require('assert');
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

    beforeEach(task.run());
    afterEach(task.clean());

    it('does awesome stuff', function() {
      assert(grunt.file.exists(task.files[0].dest));
    });
  });
});
```

## API

### runTask(name, config, done)
Run the given task immediately with the given config. Call the callback,
once the task has finished. Returns the created [Task](#class-task) instance.

#### Options
-  name `String` The name of the task to run. This may include colon-separated
  arguments to pass to the task, or, in the case of multi-tasks, the name of
  the target to run.
- config `Object` The configuration to use for the task.

#### Example
Run the [`jshint`](https://github.com/gruntjs/grunt-contrib-jshint) task.

```js
runTask.loadNpmTasks('grunt-contrib-jshint');
runTask('jshint:default', {
  // JSHint is a multi-task, setup the "default" target
  default: {
    files: [ '**/*.js' ]
  }
}, function (err, task) {
  if (err) {
    // The task did encounter an error
  }
});
```
 
### runTask.task(name, [config])
Return a new [Task](#class-task) object that can be used to run the given task.

#### Options
- name `String` The name of the task to run. This may include colon-separated
  arguments to pass to the task, or, in the case of multi-tasks, the name of
  the target to run.
- config `Object` The configuration to use for the task.

#### Example
Run the [`uglify`](https://github.com/gruntjs/grunt-contrib-uglify) task,
and cleanup created files afterwards.

```js
runTask.loadNpmTasks('grunt-contrib-uglify');
var task = runTask.task('uglify', {
  default: {
    files: {
      'build/app.js': [ '**/*.js' ]
    }
  }
});

task.run('default', function (err) {
  task.clean(function (err) {
    // Done
  });
});
```

### runTask.initConfig(configObject)
_Wrapper for the [`grunt.initConfig`](http://gruntjs.com/api/grunt.config#grunt.config.init) method._

### runTask.registerTask(taskName, ...)
_Wrapper for the [`grunt.registerTask`](http://gruntjs.com/api/grunt.task#grunt.task.registerTask) method._

### runTask.registerMultiTask(taskName, ...)
_Wrapper for the [`grunt.loadTasks`](http://gruntjs.com/api/grunt.task#grunt.task.registerMultiTask) method._

### runTask.renameTask(oldTaskName, newTaskName)
_Wrapper for the [`grunt.renameTask`](http://gruntjs.com/api/grunt.task#grunt.task.renameTask) method._

### runTask.loadTasks(tasksPath)
_Wrapper for the [`grunt.loadTasks`](http://gruntjs.com/api/grunt.task#grunt.task.loadtasks) method._

### runTask.loadNpmTasks(pluginName)
_Wrapper for the [`grunt.loadTasks`](http://gruntjs.com/api/grunt.task#grunt.task.loadtasks) method._

### runTask.option(pluginName)
_Wrapper for the [`grunt.option`](http://gruntjs.com/api/grunt.option) method._

### Class: Task

The task class implements the
[EventEmitter2](https://github.com/asyncly/EventEmitter2) API. Any events that
are emitted by Grunt _while your task runs_ are forwarded to the task class.

#### Properties
- name `String` The name of the task.
- multi `Boolean` Whether this is a multi-task.
- target `String` If the task is a multi-task, this is the target name it was
  started with.
- args `Array` Any arguments that were passed when running the task.
- data `Object` The configuration data for this task.
- files `Array` The files that were configured for this task.

#### task.run([arguments...], [done])
Run the task with the given arguments. If the last argument is a function,
run the task immediately and call the function once the task finished.
Otherwise, return a function expecting a single parameter, the callback,
that actually runs the task.

**Options**
- arguments `String` Any arguments to pass to the task, similar to what you
  would specify on the command line, by appending colon-separated options to
  the task you wish to run.
- done `Function` A callback to be called once the task has finished.

#### task.fail([arguments...], [done])
Run the task with the given arguments, but expect it to fail. If the last
argument is a function, run the task immediately and call the function once
the task finished. Otherwise, return a function expecting a single parameter,
the callback, that actually runs the task.

**Options**
- arguments `String` Any arguments to pass to the task, similar to what you
  would specify on the command line, by appending colon-separated options to
  the task you wish to run.
- done `Function` A callback to be called once the task has finished.

#### task.clean([done])
Clean up the task's `dest` files.

**Options**
- done `Function` A callback to be called once all files have been removed.

## [License](LICENSE-MIT)

Copyright Â© 2014 Jonas Pommerening

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the â€œSoftwareâ€�), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED â€œAS ISâ€�, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
