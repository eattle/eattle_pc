const assert = require('assert');
const Riccardo = require('riccardo');
var riccardo = new Riccardo();
riccardo.scan('../lib', '');

describe('WindowedBlockDevice', function () {
  const WindowedBlockDevice = riccardo.get('windowedBlockDevice');
  const MemoryBlockDevice = riccardo.get('memoryBlockDevice');

  function MockDevice(hooks) {
    hooks = hooks || {};
    this.readBlock = hooks.readBlock || function () {};
    this.writeBlock = hooks.writeBlock || function () {};
    this.getLastLogicalBlockAddress = hooks.getLastLogicalBlockAddress || function () {};
    this.getBlockLength = hooks.getBlockLength || function () {};
  }

  function ErrorMockDevice(error) {
    MockDevice.call(this, {
      readBlock: error,
      writeBlock: error,
      getLastLogicalBlockAddress: error,
      getBlockLength: error
    });
  }
  
  describe('MockDevice', function () {
    describe('ErrorMockDevice', function () {
      it('생성에 성공해야 합니다.', function () {
        assert(new ErrorMockDevice());
      });
      it('함수가 설정되어야 합니다.', function () {
        var device = new ErrorMockDevice();
        assert.strictEqual(typeof device.readBlock, typeof function () {});
        assert.strictEqual(typeof device.writeBlock, typeof function () {});
        assert.strictEqual(typeof device.getLastLogicalBlockAddress, typeof function () {});
        assert.strictEqual(typeof device.getBlockLength, typeof function () {});
      });
      it('주어진 예외 함수가 실행되어야 합니다.', function () {
        var counter = 0;
        var device = new ErrorMockDevice(function () {
          counter = counter + 1;
        });
        assert.strictEqual(counter, 0);
        device.readBlock();
        assert.strictEqual(counter, 1);
        device.writeBlock();   
        assert.strictEqual(counter, 2);
        device.getLastLogicalBlockAddress();
        assert.strictEqual(counter, 3);
        device.getBlockLength();
        assert.strictEqual(counter, 4);
      });
    });
  });

  it('컴포넌트가 있어야 합니다.', function () {
    assert(WindowedBlockDevice);
  });

  it('설정이 없으면 예외를 던져야 합니다.', function () {
    assert.throws(function () {
      new WindowedBlockDevice();
    });
  });

  it('명백히 잘못된 설정이 주어지면 장치 함수 호출 전 예외를 던져야 합니다.', function () {
    var ok = true;
    function test(config) {
      if (ok) {
        config.device = new ErrorMockDevice(fail);
        assert.throws(function () {
          new WindowedBlockDevice(config);
        });
      }
    }

    test({ offset: -1, size: 10 });
    test({ offset: null, size: 10 });
    test({ offset: undefined, size: 10 });
    test({ offset: 0, size: -1 });
    test({ offset: 0, size: 0 });
    test({ offset: 0, size: null });
    test({ offset: 0, size: undefined });

    assert.strictEqual(ok, true);
    function fail() {
      ok = false;
    }
  });

  it('설정을 확인하기 위해 장치 함수를 호출해야 합니다.', function (done) {
    var device = new MockDevice({
      getLastLogicalBlockAddress: done
    });
    new WindowedBlockDevice({ offset: 10, size: 100, device: device });
  });

  it('장치 함수의 범위를 벗어나는 설정이 주어지면 예외를 던져야 합니다.', function () {
    assert.throws(function () {
      new WindowedBlockDevice({ offset: 50, size: 0, device: new MemoryBlockDevice({ size: 50 }) });
    });
    assert.throws(function () {
      new WindowedBlockDevice({ offset: 50, size: 1, device: new MemoryBlockDevice({ size: 50 }) });
    });
    assert.throws(function () {
      new WindowedBlockDevice({ offset: 49, size: 2, device: new MemoryBlockDevice({ size: 50 }) });
    });
    assert.throws(function () {
      new WindowedBlockDevice({ offset: 48, size: 3, device: new MemoryBlockDevice({ size: 50 }) });
    });
    assert.throws(function () {
      new WindowedBlockDevice({ offset: 47, size: 4, device: new MemoryBlockDevice({ size: 50 }) });
    });
  });

  it('장치가 주어지지 않으면 예외를 던져야 합니다.', function () {
    assert.throws(function () {
      new WindowedBlockDevice({ offset: 49, size: 1 });
    });
    assert.throws(function () {
      new WindowedBlockDevice({ offset: 48, size: 2, device: null });
    });
    assert.throws(function () {
      new WindowedBlockDevice({ offset: 47, size: 3, device: undefined });
    });
  });

  it('올바른 설정이 주어지면 성공적으로 생성되어야 합니다.', function () {
    new WindowedBlockDevice({ offset: 49, size: 1, device: new MemoryBlockDevice({ size: 50 }) });
    new WindowedBlockDevice({ offset: 48, size: 2, device: new MemoryBlockDevice({ size: 50 }) });
    new WindowedBlockDevice({ offset: 47, size: 3, device: new MemoryBlockDevice({ size: 50 }) });
  });

  describe('크기가 30000인 장치 준비, 기록 검사 테스트', function () {

    var log = [];
    var md = new MockDevice({
      readBlock: function (lba) {
        log.push('read' + lba);
      },
      writeBlock: function (lba) {
        log.push('write' + lba);
      },
      getLastLogicalBlockAddress: function () {
        return 29999;
      },
      getBlockLength: function () {
        log.push('getBlockLength');
        return 512;
      }
    });

    var wbd = null;

    it('오프셋 1080, 크기 64인 장치가 생성되어야 합니다.', function () {
      wbd = new WindowedBlockDevice({ offset: 1080, size: 64, device: md });
      assert.ok(wbd);
    });

    it('윈도우 오프셋을 적용해야 합니다.', function () {
      assert.strictEqual(log.length, 0);
      wbd.readBlock(10);
      assert.strictEqual(log.length, 1);
      assert.strictEqual(log[0], 'read1090');
      wbd.writeBlock(11);
      assert.strictEqual(log.length, 2);
      assert.strictEqual(log[1], 'write1091');
      wbd.readBlock(21);
      assert.strictEqual(log.length, 3);
      assert.strictEqual(log[2], 'read1101');
      wbd.writeBlock(42);
      assert.strictEqual(log.length, 4);
      assert.strictEqual(log[3], 'write1122');
    });

    it('getLastLogicalBlockAddress값이 제대로 지정되어야 합니다.', function () {
      assert.strictEqual(wbd.getLastLogicalBlockAddress(), 63);
    });

    it('getBlockLength 함수가 호출되어야 하고, 값은 512이어야 합니다.', function () {
      var before = log.length;
      assert.strictEqual(wbd.getBlockLength(), 512);
      var after = log.length;
      assert.strictEqual(before + 1, after);
      assert.strictEqual(log[log.length - 1], 'getBlockLength');
    });

    it('범위를 초과하는 블럭에 작업을 수행하려고 시도하면 예외를 던져야 합니다.', function () {
      assert.throws(function () {
        var buffer = new Buffer(512);
        wbd.readBlock(64, buffer, function () {});
      });
      assert.throws(function () {
        var buffer = new Buffer(512);
        wbd.writeBlock(64, buffer, function () {});
      });
      assert.throws(function () {
        var buffer = new Buffer(512);
        wbd.readBlock(-1, buffer, function () {});
      });
      assert.throws(function () {
        var buffer = new Buffer(512);
        wbd.writeBlock(-1, buffer, function () {});
      });
    });
  });
});
