module.exports = function (config) {
  this.formatEattle = formatEattle;
  this.formatMbr = formatMbr;
  return this;

  function formatMbr(blockDevice, reservedVolumeSize, callback) {
    if (!reservedVolumeSize) {
      throw new Error('첫 번째 예약된 볼륨 크기를 지정해야 합니다.');
    }
    if (reservedVolumeSize <= 0 || reservedVolumeSize >= blockDevice.getLastLogicalBlockAddress() - 10) {
      throw new Error('첫 번째 예약된 볼륨 크기가 허용된 범위를 초과합니다.');
    }
    var mbr = new Buffer(512);
    mbr.fill(0);
    mbr[510] = 0x55;
    mbr[511] = 0xAA;

    var totalSize = blockDevice.getLastLogicalBlockAddress() + 1;
    writePartitionEntry(mbr, 446, 0x0B, 2, reservedVolumeSize);
    writePartitionEntry(mbr, 462, 0x7F, 2 + reservedVolumeSize, totalSize - (2 + reservedVolumeSize));

    blockDevice.writeBlock(0, mbr, function (err) {
      if (err) {
        return callback(err);
      }
      callback(null);
    });

    function writePartitionEntry(mbr, base, type, first, size) {
      mbr[base + 1] = mbr[base + 5] = 0xfe;
      mbr[base + 2] = mbr[base + 6] = 0xff;
      mbr[base + 3] = mbr[base + 7] = 0xff; 
      mbr[base + 4] = type;
      mbr.writeUInt32LE(first, base + 0x08);
      mbr.writeUInt32LE(size, base + 0x0C);
    }
  }

  function formatEattle(blockDevice, offset, callback) {
    if (!offset) {
      offset = 0;
    }
    var header = new Buffer(512);
    header.fill(0);
    config.eattleSignature.copy(header);
    blockDevice.writeBlock(offset, header, function (err) {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
};