/*global fileSystem:false*/
function frontFileManager() {
  // 그냥 쓰고 싶을 때 
  this.filesystem = new fileSystem(); // jshint ignore:line
  // * 쓰고 싶을 때
  this.filesystemlayer = new fileSystemLayer(this.filesystem); // jshint ignore:line
}

frontFileManager.prototype = {

  fs: require('fs'),

  currentTargetId: null,
  currentFolderId: null,
  currentTargetIdArray: new Array(100),
  currentTargetIdCount: 0,

  filesystem: null, 
  filesystemlayer: null,

  folderCnt: null,
  ctrlFlag: false,

  previewToggle: false,
  moreoptionToggle: false,
  isFile: false, 
  isClickfolder: false,

  totalInterval: 0,
  totalPictureNum: 0,

  fileViewInit: function () {
    var self = this;
    this.filesystemlayer.fileSystemInit(function () {

      // 썸네일 만드는 것 
      self.makeThumbnailProcess(); 

      var sqlite3 = require('sqlite3').verbose();
      var db = new sqlite3.Database('CaPicDB');
      // progress bar 
      self.leftFolderAdd(function() {
        self.centerFolderAdd(function() {
          $('#loadingBar').hide();
        });
      });

      // 홈 버튼 이벤트 
      $('#homebutton').bind('click',function () {
        self.leftFolderAdd();
        self.centerFolderAdd();
        self.isFile = false;
        self.currentTargetId = null;
        self.currentFolderId = null;
        self.currentTargetIdCount = 0;
      });

      // 삭제 버튼 
      $('#log').bind('click', function () {
        console.log('delete');
        $('#loadingBar').show();
        if (self.currentFolderId === null && self.currentTargetId === null) {
          return;
        }
        if (self.isClickfolder === true) { // 폴더 
          // USB 삭제
          db.all('SELECT * FROM media WHERE folder_id = ' + self.currentFolderId, function (err, rows) {
            var currentFolderTargetIdArray = new Array(100);
            var currentFolderTargetIdCount = 0;
            for (var i = 0; i < rows.length; i++) {
              currentFolderTargetIdArray[currentFolderTargetIdCount++] = rows[i].name;
            }
            // DB 삭제
            db.run('DELETE from folder WHERE id = ' + self.currentFolderId); // 폴더 삭제
            db.run('DELETE from media WHERE folder_id = ' + self.currentFolderId); // 파일 삭제
            //self.dbUpdate(); //DB갱신

            // USB 삭제
            var count = 0;
            var processFile = function (count) {
              console.log(count);
              self.filesystemlayer.filedelete(currentFolderTargetIdArray[count], function (err) {
                if (err) {
                  return console.log(err);
                }

                if (currentFolderTargetIdCount - 1 === count) {
                  self.leftFolderAdd(function () {
                    self.centerFolderAdd(function () {
                      $('#loadingBar').hide();
                    });
                  });                  
                  return;
                }
                count++;
                processFile(count);
              });
            };
            processFile(count);
          });
        } else { // 파일 
          if (self.currentTargetIdCount === 0) {
            self.filesystemlayer.filedelete(self.currentTargetId, function() {
              db.run("DELETE from media WHERE name = '" + self.currentTargetId + "'"); // DB삭제
              self.leftFolderAdd(function () {
                self.centerFolderAdd(function () {
                  $('#loadingBar').hide();
                });
              });
            }); // USB 삭제
          } else {
            for (var i = 0; i < self.currentTargetIdCount; i++) {
              console.log(self.currentTargetIdArray[i]);
            }
            // USB 삭제 
            var count = 0;
            var processFile = function (count) {
              console.log(count);
              self.filesystemlayer.filedelete(self.currentTargetIdArray[count], function (err) {
                db.run("DELETE from media WHERE name = '" + self.currentTargetIdArray[count] + "'");
                if (err) {
                  return console.log(err);
                }
                if (self.currentTargetIdCount - 1 === count) {
                  self.leftFolderAdd(function () {
                    self.centerFolderAdd(function () {
                      $('#loadingBar').hide();
                    });
                  });
                  return;
                }
                count++;
                processFile(count);
              });
            };
            processFile(count);
          }
        }
      });
      // 내보내기 버튼 
      $('#settings').bind('click', function () {
        console.log("fileout");
        $('#loadingBar').show();
        console.log(self.isClickfolder);
        if (self.currentFolderId === null && self.currentTargetId === null) {
          $('#loadingBar').hide();
          return;
        }
        if (self.isClickfolder === true) { // 폴더 
          db.all('SELECT * FROM folder WHERE id = ' + self.currentFolderId, function (err, rowsFolder){
            var mkdir = require('mkdirp');
            var foldername = rowsFolder[0].name;
            console.log(foldername);
            mkdir('./' + foldername, function () {
              db.all('SELECT * FROM media WHERE folder_id = ' + self.currentFolderId, function (err, rows) {
                var currentFolderTargetIdArray = new Array(100);
                var currentFolderTargetIdCount = 0;
                for (var i = 0; i < rows.length; i++){
                  currentFolderTargetIdArray[currentFolderTargetIdCount++] = rows[i].name;
                }
                // USB 삭제
                var count = 0;
                var processFile = function (count) {
                  console.log(count);
                  self.filesystemlayer.fileout(currentFolderTargetIdArray[count], foldername, function (err) {
                    if (err) {
                      return console.log(err);
                    }
                    if (currentFolderTargetIdCount - 1 === count) {
                      $('#loadingBar').hide();
                      return;
                    }
                    count++;
                    processFile(count);
                  });
                };
                processFile(count);
              });
            });
          });
        } else {
          if (self.currentTargetIdCount === 0) {
            self.filesystemlayer.fileout(self.currentTargetId, false, function () {
              $('#loadingBar').hide();
            });
          } else {
            for (var i = 0; i < self.currentTargetIdCount; i++) {
              console.log(self.currentTargetIdArray[i]);
            }

            var count = 0;
            var processFile = function (count) {
              console.log(count);
                self.filesystemlayer.fileout(self.currentTargetIdArray[count], false, function (err) {
                  if (err) {
                    return console.log(err);
                  }

                  if (self.currentTargetIdCount-1 === count) {
                    $('#loadingBar').hide();
                    return;
                  }
                  count++;
                  processFile(count);
                });
            };
            processFile(count);
          }
        }
      });
/*
      //폴더만들기 
      $('#addfolder').bind('click',function () {
        self.folderCnt ++;
        var pageCreator = [
          '<li>image' + self.folderCnt + '</li>'
            ].join('\n');
            $(pageCreator).appendTo('#folders');

            if(self.moreoptionToggle)
          self.centerMakeFolderNo2(i);
            else
              self.centerMakeFolderNo1(i);

            self.centerfileEvent();
      });
*/
      //폴더 보기 모양 바꾸기  
      $('#moreoption').bind('click', function () {
        self.moreoptionToggle = !self.moreoptionToggle;
        if (self.isFile) {
          self.centerFileAdd(self.currentFolderId);
          console.log(self.currentFolderId);
        } else {
          self.centerFolderAdd();
        }
      });

      //미리보기 
      $('#preview').bind('click', function () {
        if (self.previewToggle) {
          $('#tshirtCanvasDiv').remove();
          self.previewToggle = false;
        } else {
          var pageCreator = [
            '<div id="tshirtCanvasDiv" style="background-color:#f5f5f5; border:1px solid #d3d3d3;">',
            '<div  style="padding: 40px 20px;"></div>',
            '<canvas id="tshirtCanvas"  style=" width:300px; height:300px; ">미리보기 할 이미지가 없습니다. </canvas>',
            '</div>'
          ].join('\n');
          $(pageCreator).appendTo('#window');
          self.previewToggle = true;
        }
      });
      // 작업 
      $('#refresh').bind('click', function () {});

      // drag and drop (in)
      var dropTarget = document.querySelector("#files");
      require('drag-and-drop-files')(dropTarget, function (files) {
        $('#loadingBar').show();
        console.log(files);
        self.addpicusb(files);
        //self.addpicdb(files); // 사진추가
      });

      $('#addDirectory').bind('click', function () {
        document.getElementById('ipt_addProject').click();
      });
      
      var handleFileSelect = function (evt) {
        $('#loadingBar').show();
        var fileslist = evt.target.files;
        console.log(fileslist);

        var files = new Array(fileslist.length);
        for (var i = 0; i < fileslist.length; i++) {
          files[i] = fileslist[i];
        }
        console.log(files);

        self.addpicusb(files);
        //self.addpicdb(files);
        
        /*
        var file = files[0];
        if (files && file) {
            var reader = new FileReader();
            reader.onload = function(readerEvt) {
              //var binaryString = readerEvt.target.result;
              //self.filesystemlayer.addElementPush(file.name,btoa(binaryString));
              //self.addpicdb();//사진추가
            };
            reader.readAsBinaryString(file);
        }
        */
      };

      if (window.File && window.FileReader && window.FileList && window.Blob) {
        $('#ipt_addProject').bind('click',function () {
          document.getElementById('ipt_addProject').addEventListener('change', handleFileSelect, false);
        });
        //document.getElementById('addDirectory').addEventListener('change', handleFileSelect, false);
        //$('#addDirectory').bind('click',function () {
      } else {
        alert('The File APIs are not fully supported in this browser.');
      }

      // 키보드 이벤트 (누를 때)
      $(document).bind('keydown', function (event) {
        if ('' + event.keyCode === '91') {
          console.log('command down');
          if (self.currentTargetIdCount === 0) {
            self.currentTargetIdArray[self.currentTargetIdCount++] = self.currentTargetId;
          }
          self.ctrlFlag = true;
        }
      });

      // 키보드 이벤트 
      $(document).keyup(function (event) {
        if ('' + event.keyCode === '91') {
          console.log('command up');
          self.ctrlFlag = false;
          for (var i = 0; i < self.currentTargetIdCount; i++) {
            console.log(self.currentTargetIdArray[i]);
          }
        }
      });

      //self.dbUpdate();

      //db.run("UPDATE media SET picturetaken=1422926902484 where id =999");
      /*
      var sqlite3 = require('sqlite3').verbose();
      var db = new sqlite3.Database('CaPicDB');
      db.all("SELECT * FROM media ORDER BY picturetaken ASC",function(err,rows){
        console.log(rows);
        //rows contain values while errors, well you can figure out.
      });
      */
      /*
      //db.run("DELETE from folder");
      //self.calculatePictureInterval();

      db.all("SELECT * FROM media",function(err,rows){
        console.log(rows);
        //rows contain values while errors, well you can figure out.
      });

      db.all("SELECT * FROM media",function(err,rows){
        console.log(rows);
        //rows contain values while errors, well you can figure out.
      });
      console.log("asdasdas");

      var sqlite3 = require('sqlite3').verbose();

      var db = new sqlite3.Database('CaPicDB');
      db.all("SELECT * FROM media",function(err,rows){
        console.log(rows);
        //rows contain values while errors, well you can figure out.
      });
      console.log("asdasdas");

      //DB
      //Load modules
      var sqlite3 = require('sqlite3').verbose();

      var db = new sqlite3.Database('CaPicDB');

      db.each("SELECT * FROM media", function(err, row) {
            //console.log(row.id + ": " + row.info);
            console.log(row["id"]);

      });
      for(var i=0; i<fileIdcount; i++)
            db.run("UPDATE media SET folder_id=" + folderIDForDB + " where id = " + fileIdArray[i]);

      var db = new sqlite3.Database('database_name');
      db.each("SELECT * FROM folder", function(err, row) {
            console.log(row.id + ": " + row.info);
          });*/
      /*
      db.serialize(function() {
        db.run("CREATE TABLE folder (info TEXT)");

        var stmt = db.prepare("INSERT INTO folder VALUES (?)");
        for (var i = 0; i < 10; i++) {
            stmt.run("Ipsum " + i);
        }
        stmt.finalize();

        db.each("SELECT rowid AS id, info FROM folder", function(err, row) {
            console.log(row.id + ": " + row.info);
        });
      });
      db.close();
      */

      /*
      //Perform INSERT operation.
      db.run("INSERT into table_name(col1,col2,col3) VALUES (val1,val2,val3)");

      //Perform DELETE operation
      db.run("DELETE * from table_name where condition");

      //Perform UPDATE operation
      db.run("UPDATE table_name where condition");
      */
      //사진정보 
    });
  },

  makeThumbnailProcess: function () {
    var self = this;
    var filecount = self.filesystem.fileCount();
  
    var count = 0;
    var beginProcess = function () {
      if (count === filecount) {
        return;
      }
      var filename = self.filesystem.fileNameReturn(count);
      count++;
      makeThumbnail(filename);
    };

    const gm = require('gm').subClass({ imageMagick: true });

    var makeThumbnail = function (filename) {
      if (filename === "CaPicDB") {
        return beginProcess();
      }
      this.fs.exists('thumbnails/'+ filename, function (exists) {
        if (exists) {
          console.log("썸네일이 이미 존재합니다");
          beginProcess();
        } else {
          self.filesystemlayer.fileout(filename, "originals", function () {
            gm('originals/'+ filename).thumb(200, 200, 'thumbnails/'+ filename, 90, function (err) {
              if (err) {
                console.log(err);   
              }
              beginProcess();
            });
          });
        }
      });
    };
    beginProcess();
  },

  centerMakeFolderNo1: function (foldername, folderid) {
    var pageCreator = [
      '<li id= "folder'+ folderid +'" class="file_item" title="' + foldername + '" tag = "' + folderid + '">',
      '<img id = "folder' + folderid + '" class="icon" src="img/folder.png" alt="" tag = "' + folderid + '">',
      '<h3 id = "folder' + folderid + '" class="name" tag = "' + folderid + '" style="padding: 10px 0 0 0;">' + foldername + '</h3>',
      '</li>'
    ].join('\n');
    $(pageCreator).appendTo('#filelist');
  },

  centerMakeFolderNo2: function (foldername, folderid) {
    var pageCreator = [
      '<li id = "folder' + folderid + '" class="file_item1" align="center" title="' + foldername + '" tag = "' + folderid + '">',
      '<img id = "folder' + folderid + '" src="img/folder.png"  alt="" style="padding: 5px 0 0 0; width: 53px; height: 53px;" tag = "' + folderid + '">',
      '<h3 id = "folder' + folderid + '" class="name" tag = "' + folderid + '">' + foldername + '</h3>',
      '</li>'
    ].join('\n');
    $(pageCreator).appendTo('#filelist');
  },

  centerMakeFileNo1: function (filename) {
    var exists = this.fs.existsSync("thumbnails/" + filename);
    var pageCreator = [];
    if (exists) {
      pageCreator = [
        '<li id = "' + filename + '" class="file_item" title="' + filename + '">',
        '<img id = "' + filename + '" class="icon" src="thumbnails/'+ filename + '" alt="">',
        '<h3 id = "' + filename + '" class="name" style="padding: 10px 0 0 0;">' + filename + '</h3>',
        '</li>'
      ].join('\n');
    } else {
      pageCreator = [
        '<li id = "' + filename + '" class="file_item" title="' + filename + '">',
        '<img id = "' + filename + '" class="icon" src="img/noimage.png" alt="">',
        '<h3 id = "' + filename + '" class="name" style="padding: 10px 0 0 0;">' + filename + '</h3>',
        '</li>'
      ].join('\n');
    }
    $(pageCreator).appendTo('#filelist');
  },

  centerMakeFileNo2: function (filename) {
    var exists = this.fs.existsSync("thumbnails/"+ filename);
    var pageCreator = [];
    if (exists) {
      pageCreator = [
        '<li id = "' + filename + '" class="file_item1" align="center" title="' + filename + '">',
        '<img id = "' + filename + '" src="thumbnails/'+ filename + '"  alt="" style="padding: 5px 0 0 0; width: 53px; height: 53px;">',
        '<h3 id = "' + filename + '" class="name" >' + filename + '</h3>',
        '</li>'
      ].join('\n');
    } else {
      pageCreator = [
        '<li id = "' + filename + '" class="file_item1" align="center" title="' + filename + '">',
        '<img id = "' + filename + '" src="img/noimage.png"  alt="" style="padding: 5px 0 0 0; width: 53px; height: 53px;">',
        '<h3 id = "' + filename + '" class="name" >' + filename + '</h3>',
        '</li>'
      ].join('\n');
    }
    $(pageCreator).appendTo('#filelist');
  },

  leftFolderAdd: function (cb) {
    var self = this;
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database('CaPicDB');

    $('#folders').remove();
    var pageCreator = [
      '<ul id="folders">',
      '</ui>'
    ].join('\n');
    $(pageCreator).appendTo('#projects');
    db.all("SELECT * FROM folder", function (err, rows) {
      for (var i = 0; i < rows.length; i++) {
        var foldername = rows[i].name;
        var folderid = rows[i].id;
        // 왼쪽 폴더 생성
        var pageCreator = [
          '<li id= "folder'+ folderid +'"  tag = "' + folderid + '">' + foldername + '</li>',
        ].join('\n');
        $(pageCreator).appendTo('#folders');
      }
      // 왼쪽 폴더 클릭 이벤트 
      $('#folders li').click(function (e) {
        self.isClickfolder = true;
        self.isFile = true;

        $('#folders .active').removeClass('active');
        $(this).addClass('active');
        console.log(e.target);
        
        self.centerFileAdd($('#' + e.target.id).attr('tag'));
        self.currentFolderId = $('#' + e.target.id).attr('tag');
        console.log(self.isClickfolder);
      }); 
      if (cb) {
        cb();
      }
    }); 
  },

  centerFolderAdd: function (cb) {
    var self = this;
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database('CaPicDB');

    $('#filelist').remove();
    var pageCreator = [
      '<ul id="filelist">',
      '</ui>'
    ].join('\n');

    $(pageCreator).appendTo('#files');
    db.all('SELECT * FROM folder', function (err, rows) {
      for (var i = 0; i < rows.length; i++) {
        var foldername = rows[i].name;
        var folderid = rows[i].id;
        // 가운데 폴더 생성 
        if (self.moreoptionToggle) {
          self.centerMakeFolderNo2(foldername, folderid);
        } else {
          self.centerMakeFolderNo1(foldername, folderid);
        }
        self.folderCnt++;
      }
      self.centerfileEvent();
      if (cb) {
        cb();
      }
    }); 
  },

  centerFileAdd: function (targetName) {
    console.log(targetName);
    var self = this;
    $('#filelist').remove();
    var pageCreator = [
      '<ul id="filelist">',
      '</ui>'
    ].join('\n');
    $(pageCreator).appendTo('#files');
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database('CaPicDB');
    db.all("SELECT * FROM media where folder_id = " + targetName, function (err, rows) {
      for (var i = 0; i < rows.length; i++) {
        var filename = rows[i].name;
        console.log(filename);
        if (self.moreoptionToggle) {
          self.centerMakeFileNo2(filename);
        } else {
          self.centerMakeFileNo1(filename);
        }
      }
      self.centerfileEvent();
    });
  },

  centerfileEvent: function () {
    var self = this;
    // 가운데 파일 클릭 효과 
    $('#filelist li').bind('click',function (e) {
      self.currentTargetId = e.target.id;
      console.log(e.target.id);
      if (self.ctrlFlag === false) {
        self.currentTargetIdCount = 0;
        console.log($('#' + e.target.id).attr('tag'));

        if ($('#' + e.target.id).attr('tag')) { // 폴더
          self.isClickfolder = true;
          self.isFile = true;
          self.currentFolderId = $('#' + e.target.id).attr('tag');
          self.centerFileAdd( $('#' + e.target.id).attr('tag'));
        } else{ // 파일 
          self.isClickfolder = false;
          console.log("파일"); //미리 보기
          self.filesystemlayer.imagefileprint(e.target.id);
          console.log(e.target.id); //미리 보기 
        }
        $('.file_item1.selected').removeClass('selected');
        $(this).addClass('selected');

        $('.file_item.selected').removeClass('selected');
        $(this).addClass('selected');

        var targetName = $(this).find('.name').text();
        $('#extend .targetName').text(targetName);
        
        if (!$('#extend').hasClass('show')) {
          $('#extend').addClass('show');  
        }
      } else {
        var flag = false;
        for (var i = 0; i < self.currentTargetIdCount; i++) {
          if (self.currentTargetIdArray[i] === self.currentTargetId) {
            self.currentTargetIdArray[i] = self.currentTargetIdArray[self.currentTargetIdCount - 1];
            self.currentTargetIdCount--;
            $(this).removeClass('selected');
            flag = true;
            break;
            // $(this).addClass('selected');
          }
        }
        if (flag === false) {
          self.currentTargetIdArray[self.currentTargetIdCount++] = self.currentTargetId;
          $(this).addClass('selected');
        }
      }
    });

    // 더블 클릭 파일 열기 
    $('#filelist li').bind('dblclick',function (e) {
      if($('#' + e.target.id).attr('tag')) {//폴더
        console.log("폴더");
      } else { // 파일
        var gui = require('nw.gui');
        gui.Shell.openItem(e.target.id);
        // 바탕 화면에 있는 것만 열림 
      }
    });
  },

  addpicusb: function (files) {
    var self = this;
    var dbfiles = files;
    files = files.slice(0);
    console.log('Got some files:', files.length);
    console.log(files);
    if (!files) {
      return;
    }

    var beginProcess = function () {
      if (files.length === 0) {
        self.addpicdb(dbfiles);//사진추가   
        return;
      }
      var file = files[0];
      files.shift();
      processFile(file);
    };

    var processFile = function (file) {
      console.log(file.name);

      var reader = new FileReader();
      reader.onload = function(readerEvt) {
        var binaryString = readerEvt.target.result;
        self.filesystemlayer.addElementPush(file.name, btoa(binaryString), function (err) {
          if (err) {
            return console.log(err);
          }
          process.nextTick(beginProcess);
        });
      };
      reader.readAsBinaryString(file);
    };
    beginProcess();
  },

  addpicdb: function (files) {
    var self = this;
    files = files.slice(0);
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database('CaPicDB');
    console.log('Got some files:', files.length);
    if (!files) {
      return;
    }
    var beginProcess = function () {
      console.log(files.length);
      if (files.length === 0) {
        // 폴더 다 지우기 
        db.run('DELETE from folder');
        self.calculatePictureInterval();
        return;
      }
      var file = files[0];
      files.shift();
      processFile(file,files.length);
    };

    var processFile = function (file, idcnt) {
      console.log(file.name);
      console.log(file.path);

      // 사진 정보 
      db.all("SELECT * FROM media", function (err, rows) {
        var maxId = 0;
        console.log(rows.length);
        for (var i = 0; i < rows.length; i++) {
          if (maxId < rows[i].id) {
            maxId = rows[i].id;
          }
        }
        console.log();
        this.fs.stat(file.path, function (err, stats) {
          var str = stats.birthtime;
          var picturetaken = str.getTime();
          console.log(str);
          var res = str.toString().split(" ");
          res[1] = self.calculateCal(res[1]);
          console.log(picturetaken);
          db.run("INSERT into media(id,folder_id,name,picturetaken,year,month,day,latitude,longitude,path) VALUES (" + maxId+idcnt + ",-1,'" + file.name + "'," + picturetaken + "," + res[3] + "," + res[1] + "," + res[2] + ",null,null,null)");
        });
        process.nextTick(beginProcess);
      });      
    };
    beginProcess();
  },

  /*
  var ExifImage = require('exif').ExifImage;
    var fs = require('fs');
    new ExifImage({ image : file.path}, function (error, exifData) {
      db.all("SELECT * FROM media", function(err, rows) {
        var maxId=0;
        for(var i=0;i<rows.length;i++){
          if(maxId < rows[i].id)
            maxId = rows[i].id;
        }
        console.log(maxId)


              if (error){
                  console.log('Error: '+error.message);
                  fs.stat(file.path, function (err,stats) {
                    var str = stats.birthtime;
                    var picturetaken = str.getTime();
                    console.log(str);
                    var res = str.toString().split(" ");
                    res[1] = self.calculateCal(res[1]);
                    console.log(picturetaken)

                    db.run("INSERT into media(id,folder_id,name,picturetaken,year,month,day,latitude,longitude,path) VALUES (" + maxId+1 + ",-1,'" + file.name + "'," + picturetaken + "," + res[3] + "," + res[1] + "," + res[2] + ",null,null,null)");
            });
          }
              else{
                  console.log(exifData); // Do something with your data! 
                  var str = exifData.image.ModifyDate;
                  var gps = exifData.gps.GPSAltitude
                  console.log(str);
                  if(str == undefined || gps == undefined){
                    fs.stat(file.path, function (err,stats) {
                      var str = stats.birthtime;
                      var picturetaken = str.getTime();
                      var res = str.toString().split(" ");
                      res[1] = self.calculateCal(res[1]);
                      console.log(picturetaken)

                      db.run("INSERT into media(id,folder_id,name,picturetaken,year,month,day,latitude,longitude,path) VALUES ("+ maxId+1 + ",-1,'" + file.name + "'," + picturetaken + "," + res[3] + "," + res[1] + "," + res[2] + ",null,null,null)");
              });
                  }
                  else{
                    var res = str.split(" ");
                  var resdate = res[0].split(":");
                    fs.stat(file.path, function (err,stats) {
                      var str = stats.birthtime;
                      var picturetaken = str.getTime();
                      console.log(picturetaken)

                      db.run("INSERT into media(id,folder_id,name,picturetaken,year,month,day,latitude,longitude,path) VALUES (" + maxId+1 + ",-1,'" + file.name + "'," + picturetaken + "," + resdate[0] + "," + resdate[1] + "," + resdate[2] + "," + exifData.gps.GPSAltitude + "," + exifData.gps.GPSLongitude[0] + ",null)");
              });
                  
              }
          }
        });

            process.nextTick(beginProcess);

        /*
        //시간관련 
            //var restime = res[1].split(":");
            //var time = ((restime[0] * 3600) + (restime[1] * 60) + restime[2])*1000 ;
            //console.log(time)
            id = ?
            folder_id = ?
            name = file.name
            picturetaken = 1422926902484
            year = resdate[0]
            month = resdate[1]
            day = resdate[2]
            latitude = exifData.gps.GPSAltitude
            longitude = exifData.gps.GPSLongitude[0]
            tag = ""
            placdName =""
            path = ""
        

        });
      };

      beginProcess();

  },
  */

  calculateCal: function(month) {
    switch (month) {
      case "Jan" : month = 1; break;
      case "Feb" : month = 2; break;
      case "Mar" : month = 3; break;
      case "Apr" : month = 4; break;
      case "May" : month = 5; break;
      case "Jun" : month = 6; break;
      case "Jul" : month = 7; break;
      case "Aug" : month = 8; break;
      case "Sep" : month = 9; break;
      case "Oct" : month = 10; break;
      case "Nov" : month = 11; break;
      case "Dec" : month = 12; break;
      default : month = 0;
    }
    return month;
  },

  calculatePictureInterval: function() { //사진 간 시간 간격을 계산하는 함수
    var self = this;
    var pictureTakenTime = 0;
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database('CaPicDB');
    // DB
    db.all("SELECT * FROM media ORDER BY picturetaken ASC", function (err, rows) {
      for (var i = 0; i < rows.length; i++) {
        // 사진이 촬영된 날짜
        var _pictureTakenTime = rows[i].picturetaken;
        console.log(_pictureTakenTime);
        if (pictureTakenTime === 0) {
          pictureTakenTime = _pictureTakenTime;
        }
        self.totalInterval += _pictureTakenTime - pictureTakenTime; // 차이
        pictureTakenTime = _pictureTakenTime;
        self.totalPictureNum++; // 개수
      }
      console.log("차이 : "  + self.totalInterval  + " 개수 : "  + self.totalPictureNum);
      self.pictureClassification();
    });
  },

  // 파일 DB에 추가  + 폴더 DB 추가 
  pictureClassification: function() {

    var self = this;

    var startFolderID = "";
    var endFolderID = "";
    var folderIDForDB = 0;//Folder DB에 들어가는 아이디
    var _pictureTakenTime = 0;//현재 읽고 있는 사진 이전의 찍힌 시간
    var pictureNumInStory = 0;//특정 스토리에 들어가는 사진의 개수를 센다
    var fileIdArray = new Array(100);
    var fileIdcount = 0;

    var averageInterval = self.totalInterval;
    if (self.totalPictureNum !== 0) {
      averageInterval /= self.totalPictureNum;
    }

    console.log(averageInterval);

    // Manager _m = new Manager(totalPictureNum, averageInterval, standardDerivation);
    // manager에 넣기 


    // DB
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database('CaPicDB');
    db.all("SELECT * FROM media ORDER BY picturetaken ASC", function (err, rows) {
      var j;
      var new_name;

      for (var i = 0; i < rows.length; i++) {

        var pictureTakenTime = rows[i].picturetaken;
        var currentId = rows[i].id;
            
        var folderID = "" + rows[i].year + "_" + rows[i].month + "_" + rows[i].day;
            
        if (_pictureTakenTime === 0) {
          startFolderID = folderID;
        }

        if (pictureTakenTime - _pictureTakenTime > averageInterval && _pictureTakenTime !== 0) {
          console.log("success");

          if (startFolderID !== endFolderID) {
            new_name = startFolderID + "~" + endFolderID + "의 스토리";
          } else {
            new_name = startFolderID + "의 스토리";
          }

          console.log(folderIDForDB + " " + new_name);
              
          // 폴더 만들기 
          db.run("INSERT into folder(id,image,name,picture_num,thumbNail_id) VALUES (" + folderIDForDB + ",'xx','" + new_name + "'," + pictureNumInStory + ",'null')");

          // id가 저장되어 있는 거랑 같은 파일 picturetaken id에 folderIDForDB를 넣기 

          for (j = 0; j < fileIdcount; j++) {
            db.run("UPDATE media SET folder_id=" + folderIDForDB + " where id = " + fileIdArray[j]);
          }

          pictureNumInStory = 0;
          startFolderID = folderID;
          folderIDForDB++;

          fileIdcount = 0;
        }

        pictureNumInStory++;
        _pictureTakenTime = pictureTakenTime;
        endFolderID = folderID;
        
        fileIdArray[fileIdcount++] = currentId;
      }

      // 마지막 사진 
      if (fileIdcount > 0) {
        if (startFolderID !== endFolderID) {
          new_name = startFolderID + "~" + endFolderID + "의 스토리";
        } else {
          new_name = startFolderID + "의 스토리";
        }
        db.run("INSERT into folder(id,image,name,picture_num,thumbNail_id) VALUES (" + folderIDForDB + ",'xx','" + new_name + "'," + pictureNumInStory + ",'null')");
        for (j = 0; j < fileIdcount; j++) {
          db.run("UPDATE media SET folder_id=" + folderIDForDB + " where id = " + fileIdArray[j]);
        }
      }
          
      self.leftFolderAdd(function () {
        self.centerFolderAdd(function () {
          $('#loadingBar').hide();
          self.dbUpdate();
        });
      });

      self.isFile = false;
      self.currentTargetId = null;
      self.currentFolderId = null;
      self.currentTargetIdCount = 0;
    });
  },

  dbUpdate: function () {
    var self = this;
    // DB 갱신 existsSync
    var stats = this.fs.statSync('./CaPicDB');
    var fd = this.fs.openSync('./CaPicDB', "r");
    var buffer = new Buffer(stats.size);
    this.fs.readSync(fd, buffer, 0, buffer.length, null);
    console.log(buffer);

    //self.filesystemlayer.filedelete("CaPicDB");
    //self.filesystemlayer.addElementPush("CaPicDB",buffer);
    
    self.filesystemlayer.filedelete("CaPicDB", function (err) {
      console.log('filedelete ERR ' + err);
      console.log("DELETE END");
      self.filesystemlayer.addElementPush("CaPicDB", buffer);
    });

    /*
    fs.stat('./CaPicDB', function (error, stats) {
          fs.open('./CaPicDB', "r", function (error, fd) {
              var buffer = new Buffer(stats.size);
              fs.read(fd, buffer, 0, buffer.length, null, function (error, bytesRead, buffer) {
                console.log(buffer);
                self.filesystemlayer.filedelete("CaPicDB",function(err){
            self.filesystemlayer.addElementPush("CaPicDB",buffer);
            });
              });
          });
      });
    */
  }
};