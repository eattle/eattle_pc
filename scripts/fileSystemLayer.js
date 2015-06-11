function fileSystemLayer(fileSystem) {
  var functionList = [
    'filetablecopy',
    'addElementPush',
    'addElementPushCopy',
    'filedelete',
    'deleteCopy',
    'printAllBlock',
    'fileInit',
    'incaseSearchTable',
    'copytableinit',
    'fileout',
    'imagefileprint',
    'fileSystemInit',
    'fileInputInit',
    'convertImage'
  ];
  var self = this;
  functionList.forEach(function (name) {
    self[name] = wrap(fileSystem, fileSystem[name]);
  });
}