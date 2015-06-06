module.exports = function () {
  return WindowedBlockDevice;

  function WindowedBlockDevice(config) {

    validateConfig(config);
    validateBounds(config);

    this.readBlock = readBlock;
    this.writeBlock = writeBlock;
    this.getLastLogicalBlockAddress = getLastLogicalBlockAddress;
    this.getBlockLength = config.device.getBlockLength;

    function readBlock(lba, buffer, callback) {
      if (lba < 0 || lba > getLastLogicalBlockAddress()) {
        throw new Error('블럭 번호가 범위를 벗어났습니다.');
      }
      lba = lba + config.offset;
      return config.device.readBlock(lba, buffer, callback);
    }
    function writeBlock(lba, buffer, callback) {
      if (lba < 0 || lba > getLastLogicalBlockAddress()) {
        throw new Error('블럭 번호가 범위를 벗어났습니다.');
      }
      lba = lba + config.offset;
      return config.device.writeBlock(lba, buffer, callback);
    }
    function getLastLogicalBlockAddress() {
      return config.size - 1;
    }
  }

  function validateConfig(config) {
    if (!config) {
      throw new Error('설정을 지정해야 합니다.');
    }
    if (config.offset === undefined || config.offset === null) {
      throw new Error('오프셋을 지정해야 합니다.');
    }
    if (config.size === undefined || config.size === null) {
      throw new Error('오프셋을 지정해야 합니다.');
    }
    if (config.offset < 0) {
      throw new Error('오프셋은 0과 같거나 0보다 커야 합니다');
    }
    if (config.size <= 0) {
      throw new Error('크기는 0보다 커야 합니다.');
    }
    if (typeof config.device !== typeof {}) {
      throw new Error('장치가 지정되어야 합니다.');
    }
  }

  function validateBounds(config) {
    var lastLba = config.device.getLastLogicalBlockAddress();
    if (config.offset > lastLba) {
      throw new Error('오프셋이 범위를 초과했습니다.');
    }
    if (config.offset + config.size - 1 > lastLba) {
      throw new Error('크기가 범위를 초과했습니다.');
    }
  }
};