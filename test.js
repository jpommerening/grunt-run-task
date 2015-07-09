/*jshint node: true*/
/*global describe, it*/
var expect = require('expect.js');

function theTask() {
  if (theTask.handler) {
    theTask.handler.apply(this, arguments);
    theTask.handler = null;
  }
}
theTask.spy = function (handler) {
  theTask.handler = handler;
};

describe('runTask(name, config, done)', function () {
  var runTask = require('./index');

  it('is a function', function () {
    expect(runTask).to.be.a(Function);
  });

  it('runs tasks', function (done) {
    runTask.registerTask('task', theTask);
    theTask.spy(function( ) {
      expect(this.name).to.equal('task');
      expect(this.target).to.be(undefined);
    });
    runTask('task', {}, done);
  });

  it('runs multi tasks', function (done) {
    runTask.registerMultiTask('multi-task', theTask);
    theTask.spy(function( ) {
      expect(this.name).to.equal('multi-task');
      expect(this.target).to.equal('default');
    });
    runTask('multi-task', { default: {} }, done);
  });

  describe('.grunt', function () {
    it('exposes the task\'s grunt', function () {
      expect(runTask.grunt).to.be.an(Object);
      expect(runTask.grunt.file).to.be.an(Object);
      expect(runTask.grunt.config).to.be.a(Function);
      expect(runTask.grunt.task).to.be.an(Object);
      expect(runTask.grunt.log).to.be.an(Object);
    });

    it('is an instance isolated from other module\'s grunt', function () {
      var grunt = require('grunt');
      expect(runTask.grunt).to.not.be(grunt);

      runTask.grunt.config.set('test', true);

      expect(grunt.config.get('test')).to.not.be(true);
    });
  });

  describe('.initConfig(configObject)', function () {
    it('wraps grunt.initConfig(...)', function () {
      expect(runTask.initConfig).to.be.a(Function);
    });
  });

  describe('.registerTask(taskName, ...)', function () {
    it('wraps grunt.registerTask(...)', function () {
      expect(runTask.registerTask).to.be.a(Function);
    });
    it('can be used to register tasks', function () {
      runTask.registerTask('test-task', 'Task description', theTask);
    });
    it('can be used to register alias-tasks', function () {
      runTask.registerTask('test-alias', ['test-task']);
    });
  });

  describe('.registerMultiTask(taskName, ...)', function () {
    it('wraps grunt.registerMultiTask(...)', function () {
      expect(runTask.registerMultiTask).to.be.a(Function);
    });
    it('can be used to register multi-tasks', function () {
      runTask.registerMultiTask('test-multi-task', 'Multi-task description', theTask);
    });
  });

  describe('.registerInitTask(taskName, ...)', function () {
    it('wraps grunt.registerInitTask(...)', function () {
      expect(runTask.registerInitTask).to.be.a(Function);
    });
    it('can be used to register init-tasks', function () {
      runTask.registerInitTask('test-init-task', 'Init-task description', theTask);
    });
  });

  describe('.renameTask(oldTaskName, newTaskName)', function () {
    it('wraps grunt.renameTask(...)', function () {
      expect(runTask.renameTask).to.be.a(Function);
    });
    it('can be used to rename tasks', function () {
      runTask.registerTask('test-old-task', 'Rename task description', theTask);
      runTask.renameTask('test-old-task', 'test-new-task');
    });
  });

  describe('.loadTasks(tasksPath)', function () {
    it('wraps grunt.loadTasks(...)', function () {
      expect(runTask.loadTasks).to.be.a(Function);
    });
  });

  describe('.loadNpmTasks(pluginName)', function () {
    it('wraps grunt.loadNpmTasks(...)', function () {
      expect(runTask.loadNpmTasks).to.be.a(Function);
    });
  });

  describe('Task(name, [config])', function () {

    runTask.registerTask('task', theTask);
    runTask.registerMultiTask('multi-task', theTask);

    var task = runTask.task('task', {
      options: {
        test: true
      }
    });

    var multiTask = runTask.task('multi-task:default', {
      default: {
        options: {
          test: true
        },
        files: {
          'tmp/test.js': [ '*.js' ]
        }
      }
    });

    it('is an instance of EventEmitter2', function () {
      var EventEmitter2 = require('eventemitter2').EventEmitter2;
      expect(task).to.be.an(EventEmitter2);
    });

    describe('.run([arguments...], [done])', function () {

      it('runs tasks', function (done) {
        var called = false;

        theTask.spy(function () {
          called = true;
          expect(this.name).to.equal('task');
          expect(this.target).to.be(undefined);
          expect(this.args).to.eql(['arg']);
          expect(this.files).to.be(undefined);
          expect(this.options()).to.eql({
            test: true
          });
        });

        expect(task.multi).to.be(false);

        task.run('arg', function (err) {
          expect(called).to.equal(true);
          done(err);
        });
      });

      it('runs multi tasks', function (done) {
        var called = false;

        theTask.spy(function () {
          called = true;
          expect(this.name).to.equal('multi-task');
          expect(this.target).to.equal('default');
          expect(this.args).to.eql(['arg']);
          expect(this.files).to.not.be(undefined);
          expect(this.options()).to.eql({
            test: true
          });
        });

        expect(multiTask.multi).to.be(true);

        multiTask.run('arg', function (err) {
          expect(called).to.equal(true);
          done(err);
        });
      });

    });

    describe('.fail([arguments], [done])', function () {

      it('runs tasks', function (done) {
        var called = false;

        theTask.spy(function () {
          called = true;
          throw new Error('This was expected');
        });

        task.fail('arg', function (err) {
          expect(called).to.equal(true);
          done(err);
        });
      });

      it('runs multi tasks', function (done) {
        var called = false;

        theTask.spy(function () {
          called = true;
          throw new Error('This was expected');
        });

        multiTask.fail('arg', function (err) {
          expect(called).to.equal(true);
          done(err);
        });
      });

    });

    describe('.clean([done])', function () {

      it('removes multi-tasks\' dest files', function (done) {
        var grunt = multiTask.grunt;

        theTask.spy(function () {
          this.files.forEach(function (file) {
            grunt.file.write(file.dest, file.src.join(', '));
          });
        });

        multiTask.run(function (err) {
          if (err) {
            return done(err);
          }

          var files = multiTask.files.map(function (file) {
            return file;
          });

          expect(files.length).to.be.greaterThan(0);

          files.forEach(function (file) {
            expect(grunt.file.exists(file)).to.equal(true);
          });

          multiTask.clean(function () {
            files.forEach(function (file) {
              expect(grunt.file.exists(file)).to.equal(false);
            });
            done();
          });
        });
      });

    });

  });

});
