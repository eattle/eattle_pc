const assert = require('assert');
const Riccardo = require('riccardo');
var riccardo = new Riccardo();
riccardo.scan('../lib', '');

describe('FsBlockDevice', function () {
  riccardo.set('fs', require('fs'));
  const FsBlockDevice = riccardo.get('fsBlockDevice');

  it('컴포넌트가 있어야 합니다.', function () {
    assert(FsBlockDevice);
  });

  describe('생성', function () {
    it('설정이 없으면 예외를 던져야 합니다.', function () {
      assert.throws(function () {
        new FsBlockDevice();
      });
    });

    it('정상적으로 생성되어야 합니다.', function () {
      new FsBlockDevice({ fd: 10, lastLogicalBlockAddress: 1000 });
    });

    it('파일 디스크립터가 지정되지 않으면 예외를 던져야 합니다.', function () {
      assert.throws(function () {
        new FsBlockDevice({ lastLogicalBlockAddress: 1000 });
      });
      assert.throws(function () {
        new FsBlockDevice({ fd: null, lastLogicalBlockAddress: 1000 });
      });
      assert.throws(function () {
        new FsBlockDevice({ fd: undefined, lastLogicalBlockAddress: 1000 });
      });
    });

    it('마지막 논리 블럭 주소가 지정되지 않으면 예외를 던져야 합니다.', function () {
      assert.throws(function () {
        new FsBlockDevice({ fd: 10 });
      });
      assert.throws(function () {
        new FsBlockDevice({ fd: 10, lastLogicalBlockAddress: null });
      });
      assert.throws(function () {
        new FsBlockDevice({ fd: 10, lastLogicalBlockAddress: undefined });
      });
    });

    it('마지막 논리 블럭 주소가 범위가 올바르지 않으면 예외를 던져야 합니다.', function () {
      assert.throws(function () {
        new FsBlockDevice({ fd: 10, lastLogicalBlockAddress: -1 });
      });
      assert.throws(function () {
        new FsBlockDevice({ fd: 10, lastLogicalBlockAddress: -84 });
      });
    });
  });

  describe('입출력', function () {
    it('논리 블럭 주소가 범위가 범위를 초과하면 예외를 던져야 합니다.', function () {
      var device = new FsBlockDevice({ fd: 10, lastLogicalBlockAddress: 40 });
      
      assert.throws(function () {
        device.readBlock(-10);
      }, assertError);
      assert.throws(function () {
        device.readBlock(10000);
      }, assertError);
      assert.throws(function () {
        device.writeBlock(-10);
      }, assertError);
      assert.throws(function () {
        device.writeBlock(10000);
      }, assertError);

      function assertError(err) {
        assert.strictEqual(err.message, '논리 블럭 주소가 범위를 벗어났습니다.');
        return true;
      }
    });
  });
});