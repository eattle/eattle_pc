const assert = require('assert');
const Riccardo = require('riccardo');
var riccardo = new Riccardo();
riccardo.scan('../lib', '');

describe('detector', function () {
  const format = riccardo.get('format');
  const detector = riccardo.get('detector');
  const MemoryBlockDevice = riccardo.get('memoryBlockDevice');

  it('모듈이 있어야 합니다.', function () {
    assert(detector);
  });

  describe('32MiB 레퍼런스 테스트 케이스', function () {
    makeReferenceDevice(function (device) {
      it('이것을 승인해야 합니다.', function (done) {
        detector.run(device, function (err, result) {
          assert.strictEqual(err, null);
          assert.strictEqual(result, true);
          detector.getEattle(device, function (err, result) {
            assert.strictEqual(err, null);
            assert.strictEqual(result.firstLba, 40002);
            assert.strictEqual(result.size, 25534);
            done();
          });
        });
      });
    });
  });

  describe('전체를 0으로 초기화한 경우', function () {
    var device = new MemoryBlockDevice({ size: 65536 });
    assertRejected(device);
  });

  describe('마스터 부트 레코드는 남기고, 나머지를 0으로 초기화된 경우', function () {
    makeReferenceDevice(function (refDevice) {
      var testDevice = new MemoryBlockDevice({ size: 65536 });
      var mbr = new Buffer(512);
      refDevice.readBlock(0, mbr, function () {
        testDevice.writeBlock(0, mbr, function () {
          assertRejected(testDevice); 
        });
      });
    });
  });

  function makeReferenceDevice(callback) {
    var device = new MemoryBlockDevice({ size: 65536 });
    format.formatMbr(device, 40000, function (err) {
      assert.strictEqual(err, null);
      format.formatEattle(device, 40002, function (err) {
        assert.strictEqual(err, null);
        callback(device);
      });
    });
  }

  function assertRejected(device) {
    it('이것을 거부해야 합니다.', function (done) {
      detector.run(device, function (err, result) {
        assert.strictEqual(err, null);
        assert.strictEqual(result, false);
        done();
      });
    });
  }
});