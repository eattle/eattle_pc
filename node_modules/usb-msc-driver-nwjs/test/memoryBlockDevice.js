const assert = require('assert');
const _ = require('lodash');
const Riccardo = require('riccardo');
var riccardo = new Riccardo();
riccardo.scan('../lib', '');

describe('MemoryBlockDevice', function () {

  const MemoryBlockDevice = riccardo.get('memoryBlockDevice');

  it('컴포넌트가 있어야 합니다.', function () {
    assert(MemoryBlockDevice);
  });

  it('설정이 없으면 예외를 던져야 합니다.', function () {
    assert.throws(function () {
      new MemoryBlockDevice();
    });
  });
  
  describe('크기 10', function () {    
    var device = null;
    it('초기화 성공해야 합니다.', function () {
      var config = {
        size: 10
      };
      device = new MemoryBlockDevice(config);
    });

    it('getLastLogicalBlockAddress가 9를 반환해야 합니다.', function () {
      assert.strictEqual(device.getLastLogicalBlockAddress(), 9);
    });
    it('getBlockLength가 512를 반환해야 합니다.', function () {
      assert.strictEqual(device.getBlockLength(), 512);
    });

    describe('readBlock', function () {
      it('처음에 모든 블럭의 길이가 512이어야 합니다.', function (done) {
        var remaining = 10;
        var callback = function (err, result) {
          assert.strictEqual(err, null);
          assert.strictEqual(result.length, 512);
          if (--remaining === 0) {
            done();
          }
        };
        for (var i = 0; i <= 9; i++) {
          var buffer = new Buffer(512);
          device.readBlock(i, buffer, callback);
        }
      });
      it('처음에 모든 블럭의 값이 0이어야 합니다.', function (done) {
        var remaining = 10;
        var callback = function (err, result) {
          assert.strictEqual(err, null);
          _.forEach(result, function (value) {
            assert.strictEqual(value, 0);
          });
          if (--remaining === 0) {
            done();
          }
        };
        for (var i = 0; i <= 9; i++) {
          var buffer = new Buffer(512);
          device.readBlock(i, buffer, callback);
        }
      });
      it('읽을 때 범위를 벗어나면 예외를 던져야 합니다.', function (done) {
        assert.throws(function () {
          var buffer = new Buffer(512);
          device.readBlock(-1, buffer, done);
        });
        assert.throws(function () {
          var buffer = new Buffer(512);
          device.readBlock(10, buffer, done);
        });
        assert.throws(function () {
          var buffer = new Buffer(512);
          device.readBlock(42, buffer, done);
        });
        done();
      });
      it('읽을 때 buffer가 없으면 예외를 던져야 합니다.', function (done) {
        assert.throws(function () {
          device.readBlock(5, null, done);
        });
        done();
      });
      it('읽을 때 버퍼 크기가 512가 아니면 예외를 던져야 합니다.', function (done) {
        assert.throws(function () {
          var buffer = new Buffer(511);
          device.readBlock(5, buffer, done);
        });
        assert.throws(function () {
          var buffer = new Buffer(513);
          device.readBlock(5, buffer, done);
        });
        done();
      });
    });
    describe('writeBlock', function () {
      it('모든 블럭을 각 블럭 번호로 채웁니다.', function (done) {
        var remaining = 10;
        var callback = function (err) {
          assert.strictEqual(err, null);
          if (--remaining === 0) {
            done();
          }
        };
        for (var i = 0; i <= 9; i++) {
          var buffer = new Buffer(512);
          buffer.fill(i);
          device.readBlock(i, buffer, callback);
        }
      });
      it('쓸 때 범위를 벗어나면 예외를 던져야 합니다.', function (done) {
        assert.throws(function () {
          var buffer = new Buffer(512);
          device.writeBlock(-1, buffer, done);
        });
        assert.throws(function () {
          var buffer = new Buffer(512);
          device.writeBlock(11, buffer, done);
        });
        assert.throws(function () {
          var buffer = new Buffer(512);
          device.writeBlock(42, buffer, done);
        });
        done();
      });
      it('쓸 때 버퍼가 없으면 예외를 던져야 합니다.', function (done) {
        assert.throws(function () {
          device.writeBlock(5, null, done);
        });
        done();
      });
      it('쓸 때 버퍼 크기가 512가 아니면 예외를 던져야 합니다.', function (done) {
        assert.throws(function () {
          var buffer = new Buffer(511);
          device.writeBlock(5, buffer, done);
        });
        assert.throws(function () {
          var buffer = new Buffer(513);
          device.writeBlock(5, buffer, done);
        });
        done();
      });
      it('모든 블럭을 각 블럭 번호로 채웁니다.', function (done) {
        var remaining = 10;
        var callback = function (err) {
          assert.strictEqual(err, null);
          if (--remaining === 0) {
            done();
          }
        };
        for (var i = 0; i <= 9; i++) {
          var buffer = new Buffer(512);
          buffer.fill(i);
          device.writeBlock(i, buffer, callback);
        }
      });
    });
    describe('데이터 확인', function () {
      it('모든 블럭이 각 블럭 번호로 채워져 있어야 합니다.', function (done) {
        var remaining = 10;
        var callback = function (lba) {
          return function (err, result) {
            assert.strictEqual(err, null);
            for (var i = 0; i < 512; i++) {
              assert.strictEqual(result[i], lba);
            }
            if (--remaining === 0) {
              done();
            }
          };
        }; 
        for (var i = 0; i <= 9; i++) {
          var buffer = new Buffer(512);
          device.readBlock(i, buffer, callback(i));
        }
      });
    });
  });
  describe('크기 1000000000, 게으른 할당 시험', function () {
    var device = null;
    it('초기화 성공해야 합니다.', function () {
      var config = {
        size: 1000000000
      };
      device = new MemoryBlockDevice(config);
    });
    it('getLastLogicalBlockAddress가 1000000000을 반환해야 합니다.', function () {
      assert.strictEqual(device.getLastLogicalBlockAddress(), 999999999);
    });
    it('결정적인 임의 번지에 쓰기, 읽기 작업을 100회 반복합니다.', function (done) {
      var remaining = 100;
      
      var rand = (function (seed) {
        return function () {
          seed = seed * 279470273 % 4294967291;
          return seed;
        };
      })(42);

      function unitTask() {
        if (remaining-- === 0) {
          return done();
        }
        var lba = rand() % 1000 + 1;
        var bufferExpect = new Buffer(512);
        for (var i = 0; i < 512; i++) {
          bufferExpect[i] = rand() % 256;
        }
        device.writeBlock(lba, bufferExpect, function (err, bufferWrite) {
          assert.strictEqual(err, null);
          assert.strictEqual(bufferExpect, bufferWrite);
          var bufferActual = new Buffer(512);
          device.readBlock(lba, bufferActual, function (err, result) {
            assert.strictEqual(err, null);
            assert.strictEqual(bufferActual, result);
            assert.notStrictEqual(bufferExpect, bufferActual);
            for (var i = 0; i < 512; i++) {
              assert.strictEqual(bufferExpect[i], bufferActual[i]);
            }
            process.nextTick(unitTask);
          });
        });
      }
      unitTask();
    });
  });
});