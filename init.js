var driver = require('usb-msc-driver-nwjs');


var writeScript = function () {

addScript("scripts/fileSystem.js"     );
setTimeout(function () {

addScript('scripts/wrapper.js');

	setTimeout(function () {
addScript("scripts/fileSystemLayer.js");

		setTimeout(function () {

addScript('scripts/frontFileManager.js');

			setTimeout(function () {
				addScript("scripts/main.js"           );
			}, 50);
		}, 50);
	}, 50);

}, 50);


/*
var content = '<script src="scripts/wrapper.js"></script>' +
		'<script src="scripts/frontFileManager.js"></script>
<script src="scripts/fileSystem.js"              ></script>' +	
<script src="scripts/fileSystemLayer.js"            ></script>' +
<script src="scripts/main.js"           ></script>';
	*/

};

	
	function addScript( src ) {
  var s = document.createElement( 'script' );
  s.setAttribute( 'src', src );
  document.body.appendChild( s );
}



var device = null;
driver.getFirstBlockDevice(function (err, result) {
	if (!result) {
		return alert('발견하지 못함');
	}
	device = result;
	
	//	alert('발견');
	writeScript();

		

});
