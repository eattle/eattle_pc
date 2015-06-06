module.exports = function (config) {
  config = config;
  return MemoryBlockDevice;

  function MemoryBlockDevice(config) {

    config = config || {};

    if (!config.size || config.size < 1) {
      throw new Error('크기가 잘못되었습니다.');
    }

    var storage = {};

    this.readBlock = readBlock;
    this.writeBlock = writeBlock;
    this.getLastLogicalBlockAddress = getLastLogicalBlockAddress;
    this.getBlockLength = getBlockLength;
    return this;

    function readBlock(lba, buffer, callback) {
      if (lba < 0 || lba >= config.size) {
        throw new Error('블럭 번호가 범위를 초과하였습니다.');
      }
      if (!buffer) {
        throw new Error('버퍼가 없습니다');
      }
      if (buffer.length !== getBlockLength()) {
        throw new Error('버퍼 크기가 잘못되었습니다.');
      }
      if (storage[lba] === undefined) {
        storage[lba] = new Buffer(getBlockLength());
        storage[lba].fill(0);
      }
      storage[lba].copy(buffer);
      callback(null, buffer);

      
    }

    function writeBlock(lba, buffer, callback) {
      if (lba < 0 || lba >= config.size) {
        throw new Error('블럭 번호가 범위를 초과하였습니다.');
      }
      if (!buffer) {
        throw new Error('버퍼가 없습니다');
      }
      if (buffer.length !== getBlockLength()) {
        throw new Error('버퍼 크기가 잘못되었습니다.');
      }
      if (storage[lba] === undefined) {
        storage[lba] = new Buffer(getBlockLength());
      }
      buffer.copy(storage[lba]);
      callback(null, buffer);
     
    }

    function getLastLogicalBlockAddress() {
      return config.size - 1;
    }

    function getBlockLength() {
      return 512;
    }
  } 
};