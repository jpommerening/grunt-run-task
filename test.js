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

  });

});
