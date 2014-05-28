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

  runTask.registerTask('task', theTask);
  runTask.registerMultiTask('multi-task', theTask);

  describe('Task(name, [config])', function () {

    var task = runTask.task('task', {
      options: {
        test: true
      },
      files: {
        'test/test.js': [ '*.js' ]
      }
    });

    var multiTask = runTask.task('multi-task:default', {
      default: {
        options: {
          test: true
        },
        files: {
          'test/test.js': [ '*.js' ]
        }
      }
    });

    describe('.run([arguments...], [done])', function () {

      it('runs tasks', function (done) {
        var called = false;

        theTask.spy(function () {
          called = true;
        });

        task.run(function (err) {
          if (err) {
            return done(err);
          }
          expect(called).to.equal(true);
          done();
        });
      });

      it('runs multi tasks', function (done) {
        var called = false;

        theTask.spy(function () {
          called = true;
        });

        multiTask.run(function (err) {
          if (err) {
            return done(err);
          }
          expect(called).to.equal(true);
          done();
        });
      });

      it('passes arguments to the task function', function (done) {
        theTask.spy(function () {
          expect([].slice.apply(arguments)).to.eql(['test']);
        });

        task.run('test', function (err) {
          if (err) {
            return done(err);
          }
          done();
        });
      });

    });
  });

});
