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

    beforeEach(task.run());
    afterEach(task.clean());

    it('does awesome stuff', function() {
      grunt.file.exists(task.config.dest);
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
the task finished.  Otherwise, return a function expecting a single parameter,
the callback, that actually runs the task.

**Options**
- arguments `String` Any arguments to pass to the task, similar to what you
  would specify on the command line, by appending colon-separated options to
  the task you wish to run.
- done `Function` A callback to be called once the task has finished.

#### task.clean([done])
Clean up the task's `dest` files.

**Options**
- done `Function` A callback to be called once the task has finished.

## [License](LICENSE-MIT)

Copyright © 2014 Jonas Pommerening

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
