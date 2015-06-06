const assert = require('assert');
const Riccardo = require('riccardo');
const FsMock = require('./fsMock')();

describe('host', function () {

  it('컴포넌트가 있어야 합니다.', function () {
    var riccardo = new Riccardo();
    riccardo.scan('../lib', '');
    assert(riccardo.get('host'));
  });

  context('장치가 하나도 없을 때', function () {
    
    var mock = null;
    var host = null;

    it('테스트 준비', function () {
      mock = new FsMock();
      assert(mock);
      var riccardo = new Riccardo();
      riccardo.set('fs', mock);
      riccardo.scan('../lib', '');
      host = riccardo.get('host');
      assert(host);
    });

    it('성공적으로 null을 얻어야 합니다.', function (done) {
      host.getFirstBlockDevice(function (err, device) {
        assert.strictEqual(err, null);
        assert.strictEqual(device, null);
        done();
      });
    });
  });

  context('빈 블럭 장치가 3개 있을 때', function () {
    
    var mock = null;
    var host = null;

    it('테스트 준비', function () {
      mock = new FsMock();
      assert(mock);

      mock.open('/dev/disk0', '', function (err, fd) {
        assert.strictEqual(err, null);
        assert.strictEqual(fd, 1);
        mock.setMockType('/dev/disk0', 'type', 'blockDevice');
        mock.setMockType('/dev/disk0', 'size', 623 * 512);
      });

      mock.open('/dev/disk1', '', function (err, fd) {
        assert.strictEqual(err, null);
        assert.strictEqual(fd, 2);
        mock.setMockType('/dev/disk1', 'type', 'blockDevice');
        mock.setMockType('/dev/disk1', 'size', 623 * 512);
      });

      mock.open('/dev/disk2', '', function (err, fd) {
        assert.strictEqual(err, null);
        assert.strictEqual(fd, 3);
        mock.setMockType('/dev/disk2', 'type', 'blockDevice');
        mock.setMockType('/dev/disk2', 'size', 623 * 512);
      });

      var riccardo = new Riccardo();
      riccardo.set('fs', mock);
      riccardo.scan('../lib', '');
      host = riccardo.get('host');
      assert(host);
    });

    it('성공적으로 null을 얻어야 합니다.', function (done) {
      host.getFirstBlockDevice(function (err, device) {
        assert.strictEqual(err, null);
        assert.strictEqual(device, null);
        done();
      });
    });
  });

  context('빈 블럭 장치가, 올바른 장치, 빈 블럭 장치 순서일 때', function () {
    
    var mock = null;
    var host = null;

    it('테스트 준비', function () {
      mock = new FsMock();
      assert(mock);

      mock.open('/dev/disk0', '', function (err, fd) {
        assert.strictEqual(err, null);
        assert.strictEqual(fd, 1);
        mock.setMockType('/dev/disk0', 'type', 'blockDevice');
        mock.setMockType('/dev/disk0', 'size', 623 * 512);
      });

      mock.open('/dev/disk1', '', function (err, fd) {
        assert.strictEqual(err, null);
        assert.strictEqual(fd, 2);
        mock.setMockType('/dev/disk1', 'type', 'blockDevice');
        mock.setMockType('/dev/disk1', 'size', 623 * 512);
        var buffer = new Buffer(512);
        buffer.fill(0xAA);
        mock.write(2, buffer, 0, 512, 622 * 512, function () {});
      });

      mock.open('/dev/disk2', '', function (err, fd) {
        assert.strictEqual(err, null);
        assert.strictEqual(fd, 3);
        mock.setMockType('/dev/disk2', 'type', 'blockDevice');
        mock.setMockType('/dev/disk2', 'size', 623 * 512);
      });

      var riccardo = new Riccardo();
      riccardo.set('fs', mock);
      riccardo.scan('../lib', '');

      const FsBlockDevice = riccardo.get('fsBlockDevice');
      const format = riccardo.get('format');

      var disk1 = new FsBlockDevice({ fd: 2, lastLogicalBlockAddress: 622 });
      format.formatMbr(disk1, 5);
      format.formatEattle(disk1, 7);

      host = riccardo.get('host');
      assert(host);
    });

    it('성공적으로 장치를 얻어야 합니다.', function (done) {
      host.getFirstBlockDevice(function (err, device) {
        assert.strictEqual(err, null);
        assert.notStrictEqual(device, null);
        assert.strictEqual(device.getLastLogicalBlockAddress(), 615);
        var buffer = new Buffer(512);
        buffer.fill(0xBB);
        for (var i = 0; i < 512; i++) {
          assert.strictEqual(buffer[i], 0xBB);
        }
        device.readBlock(615, buffer, function (err) {
          assert.strictEqual(err, null);
          for (var i = 0; i < 512; i++) {
            assert.strictEqual(buffer[i], 0xAA);
          }
        });
        done();
      });
    });
  });
});
