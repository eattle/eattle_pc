const assert = require('assert');

module.exports = function () {
  return FsMock;
  function FsMock() {
    this.read = read;
    this.write = write;
    this.open = open;
    this.close = close;
    this.setMockType = setMockType;
    this.stat = stat;
    this.exists = exists;

    var storage = {};
    var fdInfo = {};

    function open(path, flags, callback) {
      assert(path);
      assert.strictEqual(typeof flags, typeof '');
      assert.strictEqual(typeof callback, typeof function () {});
      if (storage[path] === undefined) {
        storage[path] = {};
      }
      var fd = Object.keys(fdInfo).length + 1;
      fdInfo[fd] = {
        valid: true,
        flags: flags,
        path: path
      };
      callback(null, fd);
    }

    function read(fd, buffer, offset, length, position, callback) {
      assert(fd);
      assert.strictEqual(typeof buffer, typeof new Buffer(1));
      assert.strictEqual(typeof offset, typeof 0);
      assert.strictEqual(typeof length, typeof 0);
      assert.strictEqual(typeof position, typeof 0);
      assert.strictEqual(typeof callback, typeof function () {});
      assert.notStrictEqual(fdInfo[fd], undefined);
      assert.strictEqual(fdInfo[fd].valid, true);

      var path = fdInfo[fd].path;
      assert.strictEqual(offset, 0);
      for (var i = 0; i < length; i++) {
        var index = i + position;        
        if (storage[path].type === 'blockDevice') {
          assert(0 <= index);
          assert(index < storage[path].size);
        }
        buffer[i] = storage[path][index];
      }
      callback(null, 512, buffer);
    }

    function write(fd, buffer, offset, length, position, callback) {
      assert(fd);
      assert.strictEqual(typeof buffer, typeof new Buffer(1));
      assert.strictEqual(typeof offset, typeof 0);
      assert.strictEqual(typeof length, typeof 0);
      assert.strictEqual(typeof position, typeof 0);
      assert.strictEqual(typeof callback, typeof function () {});
      assert.notStrictEqual(fdInfo[fd], undefined);
      assert.strictEqual(fdInfo[fd].valid, true);
      
      var path = fdInfo[fd].path;
      assert.strictEqual(offset, 0);
      for (var i = 0; i < length; i++) {
        var index = i + position;        
        if (storage[path].type === 'blockDevice') {
          assert(0 <= index);
          assert(index < storage[path].size);
        }
        storage[path][index] = buffer[i];
      }
      callback(null, 512, buffer);
    }

    function close(fd, callback) {
      assert(fd);
      assert.notStrictEqual(fdInfo[fd], undefined);
      fdInfo[fd].valid = false;
      callback();      
    }

    function setMockType(path, key, value) {
      assert.strictEqual(typeof path, typeof '');
      assert.strictEqual(typeof key, typeof '');
      assert.notStrictEqual(storage[path], undefined);
      storage[path][key] = value;
    }

    function stat(path, callback) {
      assert.strictEqual(typeof path, typeof '');
      assert.strictEqual(typeof callback, typeof function () {});

      var info = storage[path];
      assert.notStrictEqual(info, undefined);

      var stats = {};

      stats.size = info.size;

      stats.isFile = function () {
        return info.type === 'file';
      };
      stats.isBlockDevice = function () {
        return info.type === 'blockDevice';
      };
      stats.isDirectory = falseFunc;
      stats.isCharacterDevice = falseFunc;
      stats.isSymbolicLink = falseFunc;
      stats.isFIFO = falseFunc;
      stats.isSocket = falseFunc;
      
      callback(null, stats);

      function falseFunc() {
        return false;
      }
    }

    function exists(path, callback) {
      assert.strictEqual(typeof path, typeof '');
      assert.strictEqual(typeof callback, typeof function () {});
      var result = storage[path] !== undefined;
      callback(result);
    }
  }
};
