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

describe('grunt-run-task', function () {
  var runTask = require('./index');

  describe('.registerTask(name, ...)', function () {
  });

  describe('.registerMultiTask(name, ...)', function () {
  });

  describe('.renameTask(name, ...)', function () {
  });

  describe('.loadTasks(tasksPath)', function () {
  });

  describe('.loadNpmTasks(pluginName)', function () {
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
            return file.dest;
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
