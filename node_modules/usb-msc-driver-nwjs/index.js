const fs = require('fs');

const Riccardo = require('riccardo');
var riccardo = new Riccardo();

riccardo.set('fs', fs);
riccardo.scan('lib', '');

var host = riccardo.get('host');
module.exports = host;

function format(path) {
  const FsBlockDevice = riccardo.get('fsBlockDevice');
  const format = riccardo.get('format');

  fs.open(path, 'r+', function (err, fd) {
    console.log(err, fd);
    if (err) {
      return;
    }
    var device = new FsBlockDevice({
      fd: fd,
      lastLogicalBlockAddress: 15679487
    });
    format.formatMbr(device, 10, function (err) {
      if (err) {
        return;
      }
      console.log(err);
      format.formatEattle(device, 12, function (err) {
        console.log(err);
      });
    });
  });
}

// format('/dev/disk1');

/*
host.getFirstBlockDevice(function (err, result) {
  console.log(err, result);
});
*/
