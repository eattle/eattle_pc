module.exports = function (fs) {
  return FsBlockDevice;
  function FsBlockDevice(config) {
    if (!config) {
      throw new Error('설정을 지정해야 합니다.');
    }
    if (!config.fd) {
      throw new Error('파일 디스크립터가 지정되어야 합니다.');
    }
    if (!config.lastLogicalBlockAddress) {
      throw new Error('마지막 논리 블럭 주소가 지정되어야 합니다.');
    }
    if (config.lastLogicalBlockAddress < 0) {
      throw new Error('마지막 논리 블럭 주소가 올바르지 않습니다.');
    }

    this.readBlock = readBlock;
    this.writeBlock = writeBlock;
    this.getLastLogicalBlockAddress = getLastLogicalBlockAddress;
    this.getBlockLength = getBlockLength;

    function readBlock(lba, buffer, callback) {
      if (lba < 0 || lba > getLastLogicalBlockAddress()) {
        throw new Error('논리 블럭 주소가 범위를 벗어났습니다.');
      }
      fs.read(config.fd, buffer, 0, getBlockLength(), lba * getBlockLength(), handle);
      function handle(err, bytesRead, buffer) {
        if (err) {
          return callback(err);
        }
        callback(null, buffer);
      }
    }

    function writeBlock(lba, buffer, callback) {
      if (lba < 0 || lba > getLastLogicalBlockAddress()) {
        throw new Error('논리 블럭 주소가 범위를 벗어났습니다.');
      }
      fs.write(config.fd, buffer, 0, getBlockLength(), lba * getBlockLength(), handle);
      function handle(err, written, buffer) {
        if (err) {
          return callback(err);
        }
        callback(null, buffer);
      }
    }

    function getLastLogicalBlockAddress() {
      return config.lastLogicalBlockAddress;
    }

    function getBlockLength() {
      return 512;
    }
  }
};