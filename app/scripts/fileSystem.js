/*global device:false*/
function fileSystem() {
}

var buffer = new Buffer(512);

const thunkify = require('thunkify');
const readBlock = thunkify(device.readBlock);
const writeBlock = thunkify(device.writeBlock);

fileSystem.prototype = {

  fs: require('fs'),

  CLUSTERSPACESIZE: 512,      // 클러스터 전체 사이즈 
  CLUSTERCNT: 30000,          // 클러스터 갯수 
  
  SPACELOCATION: 504,         // 다음 공간 위치 
  NEXTLOCATION: 506,          // 다음 주소 위치     
  ISCOMPLETELOCATION: 510,    // 백업 완료했는지 확인해 주는 것의 위치 
  
  STRINGSIZE: 77,             // 문자 블럭 크기 
  STRINGLENSIZE: 3,           // 문자 길이 블럭 크기 
  SPACESIZE: 2,               // 공간 위치 블럭 크기 
  LOCATIONSIZE: 4,            // 주소 블럭 크기 

  content: ['C', 'D', '3S', 'X', 'E', 'ASA', 'SD'],
  size: [100, 70000, 2302, 4034, 80000, 3033, 22],

  // 탐색 테이블
  searchtable: Array.apply(null, new Array(100)).map(Number.prototype.valueOf, 0),
  endpoint: 0,
  currentDataLength: 0,

  fileCount: function () {
    console.log(this.endpoint);
    return this.endpoint;
  },

  fileNameReturn: function (number) {
    console.log(number);
    return this.searchtable[number][0];
  },

  passwardInput : function* (password){
    password = 1234;
    yield this.pushBinary(2, password, 4, 0);
  },

  passwardOutput : function* () {
    var dummybuffer = new Buffer(512);
    var resultBuffer = yield readBlock(2, dummybuffer);
    var password = yield this.readIntToBinary(2, 0, 4, resultBuffer);
    return password;
  },

  fileSystemInit: function* () {
    for (var i = 0; i < 100; i++) {
      console.log('init');
      this.searchtable[i] = Array.apply(null, new Array(5)).map(Number.prototype.valueOf, 0);
    }
    // 파일 테이블 
    yield this.incaseSearchTable();
    // USB에서 DB 꺼내오기
    yield this.fileout("PhoketDB", ".");
  },

  fileInputInit: function* (file, binaryString) {
    yield this.addElementPush(file.name, binaryString);
    // yield this.addElementPushCopy();
    // self.fileInit(btoa(binaryString)); // 초기화 
    // self.incaseSearchTable(); // 탐색테이블 만듦 초기화 
    yield this.printAllBlock(1);
  },

  emptySpaceSearch: function* () {
    var dummybuffer = new Buffer(512);
    var num = 0;
    var resultBuffer;
    
    resultBuffer = yield readBlock(3, dummybuffer);
    var i;
    for (i = 0; i < 512; i++) {
      if ((resultBuffer[i] & 0x80) === 0) { num = 0; break; }
      if ((resultBuffer[i] & 0x40) === 0) { num = 1; break; }
      if ((resultBuffer[i] & 0x20) === 0) { num = 2; break; }
      if ((resultBuffer[i] & 0x10) === 0) { num = 3; break; }
      if ((resultBuffer[i] & 0x08) === 0) { num = 4; break; }
      if ((resultBuffer[i] & 0x04) === 0) { num = 5; break; }
      if ((resultBuffer[i] & 0x02) === 0) { num = 6; break; }
      if ((resultBuffer[i] & 0x01) === 0) { num = 7; break; }
    }
    resultBuffer = yield readBlock((i * 8) + num + 4, dummybuffer);

    // (i * 8) + num -> 몇 번째인지 
    var addressnum = (i * 8) + num;

    for (i = 0; i < 512; i++) {
      if ((resultBuffer[i] & 0x80) === 0) { return (4096 * (addressnum +1)) + (i * 8) + 0 + 4; }
      if ((resultBuffer[i] & 0x40) === 0) { return (4096 * (addressnum +1)) + (i * 8) + 1 + 4; }
      if ((resultBuffer[i] & 0x20) === 0) { return (4096 * (addressnum +1)) + (i * 8) + 2 + 4; }
      if ((resultBuffer[i] & 0x10) === 0) { return (4096 * (addressnum +1)) + (i * 8) + 3 + 4; }
      if ((resultBuffer[i] & 0x08) === 0) { return (4096 * (addressnum +1)) + (i * 8) + 4 + 4; }
      if ((resultBuffer[i] & 0x04) === 0) { return (4096 * (addressnum +1)) + (i * 8) + 5 + 4; }
      if ((resultBuffer[i] & 0x02) === 0) { return (4096 * (addressnum +1)) + (i * 8) + 6 + 4; }
      if ((resultBuffer[i] & 0x01) === 0) { return (4096 * (addressnum +1)) + (i * 8) + 7 + 4; }
    }
    return -1;    
  },

  fileout: function* (selectfilename, outpath) {

    var dummyFristbuffer = new Buffer(512);
    var self = this;
    var result = yield self.stringSearch(selectfilename);
    var resultbyte= new Buffer(result[4]);

    console.log(result[0]);
    console.log(result[4]);

    if (result[0] === -1) {
      alert("값이 잘못 들어왔습니다");
    } else {
      var resultstringaddress = result[0];
      var limit = 0;
      var bytecnt = 0;
      var resultfirstBuffer = yield readBlock(resultstringaddress, dummyFristbuffer);
      while (resultstringaddress !== 0) {
        var originalbyteAddress = yield self.readIntToBinary(resultstringaddress, limit, self.LOCATIONSIZE, resultfirstBuffer);
        var resultBuffer = yield readBlock(originalbyteAddress, buffer);
        for (var i = 0; i < self.CLUSTERSPACESIZE; i++) {
          if ((bytecnt < result[4]) === false) {
            break;
          }
          resultbyte[bytecnt++] = resultBuffer[i];
        }
        if (bytecnt >= result[4]) {
          break;
        }
        limit += self.LOCATIONSIZE;
        if (limit >= self.SPACELOCATION) {
          console.log("11");
          console.log(resultstringaddress);
          resultstringaddress = yield self.readIntToBinary(resultstringaddress, self.NEXTLOCATION, self.LOCATIONSIZE, resultfirstBuffer);
          resultfirstBuffer = yield readBlock(resultstringaddress, dummyFristbuffer);
          limit = 0;
        }
      }
    }

    var writeStream;
    if (outpath === false) {
      writeStream = this.fs.createWriteStream('../' + selectfilename);
    } else {
      writeStream = this.fs.createWriteStream(outpath + '/' + selectfilename);
    }
    
    writeStream.write(resultbyte);
    console.log(selectfilename);
    console.log("success");
  },

  imagefileprint: function* (selectfilename) {
    //D  S   X               
    //1220879 1870864 2133464    
    var dummyFristbuffer = new Buffer(512);
    var self = this;    
    var result = yield self.stringSearch(selectfilename);
    var resultbyte = new Buffer(result[4]);

    console.log(result[0]);
    console.log(result[4]);

    if (result[0] === -1) {
      alert("값이 잘못 들어왔습니다");
    } else {
      var resultstringaddress = result[0];
      var limit = 0;
      var bytecnt = 0;
      var resultfirstBuffer = yield readBlock(resultstringaddress, dummyFristbuffer);
      while (resultstringaddress !== 0) {
        var originalbyteAddress = yield self.readIntToBinary(resultstringaddress, limit, self.LOCATIONSIZE, resultfirstBuffer);
        var resultBuffer = yield readBlock(originalbyteAddress, buffer);
        for (var i = 0; i < self.CLUSTERSPACESIZE; i++) {
          if ((bytecnt < result[4]) === false) {
            break;
          }
          resultbyte[bytecnt++] = resultBuffer[i];
        }
        if (bytecnt >= result[4]) {
          break;
        }
        limit += self.LOCATIONSIZE;
        if (limit >= self.SPACELOCATION) {
          console.log("11");
          console.log(resultstringaddress);
          resultstringaddress = yield self.readIntToBinary(resultstringaddress, self.NEXTLOCATION, self.LOCATIONSIZE, resultfirstBuffer);
          resultfirstBuffer = yield readBlock(resultstringaddress, dummyFristbuffer);
          limit = 0;
        }
      }
      var mCanvas = document.getElementById('tshirtCanvas');
      var mContext = mCanvas.getContext('2d');
      var img = new Image();
      img.onload = function() {
        mCanvas.width = 300;
        mCanvas.height = 300;
        mContext.drawImage(img, 10, 10, 280, 250);
      };
      // console.log('x1x1x1xx1xxx11x1xx1xxxxxxxx ' + resultbyte.length);
      var base64Image = resultbyte.toString('base64');
      img.src = "data:image/gif;base64," + base64Image;
      // console.log("xxxxxxxxxxxx " + base64Image);
      // console.log("xxxxxxxxxxxxxxxxxxx " + base64Image.length);
    }
  },

  incaseSearchTable: function* () {
    this.endpoint = 0;
    var self = this;
    var location = 0;
    var startaddress = 0;
    var tablesize = this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE;
    var stringaddresslocation = this.STRINGSIZE + this.STRINGLENSIZE;
    var resultBuffer = yield readBlock(location, buffer);

    //0번지 파일 테이블 끝날 때까지 
    while (true) {
      // console.log(" location " + location + "  startaddress " + startaddress);

      // 문자
      var dummystring = yield self.readStringToBinary(location, startaddress, this.STRINGSIZE, resultBuffer); 
      // 파일의 길이
      var dummyfilelen = yield self.readIntToBinary(location, startaddress + this.STRINGSIZE, this.STRINGLENSIZE, resultBuffer);
      // 번지
      var dummystringaddress = yield self.readIntToBinary(location, stringaddresslocation + startaddress, this.LOCATIONSIZE, resultBuffer);
      
      // console.log(" dummystring " + dummystring + "  dummystringaddress " + dummystringaddress);

      // 탐색 테이블 생성
      // 문자
      this.searchtable[this.endpoint][0] = dummystring;
      // 번지
      this.searchtable[this.endpoint][1] = dummystringaddress;
      // 문자의 위치
      this.searchtable[this.endpoint][2] = location;
      // 문자의 주소
      this.searchtable[this.endpoint][3] = startaddress;
      // 파일의 길이
      this.searchtable[this.endpoint][4] = dummyfilelen;
      
      this.endpoint++;

      startaddress = startaddress+tablesize;
      
      if (startaddress >= (yield self.readIntToBinary(location, this.SPACELOCATION, this.SPACESIZE, resultBuffer))) {
        location = yield self.readIntToBinary(location, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer);
        if (location === 0) {
          break;
        }
        resultBuffer = yield readBlock(location, buffer);
        startaddress = 0;
      }
    }
    
    for (var i = 0; i < this.endpoint; i++) {
      console.log( " 0] " + this.searchtable[i][0] + "  1] " + this.searchtable[i][1] + " 2] " + this.searchtable[i][2] + " 3] " + this.searchtable[i][3] + " 4] " + this.searchtable[i][4]);
    }
  },

  dropfiletable: function* (last) {
    var dummybuffer = new Buffer(512);
    var self = this;
    while (true) {
      var resultBuffer = yield readBlock(last, dummybuffer);
      var result = yield self.readIntToBinary(last, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer);
      for (var j = self.SPACELOCATION; j < self.CLUSTERSPACESIZE; j++) {
        resultBuffer[j] = 0; // 비어 있는 공간 찾고 표시
      }
      yield writeBlock(last, resultBuffer);
      if (result === 0) {
        break;
      }
      last = result;
    }
  },

  clusterWriteCheck: function* (location) {
    var dummybuffer = new Buffer(512);
    location = location-4;
    var flag = true;
    var resultBuffer;

    resultBuffer = yield readBlock((location >> 12) - 1 + 4, dummybuffer);
    if (((location & 0x0FFF) & 0x07) === 0) { resultBuffer[(location & 0x0FFF) >> 3] |= 0x80; }
    if (((location & 0x0FFF) & 0x07) === 1) { resultBuffer[(location & 0x0FFF) >> 3] |= 0x40; }
    if (((location & 0x0FFF) & 0x07) === 2) { resultBuffer[(location & 0x0FFF) >> 3] |= 0x20; }
    if (((location & 0x0FFF) & 0x07) === 3) { resultBuffer[(location & 0x0FFF) >> 3] |= 0x10; }
    if (((location & 0x0FFF) & 0x07) === 4) { resultBuffer[(location & 0x0FFF) >> 3] |= 0x08; }
    if (((location & 0x0FFF) & 0x07) === 5) { resultBuffer[(location & 0x0FFF) >> 3] |= 0x04; }
    if (((location & 0x0FFF) & 0x07) === 6) { resultBuffer[(location & 0x0FFF) >> 3] |= 0x02; }
    if (((location & 0x0FFF) & 0x07) === 7) { resultBuffer[(location & 0x0FFF) >> 3] |= 0x01; }
    
    for (var i = 0; i < this.CLUSTERSPACESIZE; i++) {
      if (resultBuffer[i] !== -1) {
        flag = false;
        break;
      }
    }
    yield writeBlock((location >> 12) -1 + 4, resultBuffer);

    resultBuffer = yield readBlock(3, dummybuffer);
    if (flag) {
      if ((((location >> 12) - 1) & 0x07) === 0){ resultBuffer[2][((location >> 12) - 1) >> 3] |= 0x80; }
      if ((((location >> 12) - 1) & 0x07) === 1){ resultBuffer[2][((location >> 12) - 1) >> 3] |= 0x40; }
      if ((((location >> 12) - 1) & 0x07) === 2){ resultBuffer[2][((location >> 12) - 1) >> 3] |= 0x20; }
      if ((((location >> 12) - 1) & 0x07) === 3){ resultBuffer[2][((location >> 12) - 1) >> 3] |= 0x10; }
      if ((((location >> 12) - 1) & 0x07) === 4){ resultBuffer[2][((location >> 12) - 1) >> 3] |= 0x08; }
      if ((((location >> 12) - 1) & 0x07) === 5){ resultBuffer[2][((location >> 12) - 1) >> 3] |= 0x04; }
      if ((((location >> 12) - 1) & 0x07) === 6){ resultBuffer[2][((location >> 12) - 1) >> 3] |= 0x02; }
      if ((((location >> 12) - 1) & 0x07) === 7){ resultBuffer[2][((location >> 12) - 1) >> 3] |= 0x01; }
    }
    yield writeBlock(3, resultBuffer);
  },

  clusterWriteUnCheck: function* (location) {
    var dummybuffer = new Buffer(512);
    location = location - 4;
    var resultBuffer = yield readBlock((location >> 12) - 1 + 4, dummybuffer);
    if (((location & 0x0FFF) & 0x07) === 0) { resultBuffer[(location & 0x0FFF) >> 3] &= ~0x80; }
    if (((location & 0x0FFF) & 0x07) === 1) { resultBuffer[(location & 0x0FFF) >> 3] &= ~0x40; }
    if (((location & 0x0FFF) & 0x07) === 2) { resultBuffer[(location & 0x0FFF) >> 3] &= ~0x20; }
    if (((location & 0x0FFF) & 0x07) === 3) { resultBuffer[(location & 0x0FFF) >> 3] &= ~0x10; }
    if (((location & 0x0FFF) & 0x07) === 4) { resultBuffer[(location & 0x0FFF) >> 3] &= ~0x08; }
    if (((location & 0x0FFF) & 0x07) === 5) { resultBuffer[(location & 0x0FFF) >> 3] &= ~0x04; }
    if (((location & 0x0FFF) & 0x07) === 6) { resultBuffer[(location & 0x0FFF) >> 3] &= ~0x02; }
    if (((location & 0x0FFF) & 0x07) === 7) { resultBuffer[(location & 0x0FFF) >> 3] &= ~0x01; }
    yield writeBlock((location >> 12) -1 + 4, resultBuffer);
  },

  filetablecopy: function * () {
    var dummyFirstbuffer = new Buffer(512);
    var dummylittlebuffer = new Buffer(512);
    var self = this;
    var givetablelocation = 1;
    var taketablelocation = 0;
    var i;
    
    // 0번째 0으로 다 만들어 준다. 
    yield self.dropfiletable(taketablelocation);
    // 서치 테이블 보고 주소들 0 만들어 준다.  
    for (i = 0; i < this.endpoint; i++) {
      yield self.dropfiletable(this.searchtable[i][1]);
    }
    
    var blocksize = this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE;
    var addresslocation;
    var last = givetablelocation;

    var resultFirstBuffer = yield readBlock(last, dummyFirstbuffer);
    var result = yield self.readIntToBinary(last, this.NEXTLOCATION, this.LOCATIONSIZE, resultFirstBuffer);
    
    // 실제 백업
    while (true) {
      var flag = true;
      // 해당되는 주소들 집합 
      for (i = 0; i < self.CLUSTERSPACESIZE; i += blocksize) {
        var location = yield self.readIntToBinary(last, i + self.STRINGSIZE + self.STRINGLENSIZE, self.LOCATIONSIZE, resultFirstBuffer);
        if (location === 0) {
          break;
        }

        // 0번지 

        // 문자
        var dummystring = yield self.readStringToBinary(last, i, self.STRINGSIZE, resultFirstBuffer);
        // 바이너리 길이
        var dummyfilelen = yield self.readIntToBinary(last, i + self.STRINGSIZE, self.STRINGLENSIZE, resultFirstBuffer); 
        addresslocation = yield self.emptySpaceSearch();

        // 여기 dummystring
        // 문자
        yield self.pushAddress(0, self.STRINGSIZE, taketablelocation, dummystring);
        // 길이
        yield self.pushAddress(dummyfilelen, self.STRINGLENSIZE, taketablelocation, '0');
        // 번지
        var limit = yield self.pushAddress(addresslocation, self.LOCATIONSIZE, taketablelocation, '0');
        
        if (limit >= self.SPACELOCATION) {
          var dummySpace = yield self.emptySpaceSearch();
          // 마지막 위치 넣어 주기
          yield self.pushBinary(taketablelocation, dummySpace, self.LOCATIONSIZE, self.NEXTLOCATION); 
          taketablelocation = dummySpace;
          // 비어 있는 공간 찾고 표시
          yield self.clusterWriteCheck(taketablelocation);
        }

        // 주소 번지
        var littlelast = location; 
        console.log(littlelast);
        var resultlittleBuffer = yield readBlock(littlelast, dummylittlebuffer);
        var littleresult = yield self.readIntToBinary(littlelast, self.NEXTLOCATION, self.LOCATIONSIZE, resultlittleBuffer);
        while (true) {
          var resultBuffer = yield readBlock(littlelast, buffer);
          yield writeBlock(addresslocation, resultBuffer);
          // 비어 있는 공간 찾고 표시
          yield self.clusterWriteCheck(addresslocation); 
          littlelast = littleresult;
          if (littleresult === 0) {
            break;
          }
          resultlittleBuffer = yield readBlock(littlelast, dummylittlebuffer);
          littleresult = yield self.readIntToBinary(littlelast, self.NEXTLOCATION, self.LOCATIONSIZE, resultlittleBuffer);
          addresslocation = yield self.emptySpaceSearch();       
        }
        flag = false;
      }
      if (flag) {
        break;
      }
      last = result;
      if (result === 0) {
        break;
      }
      resultFirstBuffer = yield readBlock(result, dummyFirstbuffer);
      result = yield self.readIntToBinary(last, this.NEXTLOCATION, this.LOCATIONSIZE, resultFirstBuffer);
    }

    // 바뀐 0번지로 서치 테이블 완성 
    yield self.incaseSearchTable();
  },

  copytableinit: function* () {
    var i;
    var self = this;
    var tablelocation = 1;
    var addresslocation;
    var dummySpace;
    var resultBuffer;

    // 0으로 만들기
    var blocksize = this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE;
    var last = tablelocation;
    var result = tablelocation;

    while (true) {
      resultBuffer = yield readBlock(last, buffer);

      var flag = true;
      // 해당되는 주소들 집합 
      for (i = 0; i < self.CLUSTERSPACESIZE; i += blocksize) {
        // 번지
        var location = yield self.readIntToBinary(last, i + self.STRINGSIZE + self.STRINGLENSIZE, self.LOCATIONSIZE, resultBuffer);
        if (location === 0) {
          break;
        }

        // 주소 번지 
        self.dropfiletable(location);
        flag = false;
      }
      if (flag) {
        break;
      }
      result = yield self.readIntToBinary(last, self.NEXTLOCATION, self.LOCATIONSIZE, resultBuffer);
      for (var j = self.SPACELOCATION; j < self.CLUSTERSPACESIZE; j++) {
        resultBuffer[j] = 0; // 비어 있는 공간 찾고 표시 
      }
      yield writeBlock(last, resultBuffer);
      if (result === 0) {
        break;
      }
      last = result;
    }

    for (i = 0; i < this.endpoint; i++) {
      addresslocation = yield self.emptySpaceSearch();

      var beforeaddresslocation = addresslocation;
      console.log(beforeaddresslocation);
      // 주소
      result = self.searchtable[i][1]; 
      while (true) {
        resultBuffer = yield readBlock(result, buffer);
        yield writeBlock(addresslocation, resultBuffer);
        yield self.clusterWriteCheck(addresslocation); //비어 있는 공간 찾고 표시 
        
        result = yield this.readIntToBinary(result, self.NEXTLOCATION, self.LOCATIONSIZE, resultBuffer);
        
        if(result === 0) {
          break;
        }
        
        dummySpace = yield self.emptySpaceSearch();

        // 마지막 위치 넣어 주기
        yield self.pushBinary(addresslocation, dummySpace, self.LOCATIONSIZE, self.NEXTLOCATION);
        addresslocation = dummySpace;

        // 비어 있는 공간 찾고 표시
        yield self.clusterWriteCheck(addresslocation);
      }

      // 1번째 
      // 여기 searchtable[i][0]
      yield self.pushAddress(0, self.STRINGSIZE, tablelocation, self.searchtable[i][0]); // 문자
      yield self.pushAddress(self.searchtable[i][4], self.STRINGLENSIZE, tablelocation, "0"); // 길이 
      var limit = yield self.pushAddress(beforeaddresslocation, self.LOCATIONSIZE, tablelocation, "0"); // 번지 
      if (limit >= self.SPACELOCATION) {
        dummySpace = yield self.emptySpaceSearch();
        yield self.pushBinary(tablelocation, dummySpace, self.LOCATIONSIZE, self.NEXTLOCATION); // 마지막 위치 넣어 주기 
        tablelocation = dummySpace;
        yield self.clusterWriteCheck(tablelocation); // 비어 있는 공간 찾고 표시 
      }
    }
  },
  
  fileInit: function* (binaryString) {
    var allAddressSpace = 0;
    var self = this;
    var dummySpace;

    for (var i = 1; i <= 1; i++) { //content.length
      var bytearray = new Buffer(binaryString, 'base64');
      bytearray = binaryString;
      var emptyCoreAdressSpace = yield self.emptySpaceSearch();
      console.log(bytearray.length);
      // 0번째 
      var stringContent = this.content[i];

      // 여기 stringContent
      yield self.pushAddress(0, this.STRINGSIZE, allAddressSpace, stringContent); // 문자
      yield self.pushAddress(bytearray.length, this.STRINGLENSIZE, allAddressSpace, "0"); // 길이 
      var limit = yield self.pushAddress(emptyCoreAdressSpace, this.LOCATIONSIZE, allAddressSpace, "0"); // 번지 

      yield self.clusterWriteCheck(emptyCoreAdressSpace); // 비어 있는 공간 찾고 표시 
      if (limit >= this.SPACELOCATION) {
        dummySpace = yield self.emptySpaceSearch();
        yield self.pushBinary(allAddressSpace, dummySpace, this.LOCATIONSIZE, this.NEXTLOCATION); // 마지막 위치 넣어주기 
        allAddressSpace = dummySpace;
        yield self.clusterWriteCheck(allAddressSpace); // 비어 있는 공간 찾고 표시 
      }

      var cnt = 0; 
      
      // size[i] -> bytearray.length
      for (var j = 0; j <= bytearray.length / (this.CLUSTERSPACESIZE - 1); j++) {
        
        var emptyCoreSpace = yield self.emptySpaceSearch();
        for (var k = 0; k < this.CLUSTERSPACESIZE; k++) {
          if (cnt < bytearray.length) {
            buffer[k] = bytearray[cnt++];
          }
        }
        yield writeBlock(emptyCoreSpace, buffer);

        yield self.clusterWriteCheck(emptyCoreSpace); // 비어 있는 공간 찾고 표시
        // 주소들 값 넣기 
        limit = yield self.pushAddress(emptyCoreSpace, this.LOCATIONSIZE, emptyCoreAdressSpace, "0");
        
        if (limit >= this.SPACELOCATION) {
          dummySpace = yield self.emptySpaceSearch();
          yield self.pushBinary(emptyCoreAdressSpace, dummySpace, this.LOCATIONSIZE, this.NEXTLOCATION);
          emptyCoreAdressSpace = dummySpace;
          yield self.clusterWriteCheck(emptyCoreAdressSpace); // 비어 있는 공간 찾고 표시 
        }
      }
    }
  },

  readStringToBinary: function* (location, address, currentlocationsize, resultBuffer) {
    //byte -> string
    var cnt = 0;
    var i;
    for (i = address; i < address + currentlocationsize; i++) {
      if (resultBuffer[i] === 0) {
        break;
      }
      cnt ++;
    }
    if (cnt === 0) {
      return 0;
    }
    var binaryByte = new Array(cnt);
    var count = 0;
    for (i = address; i < address + cnt; i++) {
      binaryByte[count++] = resultBuffer[i];
    }
    return String.fromCharCode.apply(String, binaryByte);
  },

  readIntToBinary: function* (location, address, currentlocationsize, resultBuffer) {
    // byte -> int
    var result = 0;
    for (var i = 0; i < currentlocationsize; i++) {
      result += ((resultBuffer[address + currentlocationsize - i - 1] & 0xFF) << (i * 8));
    }
    return result;
  },

  pushStringBinary: function* (location, conversion, currentlocationsize, address) {
    // string -> byte
    var i;
    var dummybuffer = new Buffer(512);
    var resultBuffer = yield readBlock(location, dummybuffer);

    if (conversion === "0") {
      for (i = 0; i < currentlocationsize; i++) {
        resultBuffer[address + i] = 0;
      }
    } else {
      var binaryByte = [];
      for (i = 0; i < conversion.length; ++i) {
        binaryByte.push(conversion.charCodeAt(i));
      }
      for (i = 0; i < currentlocationsize; i++) {
        if (i < binaryByte.length) {
          resultBuffer[address + i] = binaryByte[i];
        } else {
          resultBuffer[address + i] = 0x00;
        }
      }
    }
    yield writeBlock(location, resultBuffer);
  },

  pushBinary: function* (location, conversion, currentlocationsize, address) {
    // int -> byte
    var i;
    var dummybuffer = new Buffer(512);
    var resultBuffer = yield readBlock(location, dummybuffer);
    if (conversion === 0) {
      for (i = 0; i < currentlocationsize; i++) {
        resultBuffer[address+i] = 0;
      }
    } else {
      for (i = 0; i < currentlocationsize; i++) {
        resultBuffer[address + currentlocationsize - i - 1] = conversion >> (8 * i);
      }
    }
    yield writeBlock(location, resultBuffer);
  },

  pushAddress: function* (conversion, currentlocationsize, location, stringconversion) {

    var self = this;
    var dummybuffer = new Buffer(512);

    var resultBuffer = yield readBlock(location, dummybuffer);
    var address = yield self.readIntToBinary(location, this.SPACELOCATION, this.SPACESIZE, resultBuffer);

    if (stringconversion === "0") {
      yield self.pushBinary(location, conversion, currentlocationsize, address);
    } else {
      yield self.pushStringBinary(location, stringconversion, currentlocationsize, address);
    }
    yield self.pushBinary(location, address + currentlocationsize, this.SPACESIZE, this.SPACELOCATION);    
    return address+currentlocationsize;
  },

  lastReturn: function* (last) {
    var self = this;
    var dummybuffer = new Buffer(512);
    var resultBuffer = yield readBlock(last, dummybuffer);
    var result = yield self.readIntToBinary(last, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer);
    while (result !== 0) {
      last = result;
      resultBuffer = yield readBlock(last, dummybuffer);
      result = yield self.readIntToBinary(last, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer);
    }
    return last;
  },

  addElementPushCopy: function* () {
    // 0번지 백업
    var dummySpace;
    var self = this;
    var last =  yield self.lastHaveSpaceReturn(1);
    var dummystring = this.searchtable[this.endpoint - 1][0];
    var dummyfilelen = this.searchtable[this.endpoint - 1][4]; // 파일의 길이 
    var dummystringaddress = this.searchtable[this.endpoint - 1][1]; // 마지막 번째 번지 

    var addresslocation = yield self.emptySpaceSearch();

    // 여기 dummystring
    yield self.pushAddress(0, this.STRINGSIZE, last[0], dummystring); //문자
    yield self.pushAddress(dummyfilelen, this.STRINGLENSIZE, last[0], "0"); //길이 
    var limit = yield self.pushAddress(addresslocation, this.LOCATIONSIZE, last[0], "0"); //번지 
    
    if (limit >= this.SPACELOCATION) {
      dummySpace = yield self.emptySpaceSearch();
      self.pushBinary(last[0], dummySpace, this.LOCATIONSIZE, this.NEXTLOCATION); // 마지막 위치 넣어 주기 
      last[0] = dummySpace;
      yield self.clusterWriteCheck(last[0]); // 비어 있는 공간 찾고 표시 
    }

    // 주소들 백업 
    var result = dummystringaddress;
    while (true) {
      var resultBuffer = yield readBlock(result, buffer);
      yield writeBlock(addresslocation, resultBuffer);

      yield self.clusterWriteCheck(addresslocation); // 비어 있는 공간 찾고 표시 
      
      result = yield self.readIntToBinary(result, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer);
      if (result === 0) {
        break;
      }

      dummySpace = yield self.emptySpaceSearch();
      yield self.pushBinary(addresslocation,dummySpace, this.LOCATIONSIZE, this.NEXTLOCATION); // 마지막 위치 넣어주기
      addresslocation = dummySpace;
      yield self.clusterWriteCheck(addresslocation); // 비어 있는 공간 찾고 표시
    }

    // 완료 표시
    // var resultBuffer = yield readBlock(1, buffer);
    // resultBuffer[this.ISCOMPLETELOCATION] = 1;
    // yield writeBlock(1, resultBuffer);
    console.log("addElementPushcopy success");
  },

  addElementPush: function* (content, binaryString) {

    var dummySpace;
    var self = this;
    var bytearray = new Buffer(binaryString, 'base64');
    
    var emptyCoreAdressSpace = yield self.emptySpaceSearch();
    
    // '0'번지 정렬 새롭게 빌드
    var last =  yield self.lastReturn(0);
    
    var stringContent = content;
     
    // 여기 stringContent
    yield self.pushAddress(0, this.STRINGSIZE, last, stringContent); // 문자
    yield self.pushAddress(bytearray.length, this.STRINGLENSIZE, last, "0"); // 길이
    var limit = yield self.pushAddress(emptyCoreAdressSpace, this.LOCATIONSIZE, last, "0"); // 번지 
    
    yield self.clusterWriteCheck(emptyCoreAdressSpace); // 비어 있는 공간 찾고 표시    

    var fristemptyCoreAdressSpace = emptyCoreAdressSpace;

    if (limit >= this.SPACELOCATION) {
      dummySpace = yield self.emptySpaceSearch();
      yield self.pushBinary(last, dummySpace, this.LOCATIONSIZE, this.NEXTLOCATION); // 마지막 위치 넣어 주기 
      yield self.clusterWriteCheck(dummySpace); // 비어 있는 공간 찾고 표시
    }

    var cnt = 0;
    for (var i = 0; i <= bytearray.length / this.CLUSTERSPACESIZE; i++) {
      var emptyCoreSpace = yield self.emptySpaceSearch();

      for (var j = 0; j < this.CLUSTERSPACESIZE; j++) {
        if (cnt < bytearray.length) {
          buffer[j] = bytearray[cnt++]; // 실제 내용 넣기 
        }
      }
      yield writeBlock(emptyCoreSpace, buffer);

      yield self.clusterWriteCheck(emptyCoreSpace); // 비어 있는 공간 찾고 표시
      
      // 주소들 값 넣기(원본) 
      limit = yield self.pushAddress(emptyCoreSpace, this.LOCATIONSIZE, emptyCoreAdressSpace, "0");
      if (limit >= this.SPACELOCATION) {
        dummySpace = yield self.emptySpaceSearch();
        yield self.pushBinary(emptyCoreAdressSpace, dummySpace, this.LOCATIONSIZE, this.NEXTLOCATION);
        emptyCoreAdressSpace = dummySpace;
        yield self.clusterWriteCheck(emptyCoreAdressSpace); // 비어 있는 공간 찾고 표시
      }  
    }

    // 탐색 테이블 생성
    this.searchtable[this.endpoint][0] = stringContent; //문자
    this.searchtable[this.endpoint][1] = fristemptyCoreAdressSpace;//번지 
    this.searchtable[this.endpoint][2] = last;//문자의 위치  
    this.searchtable[this.endpoint][3] = limit-this.LOCATIONSIZE-this.STRINGLENSIZE-this.STRINGSIZE;//문자의 주소 
    this.searchtable[this.endpoint][4] = bytearray.length;
    this.endpoint++;

    console.log(this.endpoint);

    // 완료 표시 
    // var resultBuffer = yield readBlock(0, buffer);
    // resultBuffer[this.ISCOMPLETELOCATION] = 1;
    // yield writeBlock(0, resultBuffer);
    
    // yield this.addElementPushCopy();

    console.log("addElementPush success");
  },

  lastHaveSpaceReturn: function* (last) {
    var self = this;
    var sublast = last;
    var dummybuffer = new Buffer(512);
    var resultreturn = new Array(2);

    var resultBuffer = yield readBlock(last, dummybuffer);
    var result = yield self.readIntToBinary(last, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer);
    while (result !== 0) {
      sublast = last;
      last = result;
      resultBuffer = yield readBlock(last, dummybuffer);
      result = yield self.readIntToBinary(last, self.NEXTLOCATION, self.LOCATIONSIZE, resultBuffer);               
    }

    resultBuffer = yield readBlock(last, dummybuffer);
    var lastResult = yield self.readIntToBinary(last, self.SPACELOCATION, self.SPACESIZE, resultBuffer);

    if (lastResult === 0) {
      resultreturn[0] = sublast;
      resultreturn[1] = 1;
      return resultreturn;
    }
    resultreturn[0] = last;
    resultreturn[1] = 0;
    return resultreturn;
  },

  deleteCopy: function* (delString) {
    console.log("deleteCopy");

    var self = this;
    var blocksize = this.LOCATIONSIZE + this.STRINGLENSIZE + this.STRINGSIZE;
    var last = 1;
    var result, i, resultBuffer;
    
    var dummystringaddress = 0;
    
    var location = 0;
    var address = 0;
    resultBuffer = yield readBlock(last, buffer);

    var deleteBuffer = new Buffer(512);
    for (i = 0; i < 512; i++) {
      deleteBuffer[i] = 0;
    }

    // 검색 
    while (true) {
      for (i = 0; i < self.CLUSTERSPACESIZE; i += blocksize) {
        var dummystring = yield self.readStringToBinary(last, i, self.STRINGSIZE, resultBuffer);
        if (dummystring === delString) {
          location = last;
          address = i;
          break;
        }
      }
      result = yield self.readIntToBinary(last, self.NEXTLOCATION, self.LOCATIONSIZE, resultBuffer);
      if (result === 0) {
        break;
      }
      last = result;
      resultBuffer = yield readBlock(last, buffer);
    }
    
    // 주솟값 삭제
    while (dummystringaddress !== 0) {
      resultBuffer = yield readBlock(dummystringaddress, buffer);
      var dummy = yield self.readIntToBinary(dummystringaddress, self.NEXTLOCATION, self.LOCATIONSIZE, resultBuffer);

      yield writeBlock(dummystringaddress, deleteBuffer);
      // 비어 있는 체크된 것 해제하기   
      yield self.clusterWriteUnCheck(dummystringaddress);
      dummystringaddress = dummy;      
    }

    // 0번지 삭제 
    last =  yield self.lastHaveSpaceReturn(1);
    if (last[1] === 1) {
      yield self.pushBinary(last[0], 0, this.LOCATIONSIZE, this.NEXTLOCATION);
    }
    resultBuffer = yield readBlock(last[0], buffer);
    var lastResult = yield self.readIntToBinary(last[0], this.SPACELOCATION, this.SPACESIZE, resultBuffer);
    
    // 변경할 값 변수에 넣어 주기  
    var changeString = yield self.readStringToBinary(last[0], lastResult - (this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE), this.STRINGSIZE, resultBuffer);
    var changelen = yield self.readIntToBinary(last[0], lastResult - (this.LOCATIONSIZE + this.STRINGLENSIZE), this.STRINGLENSIZE, resultBuffer);
    var changelocation = yield self.readIntToBinary(last[0], lastResult - this.LOCATIONSIZE, this.LOCATIONSIZE, resultBuffer);
    
    for (var j = lastResult - (this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE); j<lastResult; j++) {
      resultBuffer[j] = 0;
    }
    yield writeBlock(last[0], resultBuffer);
    // 지우고 SPACELOCATION번째 값 그전으로 변경 
    yield self.pushBinary(last[0], lastResult - (this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE), this.SPACESIZE, this.SPACELOCATION);
    
    // 여기 changeString
    // 이름
    yield self.pushStringBinary(location, changeString, this.STRINGSIZE, address);
    // 길이
    yield self.pushBinary(location, changelen, this.STRINGLENSIZE, address + this.STRINGSIZE);
    // 번지
    yield self.pushBinary(location, changelocation, this.LOCATIONSIZE, address + this.STRINGSIZE + this.STRINGLENSIZE);
    
    // 완료 표시 
    // var resultBuffer = yield readBlock(1, buffer);
    // resultBuffer[this.ISCOMPLETELOCATION] = 1;
    // yield writeBlock(1, resultBuffer);

    console.log("success1");
  },

  filedelete: function* (delString) {
    var self = this;
    var i;

    var deleteBuffer = new Buffer(512);
    for (i = 0; i < 512; i++) {
      deleteBuffer[i] = 0;
    }
    var result = [];
    result = yield self.stringSearch(delString);

    if (result[0] === -1) {
      console.log('값이 잘못 들어왔습니다');
    } else {
      var resultstringaddress = result[0];
      var resultBuffer = yield readBlock(resultstringaddress, buffer);
      // 실제 파일과 주소값 삭제
      while (resultstringaddress !== 0) {
        var endlocation = yield self.readIntToBinary(resultstringaddress, this.SPACELOCATION, this.SPACESIZE, resultBuffer);
        console.log(endlocation);
        for (i = 0; i < endlocation; i += this.LOCATIONSIZE) {
          var deleteSpace = yield self.readIntToBinary(resultstringaddress, i, this.LOCATIONSIZE, resultBuffer);
          yield writeBlock(deleteSpace, deleteBuffer);
          yield self.clusterWriteUnCheck(deleteSpace); //비어있는 체크된것 해제하기
        }
        var dummy = yield self.readIntToBinary(resultstringaddress, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer);
        yield writeBlock(resultstringaddress, deleteBuffer);
        yield self.clusterWriteUnCheck(resultstringaddress); //비어있는 체크된것 해제하기
        resultstringaddress = dummy;    
        resultBuffer = yield readBlock(resultstringaddress, buffer);
      }

      // 0번째 값
      var last =  yield self.lastHaveSpaceReturn(0);
      if (last[1] === 1) {
        yield self.pushBinary(last[0], 0, this.LOCATIONSIZE, this.NEXTLOCATION);
        console.log("NEXT");
      }

      console.log(last);
      resultBuffer = yield readBlock(last[0], buffer);
      var lastResult = yield self.readIntToBinary(last[0],this.SPACELOCATION,this.SPACESIZE,resultBuffer);
 
      console.log(last[0]);
      console.log(resultBuffer);
      console.log(lastResult);

      // 변경할 값 변수에 넣어 주기  
      var changeString = yield self.readStringToBinary(last[0], lastResult - (this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE), this.STRINGSIZE, resultBuffer);
      var changelen = yield self.readIntToBinary(last[0], lastResult - (this.LOCATIONSIZE + this.STRINGLENSIZE), this.STRINGLENSIZE, resultBuffer);
      var changelocation = yield self.readIntToBinary(last[0], lastResult - this.LOCATIONSIZE, this.LOCATIONSIZE, resultBuffer);
      
      console.log("changeString " + changeString);
      
      // 0번지의 마지막 값 지우기
      for (var j = lastResult - (this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE); j < lastResult; j++) {
        resultBuffer[j] = 0; // 이름, 길이, 번지 지우기
      }
      yield writeBlock(last[0], resultBuffer);

      console.log("2");

      // 탐색 테이블 삭제
      this.searchtable[result[1]][0] = this.searchtable[this.endpoint - 1][0]; // 마지막 문자열
      this.searchtable[result[1]][1] = this.searchtable[this.endpoint - 1][1]; // 마지막 번지
      this.searchtable[result[1]][2] = this.searchtable[this.endpoint - 1][2]; // 마지막 위치
      this.searchtable[result[1]][3] = this.searchtable[this.endpoint - 1][3]; // 마지막 주소
      this.searchtable[result[1]][4] = this.searchtable[this.endpoint - 1][4]; // 마지막 파일 길이
      this.searchtable[this.endpoint-1][0] = "0";
      this.searchtable[this.endpoint-1][1] = "0";
      this.searchtable[this.endpoint-1][2] = "0";
      this.searchtable[this.endpoint-1][3] = "0";
      this.searchtable[this.endpoint-1][4] = "0";
      this.endpoint--;
      
      console.log("ssssssssssssssssssssss");
      console.log("k " + lastResult);

      // 지우고 SPACELOCATION번째 값 그전으로 변
      yield self.pushBinary(last[0], lastResult - (this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE), this.SPACESIZE, this.SPACELOCATION);
      // console.log(yield self.readIntToBinary(last[0],this.SPACELOCATION,this.SPACESIZE));
      
      // 마지막 값과 찾는 값과 같으면 끝낸다 (1개 남은 상태)
      if (changeString !== delString) {

        // 변경할 값 실제 넣어주기 
        // 여기 changeString
        // 이름
        yield self.pushStringBinary(result[2], changeString, this.STRINGSIZE, result[3]);
        // 길이
        yield self.pushBinary(result[2], changelen, this.STRINGLENSIZE, result[3] + this.STRINGSIZE);
        // 번지
        yield self.pushBinary(result[2], changelocation, this.LOCATIONSIZE, result[3] + this.STRINGSIZE + this.STRINGLENSIZE);
      }

      console.log("success");

      // 완료 표시 
      // var resultBuffer = yield readBlock(0, buffer);
      // resultBuffer[this.ISCOMPLETELOCATION] = 1;
      // yield writeBlock(0, resultBuffer);
      // yield self.deleteCopy(delString);      
    }
  },
  stringSearch: function* (delString) {
    var flag = true;
    var result = new Array(5);
    for (var i = 0; i < this.endpoint; i++) {
      console.log("delString " + delString);
      console.log("searchtable[i][0] " + this.searchtable[i][0]);

      if (this.searchtable[i][0] === delString) {
        result[0] = this.searchtable[i][1]; // 번지 수 
        result[1] = i;                      // 탐색 테이블 문자열 위치 
        result[2] = this.searchtable[i][2]; // 위치
        result[3] = this.searchtable[i][3]; // 주소
        result[4] = this.searchtable[i][4]; // 파일의 길이
        flag = false;
        break;
      }
    }
    if (flag) {
      result[0] = -1;
    }
    return result;
  },

  printAllBlock: function* (last) {
    var self = this;
    var resultBuffer = yield readBlock(last, buffer);
    var result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);    
    while (true) {

      // 0번지
      console.log((yield self.readStringToBinary(last, 0, this.STRINGSIZE, resultBuffer)) + " " + (yield self.readIntToBinary(last, 78, this.STRINGLENSIZE, resultBuffer)) + " " + (yield self.readIntToBinary(last, 80, this.LOCATIONSIZE, resultBuffer)));
      console.log((yield self.readStringToBinary(last, 84, this.STRINGSIZE, resultBuffer)) + " " + (yield self.readIntToBinary(last, 162, this.STRINGLENSIZE, resultBuffer)) + " " + (yield self.readIntToBinary(last, 164, this.LOCATIONSIZE, resultBuffer)));
      // console.log( self.readStringToBinary(last,168,this.STRINGSIZE) + " " + readIntToBinary(last,246,this.STRINGLENSIZE) + " " + readIntToBinary(last,248,this.LOCATIONSIZE));
      // console.log( self.readStringToBinary(last,252,this.STRINGSIZE) + " " + readIntToBinary(last,330,this.STRINGLENSIZE) + " " + readIntToBinary(last,332,this.LOCATIONSIZE));
      // console.log( self.readStringToBinary(last,336,this.STRINGSIZE) + " " + readIntToBinary(last,414,this.STRINGLENSIZE) + " " + readIntToBinary(last,416,this.LOCATIONSIZE));
      // console.log( self.readStringToBinary(last,420,this.STRINGSIZE) + " " + readIntToBinary(last,498,this.STRINGLENSIZE) + " " + readIntToBinary(last,500,this.LOCATIONSIZE));
      console.log((yield self.readIntToBinary(last, this.SPACELOCATION, this.SPACESIZE, resultBuffer)) + "");
      console.log((yield self.readIntToBinary(last, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer)) + "");

      if (result === 0) {
        break;
      }

      last = result;
      resultBuffer = yield readBlock(last, buffer);
      result = yield self.readIntToBinary(last, this.NEXTLOCATION, this.LOCATIONSIZE, resultBuffer);
    }
  }
};