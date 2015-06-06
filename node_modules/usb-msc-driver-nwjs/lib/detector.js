module.exports = function (config) {
  this.run = run;
  this.getEattle = getEattle;
  return this;

  function run(device, callback) {
    var testCases = [
      testMbrSignature,
      testPartitionEntries,
      testEattleSignature
    ];
    function runTestCase() {
      if (testCases.length === 0) {
        return callback(null, true);
      }
      var testCase = testCases[0];
      testCases.shift();
      testCase(device, function (err, result) {
        if (err) {
          return callback(err, false);
        }
        if (result === false) {
          return callback(null, false);
        }
        process.nextTick(runTestCase);
      });
    }
    runTestCase();
  }

  function testMbrSignature(device, callback) {
    var buffer = new Buffer(512);
    device.readBlock(0, buffer, function (err, result) {
      if (err) {
        return callback(err);
      }
      var isSignatureValid = result[510] === 0x55 && result[511] === 0xAA;
      callback(null, isSignatureValid);
    });
  }

  function testPartitionEntries(device, callback) {
    var block = new Buffer(512);
    var complete = false;

    function assert(value) {
      if (complete) {
        return;
      }
      if (!value) {
        complete = true;
        callback(null, false);
      }
    }

    device.readBlock(0, block, function (err) {
      if (err) {
        return callback(err);
      }
      var reserved = getPartitionEntry(block, 1);
      assert(reserved.status === 0);
      assert(reserved.partitionType === 0x0b);
      assert(reserved.firstLba === 2);
      assert(reserved.chs[0] === 0xfeffff);
      assert(reserved.chs[1] === 0xfeffff);
      var eattle = getPartitionEntry(block, 2);
      assert(eattle.status === 0);
      assert(eattle.partitionType === 0x7f);
      assert(eattle.firstLba === reserved.size + 2);
      assert(eattle.size === (device.getLastLogicalBlockAddress() + 1) - (2 + reserved.size));
      assert(eattle.chs[0] === 0xfeffff);
      assert(eattle.chs[1] === 0xfeffff);
      var notUsed = [
        getPartitionEntry(block, 3),
        getPartitionEntry(block, 4)
      ];
      notUsed.forEach(function (entry) {
        assert(entry.status === 0);
        assert(entry.partitionType === 0);
        assert(entry.firstLba === 0);
        assert(entry.size === 0);
        assert(entry.chs[0] === 0);
        assert(entry.chs[1] === 0);
      });
      if (complete) {
        return;
      }
      callback(null, true);
    });
  }

  function getPartitionEntry(block, index) {

    var base = 446 + (index - 1) * 16;

    var entry = {};
    entry.status = block.readUInt8(base + 0x00);
    entry.partitionType = block.readUInt8(base + 0x04);
    entry.firstLba = block.readUInt32LE(base + 0x08);
    entry.size = block.readUInt32LE(base + 0x0C);
    entry.chs = [
      block.readUIntBE(base + 0x01, 3),
      block.readUIntBE(base + 0x05, 3)
    ];

    return entry;
  }

  function testEattleSignature(device, callback) {
    var block = new Buffer(512);
    device.readBlock(0, block, function (err) {
      if (err) {
        return callback(err);
      }
      var eattle = getPartitionEntry(block, 2);
      device.readBlock(eattle.firstLba, block, function (err) {
        if (err) {
          return callback(err);
        }
        for (var i = 0; i < config.eattleSignature.length; i++) {
          if (config.eattleSignature[i] !== block[i]) {
            return callback(null, false);
          }
        }
        return callback(null, true);
      });
    });
  }

  function getEattle(device, callback) {
    var block = new Buffer(512);
    device.readBlock(0, block, function (err) {
      if (err) {
        return callback(err);
      }
      var eattle = getPartitionEntry(block, 2);
      callback(null, eattle);
    });
  }
};