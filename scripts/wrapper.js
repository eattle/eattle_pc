const co = require('co');
function wrap(obj, func) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var callback = args[args.length - 1];
    co(function* () { return yield func.apply(obj, args); }).then(success, error);
    function success(result) {
      callback(null, result);
    }
    function error(err) {
      callback(err);
    }
  };
}

function testWrapper() {
  var log = [];
  function* main(value) {
    const thunkify = require('thunkify');
    var b = thunkify(a);
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
  var mainWrapped = wrap(main);
  mainWrapped('ok', function (err, result) {
    const assert = require('assert');
    assert.strictEqual(err, null);
    assert.strictEqual(result, 'ok');
    assert.strictEqual(log.length, 5);
    for (var i = 0; i < log.length; i++) {
      assert.strictEqual(log[i], i);
    }
  });
}
// testWrapper();