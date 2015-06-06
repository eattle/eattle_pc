module.exports = function (fs, detector, fsBlockDevice, windowedBlockDevice) {

  const FsBlockDevice = fsBlockDevice;
  const WindowedBlockDevice = windowedBlockDevice;
  this.getFirstBlockDevice = getFirstBlockDevice;
  return this;

  function getFirstBlockDevice(callback) {
    var iterator = blockDeviceCandidates();

    var complete = false;
    function end(err, result) {
      if (complete) {
        return;
      }
      complete = true;
      callback(err, result);
    }

    function step() {
      var path = iterator.next().value;
      fs.exists(path, function (exists) {
        if (exists === false) {
          return end(null, null);
        }
        fs.stat(path, function (err, stats) {
          if (err) {
            return step();
          }
          if (stats.isBlockDevice() === false) {
            return step();
          }
          
          var command = 'diskutil info $path';
          command = command.split('$path').join(path);
          var stdoutBuffer = require('child_process').execSync(command);
          var stdoutString = stdoutBuffer.toString('utf8');
          const pattern = /\(\d+ Bytes/;
          var capacity = pattern.exec(stdoutString);
          capacity = capacity.toString().split('(').join('').split(' Bytes').join('');
          var lastLogicalBlockAddress = (capacity / 512) - 1;

          fs.open(path, 'r+', function (err, fd) {
            if (err) {
              return step();
            }
            var config = {};
            config.fd = fd;
            config.lastLogicalBlockAddress = lastLogicalBlockAddress;
            var device = new FsBlockDevice(config);
            detector.run(device, function (err, result) {
              if (err) {
                return step();
              }
              if (result === false) {
                return step();
              }
              detector.getEattle(device, function (err, eattle) {
                if (err) {
                  return step();
                }
                var eattleConfig = {
                  offset: eattle.firstLba + 1,
                  size: eattle.size - 1,
                  device: device
                };
                var eattleDevice = new WindowedBlockDevice(eattleConfig);
                end(null, eattleDevice);
              });
            });
          });
        });
      });
    }
    step();
  }

  function *blockDeviceCandidates() {
    var number = 0;
    for (;;) {
      yield '/dev/disk#'.split('#').join(number);
      number++;
    }
  }
};