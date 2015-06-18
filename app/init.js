var gui = require('nw.gui');
var win = gui.Window.get();
var nativeMenuBar = new gui.Menu({ type: 'menubar' });
nativeMenuBar.createMacBuiltin('Phoket for PC', {
  hideEdit: true,
  hideWindow: true
});
//win.showDevTools();
win.menu = nativeMenuBar;

var driver = require('usb-msc-driver-nwjs');

var writeScript = function () {
	addScript("scripts/fileSystem.js");
	setTimeout(function () {
		addScript('scripts/wrapper.js');
		setTimeout(function () {
			addScript("scripts/fileSystemLayer.js");
			setTimeout(function () {
				addScript('scripts/frontFileManager.js');
				setTimeout(function () {
					addScript("scripts/main.js");
				}, 50);
			}, 50);
		}, 50);
	}, 50);
};

function addScript(src) {
	var s = document.createElement('script');
	s.setAttribute('src', src);
	document.body.appendChild(s);
}

var device = null;
driver.getFirstBlockDevice(function (err, result) {
	if (!result) {
		return alert('발견하지 못함');
	}
	device = result;
	writeScript();
});
