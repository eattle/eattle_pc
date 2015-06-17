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

if (typeof exports !== 'undefined') {
  module.exports = { wrap: wrap };
}