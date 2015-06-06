
var filemanager = new frontFileManager();
filemanager.fileViewInit();
 

function drag(e) {

    e.dataTransfer.setData("text", e.target.id);
    console.log(e.target);
}
function dragend(e) {
    console.log(e.target);
    
}

function drop(e) {
    console.log(e.target);
    
}
