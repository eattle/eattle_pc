describe('wrapper', function () {
  const wrap = require('../app/scripts/wrapper').wrap;
  const assert = require('assert');
  
  var log;

  function* main(value) {
    const thunkify = require('thunkify');
    var b = thunkify(a);
    log = [];
    log.push(0);
    log.push(yield b(1 - 1));
    log.push(2);
    log.push(yield b(3 - 1));
    log.push(4);
    return value;
  }
  function a(value, callback) {
    callback(null, value + 1);
  }
  var mainWrapped = wrap(null, main);

  it('오류 없이 종료되어야 합니다.', function (done) {
    mainWrapped('ok', function (err) {
      assert.strictEqual(err, null);
      done();
    });
  });
  it('인자로 입력된 값이 최종적으로 반환되어야 합니다.', function (done) {
    mainWrapped('ok', function (err, result) {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 'ok');
      done();
    });
  });
  it('수행 과정이 올바르게 기록되어야 합니다.', function (done) {
    mainWrapped('test', function (err, result) {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 'test');
      assert.strictEqual(log.length, 5);
      for (var i = 0; i < log.length; i++) {
        assert.strictEqual(log[i], i);
      }
      done();
    });
  });
});