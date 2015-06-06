const assert = require('assert');
const Riccardo = require('riccardo');
var riccardo = new Riccardo();
riccardo.scan('../lib', '');

describe('format', function () {
  const format = riccardo.get('format');
  it('모듈이 있어야 합니다.', function () {
    assert(format);
  });
  describe('마스터 부트 레코드', function () {
    const MemoryBlockDevice = riccardo.get('memoryBlockDevice');
    var device = new MemoryBlockDevice({ size: 1000000000 });
    it('첫 번째 예약된 볼륨 크기가 잘못되었으면 예외를 던져야 합니다.', function () {
      format.formatMbr(new MemoryBlockDevice({ size: 42 }), 10, function () {});
      assert.throws(function () {
        format.formatMbr(new MemoryBlockDevice({ size: 42 }), 35, function () {});
      });
      assert.throws(function () {
        format.formatMbr(new MemoryBlockDevice({ size: 42 }), 0, function () {});
      });
      assert.throws(function () {
        format.formatMbr(new MemoryBlockDevice({ size: 42 }), -1, function () {});
      });
    });
    describe('첫 번째 볼륨 크기 100000 블럭', function () {
      it('예외 또는 오류 없이 성공적으로 수행되어야 합니다.', function () {
        format.formatMbr(device, 100000, function (err) {
          assert.strictEqual(err, null);
          assert.strictEqual(Array.prototype.slice.call(arguments).length, 1);
        });
      });
      it('시그니처 0x55, 0xAA가 지정되어야 합니다.', function () {
        var buffer = new Buffer(512);
        device.readBlock(0, buffer, function (err, result) {
          assert.strictEqual(err, null);
          assert.strictEqual(result[510], 0x55);
          assert.strictEqual(result[511], 0xAA);
        });
      });
      describe('파티션 엔트리를 검사합니다.', function () {
        describe('첫 번째 예약된 파티션 엔트리', function () {
          var base = 446;
          it('상태가 0x00이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base], 0x00);
            });
          });
          it('두 번 등장하는 CHS 필드는 0xfe, 0xff, 0xff이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base + 1], 0xfe);
              assert.strictEqual(result[base + 2], 0xff);
              assert.strictEqual(result[base + 3], 0xff);
              assert.strictEqual(result[base + 5], 0xfe);
              assert.strictEqual(result[base + 6], 0xff);
              assert.strictEqual(result[base + 7], 0xff);
            });
          });
          it('시작 블럭 주소가 2이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base + 8], 0x02);
              assert.strictEqual(result[base + 9], 0x00);
              assert.strictEqual(result[base + 10], 0x00);
              assert.strictEqual(result[base + 11], 0x00);
            });
          });
          it('크기가 100000 블럭이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base + 12], 0xA0);
              assert.strictEqual(result[base + 13], 0x86);
              assert.strictEqual(result[base + 14], 0x01);
              assert.strictEqual(result[base + 15], 0x00);
            });
          });
          it('파티션 종류는 0x0B, FAT32이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base + 4], 0x0B);
            });
          });
        });
        describe('Eattle 파티션 엔트리', function () {
          var base = 462;
          it('상태가 0x00이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base], 0x00);
            });
          });
          it('두 번 등장하는 CHS 필드는 0xfe, 0xff, 0xff이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base + 1], 0xfe);
              assert.strictEqual(result[base + 2], 0xff);
              assert.strictEqual(result[base + 3], 0xff);
              assert.strictEqual(result[base + 5], 0xfe);
              assert.strictEqual(result[base + 6], 0xff);
              assert.strictEqual(result[base + 7], 0xff);
            });
          });
          it('시작 블럭 주소가 100002이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base + 8], 0xA2);
              assert.strictEqual(result[base + 9], 0x86);
              assert.strictEqual(result[base + 10], 0x01);
              assert.strictEqual(result[base + 11], 0x00);
            });
          });
          it('크기가 999899998 블럭이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base + 12], 0x5E);
              assert.strictEqual(result[base + 13], 0x43);
              assert.strictEqual(result[base + 14], 0x99);
              assert.strictEqual(result[base + 15], 0x3B);
            });
          });
          it('파티션 종류는 0x7F, 예약된 번호이어야 합니다.', function () {
            var buffer = new Buffer(512);
            device.readBlock(0, buffer, function (err, result) {
              assert.strictEqual(err, null);
              assert.strictEqual(result[base + 4], 0x7F);
            });
          });
        });
      });
    });
  });
  describe('Eattle', function () {
    const MemoryBlockDevice = riccardo.get('memoryBlockDevice');
    var device = new MemoryBlockDevice({ size: 1000000000 });
    it('주어진 오프셋을 적용하여 에외 또는 오류 없이 포맷에 성공해야 합니다.', function () {
      format.formatEattle(device, 4200, function (err) {
        assert.strictEqual(err, null);
        assert.strictEqual(Array.prototype.slice.call(arguments).length, 1);
      });
    });
    it('시그니처가 지정되어야 합니다.', function () {
      var buffer = new Buffer(512);
      device.readBlock(4200, buffer, function (err, result) {
        assert.strictEqual(err, null);
        assert.strictEqual(result[0], 0xa3);
        assert.strictEqual(result[1], 0x75);
        assert.strictEqual(result[2], 0x80);
        assert.strictEqual(result[3], 0xc5);
        assert.strictEqual(result[4], 0x44);
        assert.strictEqual(result[5], 0x28);
        assert.strictEqual(result[6], 0x44);
        assert.strictEqual(result[7], 0x71);
        assert.strictEqual(result[8], 0x3e);
        assert.strictEqual(result[9], 0xa1);
        assert.strictEqual(result[10], 0x1d);
        assert.strictEqual(result[11], 0xe5);
        assert.strictEqual(result[12], 0xb2);
        assert.strictEqual(result[13], 0xee);
        assert.strictEqual(result[14], 0x50);
        assert.strictEqual(result[15], 0x29);
        assert.strictEqual(result[16], 0x69);
        assert.strictEqual(result[17], 0x9d);
        assert.strictEqual(result[18], 0x22);
        assert.strictEqual(result[19], 0x77);
        assert.strictEqual(result[20], 0x7d);
        assert.strictEqual(result[21], 0x63);
        assert.strictEqual(result[22], 0x61);
        assert.strictEqual(result[23], 0x8c);
        assert.strictEqual(result[24], 0x06);
        assert.strictEqual(result[25], 0xec);
        assert.strictEqual(result[26], 0x52);
        assert.strictEqual(result[27], 0x72);
        assert.strictEqual(result[28], 0xa6);
        assert.strictEqual(result[29], 0x51);
        assert.strictEqual(result[30], 0x57);
        assert.strictEqual(result[31], 0x27);
      });
    });
    it('지금은 예약된 블럭 수가 0이어야 합니다.', function () {
      var buffer = new Buffer(512);
      device.readBlock(4200, buffer, function (err, result) {
        assert.strictEqual(err, null);
        assert.strictEqual(result[508], 0x00);
        assert.strictEqual(result[509], 0x00);
        assert.strictEqual(result[510], 0x00);
        assert.strictEqual(result[511], 0x00);
      });
    });
  });
});