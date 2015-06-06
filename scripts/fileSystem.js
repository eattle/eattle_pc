function fileSystem() {};
var buffer = new Buffer(512);

var thunkify = require('thunkify');
var readBlock = thunkify(device.readBlock);
var writeBlock = thunkify(device.writeBlock);

fileSystem.prototype = {

    CLUSTERSPACESIZE : 512, //클러스터 전체 사이즈 
    CLUSTERCNT : 30000, //클러스터 갯수 
    
    SPACELOCATION : 504, //다음공간 위치 
    NEXTLOCATION : 506, //다음주소 위치     
    //final int ISEMPTYLOCATION = 511; // 빈공간인지 확인해주는 위치 
    ISCOMPLETELOCATION : 510,  // 백업 완료했는지 확인해주는것의 위치 
    
    STRINGSIZE : 77, //문자 블럭 크기 
    STRINGLENSIZE : 3, //문자길이 블럭 크기 
    SPACESIZE : 2, //공간위치 블럭 크기 
    LOCATIONSIZE : 4, //주소 블럭 크기 
    
    content : ["C","D","3S","X","E","ASA","SD"],
    size : [100,70000,2302,4034,80000,3033,22],

    //BLOCK : new Uint8Array(new Uint8Array(30000), new Uint8Array(512)),
    //BLOCK : Array.apply(null, new Array(30000)).map(Number.prototype.valueOf,0),

    //탐색 테이블
    searchtable : Array.apply(null, new Array(100)).map(Number.prototype.valueOf,0),
    //searchtable : Array.apply(null, new Array(100)).map(Number.prototype.valueOf,0),

    endpoint : 0,

    currentDataLength : 0,

    fileCount : function(){
        console.log(this.endpoint);
        return this.endpoint;
    },
    fileNameReturn : function(number){
        console.log(number);
        return this.searchtable[number][0];
    },

    passwardInput : function* (passward){
        passward = 1234;
        yield this.pushBinary(2,passward,4,0);
    },

    passwardOutput : function* (){
        var dummybuffer = new Buffer(512);
        var resultBuffer = yield readBlock(2, dummybuffer);
        var passward = yield this.readIntToBinary(2,0,4,resultBuffer);
        return passward;
    }, 

    fileSystemInit : function* (){
        for(var i=0;i<100;i++){
            console.log('init');
            this.searchtable[i] = Array.apply(null, new Array(5)).map(Number.prototype.valueOf,0);
        }
        //파일 테이블 
        yield this.incaseSearchTable();

        //USB에서 DB꺼내오기
        yield this.fileout("CaPicDB",".");
        
    },

    fileInputInit : function* (file,binaryString){
        
        

        yield this.addElementPush(file.name,binaryString);
        yield this.addElementPushCopy();

        //self.fileInit(btoa(binaryString)); //초기화 
        //self.incaseSearchTable();//탐색테이블 만듬 초기화 
        yield this.printAllBlock(1);
    },

    emptySpaceSearch : function* (){

        var dummybuffer = new Buffer(512);

        var num=0;
        var i;

        var resultBuffer = yield readBlock(3, dummybuffer);
        for(i=0;i<512;i++){
            if( (resultBuffer[i] & 0x80) === 0 ){ num = 0; break; }
            if( (resultBuffer[i] & 0x40) === 0 ){ num = 1; break; }
            if( (resultBuffer[i] & 0x20) === 0 ){ num = 2; break; }
            if( (resultBuffer[i] & 0x10) === 0 ){ num = 3; break; }
            if( (resultBuffer[i] & 0x08) === 0 ){ num = 4; break; }
            if( (resultBuffer[i] & 0x04) === 0 ){ num = 5; break; }
            if( (resultBuffer[i] & 0x02) === 0 ){ num = 6; break; }
            if( (resultBuffer[i] & 0x01) === 0 ){ num = 7; break; }
        }

        var resultBuffer = yield readBlock((i * 8) + num + 4, dummybuffer);
        // (i * 8) + num ->몇번째 인지 
        var addressnum = (i * 8) + num;

        for(i=0;i<512;i++){
            if( (resultBuffer[i] & 0x80) === 0 ){ return (4096 * (addressnum +1)) + (i * 8) + 0 + 4; }
            if( (resultBuffer[i] & 0x40) === 0 ){ return (4096 * (addressnum +1)) + (i * 8) + 1 + 4; }
            if( (resultBuffer[i] & 0x20) === 0 ){ return (4096 * (addressnum +1)) + (i * 8) + 2 + 4; }
            if( (resultBuffer[i] & 0x10) === 0 ){ return (4096 * (addressnum +1)) + (i * 8) + 3 + 4; }
            if( (resultBuffer[i] & 0x08) === 0 ){ return (4096 * (addressnum +1)) + (i * 8) + 4 + 4; }
            if( (resultBuffer[i] & 0x04) === 0 ){ return (4096 * (addressnum +1)) + (i * 8) + 5 + 4; }
            if( (resultBuffer[i] & 0x02) === 0 ){ return (4096 * (addressnum +1)) + (i * 8) + 6 + 4; }
            if( (resultBuffer[i] & 0x01) === 0 ){ return (4096 * (addressnum +1)) + (i * 8) + 7 + 4; }
        }

        return -1;

        
    },

    fileout : function* (selectfilename,outpath){
        
        var dummyFristbuffer = new Buffer(512);
        var self = this;
        //var resultbyte = new Array(10066);
        
        var result = yield self.stringSearch(selectfilename);
        var resultbyte= new Buffer(result[4]);

        console.log(result[0]);
        console.log(result[4]);
        //result[0] = 4096;
        if(result[0] === -1)
            alert("값이 잘못들어왔습니다");
        else{
            //int resultstringaddress = 6085;
            var resultstringaddress = result[0];
            //int resultaddress = readIntToBinary(result[0],result[1]+80,LOCATIONSIZE);         
            var limit =0;
            var bytecnt =0;

            var resultfirstBuffer = yield readBlock(resultstringaddress, dummyFristbuffer);
            
            while(resultstringaddress != 0){

                var originalbyteAddress =   yield self.readIntToBinary(resultstringaddress,limit,self.LOCATIONSIZE,resultfirstBuffer)                
                var resultBuffer = yield readBlock(originalbyteAddress, buffer);

                for(var i=0; i<self.CLUSTERSPACESIZE; i++){
                    if(bytecnt < result[4]){
                        //resultbyte[bytecnt++] = self.BLOCK[originalbyteAddress][i];
                        
                        resultbyte[bytecnt++] = resultBuffer[i];

                            
                    }
                    else
                        break;
                }
                if(bytecnt >= result[4])
                    break;

                limit += self.LOCATIONSIZE;

                if(limit >= self.SPACELOCATION){
                    console.log("11");
                    console.log(resultstringaddress);
                    resultstringaddress =  yield self.readIntToBinary(resultstringaddress,self.NEXTLOCATION,self.LOCATIONSIZE,resultfirstBuffer);
                    resultfirstBuffer = yield readBlock(resultstringaddress, dummyFristbuffer);
                    limit =0;
                }

            }
        }
        var fs = require("fs");



        if(outpath == false)
            var writeStream = fs.createWriteStream('../' + selectfilename);
        else{
            var writeStream = fs.createWriteStream(outpath + '/' + selectfilename);
        }
            
        writeStream.write(resultbyte);
        console.log(selectfilename);

        console.log("success");
    },

    imagefileprint : function* (selectfilename){
        //D  S   X               
        //1220879 1870864 2133464
        
        var dummyFristbuffer = new Buffer(512);
        var self = this;
        //var resultbyte = new Array(10066);
        
        
        var result = yield self.stringSearch(selectfilename);
        var resultbyte= new Buffer(result[4]);

        console.log(result[0]);
        console.log(result[4]);
        //result[0] = 4096;
        if(result[0] === -1)
            alert("값이 잘못들어왔습니다");
        else{
            //int resultstringaddress = 6085;
            var resultstringaddress = result[0];
            //int resultaddress = readIntToBinary(result[0],result[1]+80,LOCATIONSIZE);         
            var limit =0;
            var bytecnt =0;

            var resultfirstBuffer = yield readBlock(resultstringaddress, dummyFristbuffer);
            
            while(resultstringaddress != 0){

                var originalbyteAddress =   yield self.readIntToBinary(resultstringaddress,limit,self.LOCATIONSIZE,resultfirstBuffer)                
                var resultBuffer = yield readBlock(originalbyteAddress, buffer);

                for(var i=0; i<self.CLUSTERSPACESIZE; i++){
                    if(bytecnt < result[4]){
                        //resultbyte[bytecnt++] = self.BLOCK[originalbyteAddress][i];
                        
                        resultbyte[bytecnt++] = resultBuffer[i];

                            
                    }
                    else
                        break;
                }
                if(bytecnt >= result[4])
                    break;

                limit += self.LOCATIONSIZE;

                if(limit >= self.SPACELOCATION){
                    console.log("11");
                    console.log(resultstringaddress);
                    resultstringaddress =  yield self.readIntToBinary(resultstringaddress,self.NEXTLOCATION,self.LOCATIONSIZE,resultfirstBuffer);
                    resultfirstBuffer = yield readBlock(resultstringaddress, dummyFristbuffer);
                    limit =0;
                }


            }

            var mCanvas = document.getElementById('tshirtCanvas');
            var mContext = mCanvas.getContext('2d');
            var img = new Image();
            img.onload = function(){
                mCanvas.width = 300;
                mCanvas.height = 300;
                mContext.drawImage(img, 10, 10, 280, 250);
                //img.width = 200;
                //img.height= 200;
            }

            console.log("x1x1x1xx1xxx11x1xx1xxxxxxxx " + resultbyte.length);

            var base64Image = resultbyte.toString('base64');
            img.src = "data:image/gif;base64," + base64Image;



            console.log("xxxxxxxxxxxx " + base64Image);
            console.log("xxxxxxxxxxxxxxxxxxx " + base64Image.length);
                        
        }
    },

    incaseSearchTable : function* (){
        this.endpoint = 0;
        var self = this;
        //var location = 1;
        var location = 0;
        var startaddress = 0;
        var tablesize = this.STRINGSIZE+this.STRINGLENSIZE+this.LOCATIONSIZE;
        var stringaddresslocation = this.STRINGSIZE+this.STRINGLENSIZE;
        
        
        var resultBuffer = yield readBlock(location, buffer);

        while(true){ //0번지 파일테이블 끝날때까지 
            
            console.log(" location " + location + "  startaddress " + startaddress);


            var dummystring = yield self.readStringToBinary(location,startaddress,this.STRINGSIZE,resultBuffer); //문자 
           // if(dummystring === 0){
            //    break;
           // }

            var dummyfilelen = yield self.readIntToBinary(location,startaddress+this.STRINGSIZE,this.STRINGLENSIZE,resultBuffer); //파일의 길이 
            var dummystringaddress = yield self.readIntToBinary(location,stringaddresslocation+startaddress,this.LOCATIONSIZE,resultBuffer); //번지 
            
            console.log(" dummystring " + dummystring + "  dummystringaddress " + dummystringaddress);
            
            
            //탐색테이블 생성
            this.searchtable[this.endpoint][0] = dummystring; //문자 
            this.searchtable[this.endpoint][1] = dummystringaddress;//번지 
            this.searchtable[this.endpoint][2] = location;//문자의 위치  
            this.searchtable[this.endpoint][3] = startaddress;//문자의 주소 
            this.searchtable[this.endpoint][4] = dummyfilelen; //파일의 길이 
            
            this.endpoint ++;

            
            startaddress = startaddress+tablesize;
            
            if(startaddress >= (yield self.readIntToBinary(location,this.SPACELOCATION,this.SPACESIZE,resultBuffer))){
                location = yield self.readIntToBinary(location,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);
                if(location ==0)
                    break;
                resultBuffer = yield readBlock(location, buffer);
                startaddress = 0;
            }
        }
        
        for(var i=0;i<this.endpoint;i++){
            console.log( " 0] " + this.searchtable[i][0] + "  1] " + this.searchtable[i][1] + " 2] " + this.searchtable[i][2] + " 3] " + this.searchtable[i][3] + " 4] " + this.searchtable[i][4]);
            
        }
    },
    dropfiletable : function* (last){
        var dummybuffer = new Buffer(512);
        var self = this;
        while(true){
            var resultBuffer = yield readBlock(last, dummybuffer);
            var result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);
            
            
            for(var j=self.SPACELOCATION;j<self.CLUSTERSPACESIZE;j++)
                resultBuffer[j] = 0; //비어있는공간 찾고 표시 
            yield writeBlock(last, resultBuffer);
             if (result == 0)
                break;
            last = result;    
        }
    },
    
    clusterWriteCheck : function* (location){

        var dummybuffer = new Buffer(512);

        location=location-4;
        var flag = true;
        var resultBuffer = yield readBlock((location >> 12) -1 + 4, dummybuffer);

        if(((location & 0x0FFF) & 0x07)  === 0){ resultBuffer[(location & 0x0FFF) >> 3] |= 0x80; }
        if(((location & 0x0FFF) & 0x07)  === 1){ resultBuffer[(location & 0x0FFF) >> 3] |= 0x40; }
        if(((location & 0x0FFF) & 0x07)  === 2){ resultBuffer[(location & 0x0FFF) >> 3] |= 0x20; }
        if(((location & 0x0FFF) & 0x07)  === 3){ resultBuffer[(location & 0x0FFF) >> 3] |= 0x10; }
        if(((location & 0x0FFF) & 0x07)  === 4){ resultBuffer[(location & 0x0FFF) >> 3] |= 0x08; }
        if(((location & 0x0FFF) & 0x07)  === 5){ resultBuffer[(location & 0x0FFF) >> 3] |= 0x04; }
        if(((location & 0x0FFF) & 0x07)  === 6){ resultBuffer[(location & 0x0FFF) >> 3] |= 0x02; }
        if(((location & 0x0FFF) & 0x07)  === 7){ resultBuffer[(location & 0x0FFF) >> 3] |= 0x01; }
        
        for(var i=0; i<this.CLUSTERSPACESIZE;i++){
            if(resultBuffer[i] != -1) {
                flag = false;
                break;
            }
        }
        yield writeBlock((location >> 12) -1 + 4, resultBuffer);

        var resultBuffer = yield readBlock(3, dummybuffer);
        if(flag){
            if((((location >> 12) -1) & 0x07)  === 0){ resultBuffer[2][((location >> 12) -1) >> 3] |= 0x80; }
            if((((location >> 12) -1) & 0x07)  === 1){ resultBuffer[2][((location >> 12) -1) >> 3] |= 0x40; }
            if((((location >> 12) -1) & 0x07)  === 2){ resultBuffer[2][((location >> 12) -1) >> 3] |= 0x20; }
            if((((location >> 12) -1) & 0x07)  === 3){ resultBuffer[2][((location >> 12) -1) >> 3] |= 0x10; }
            if((((location >> 12) -1) & 0x07)  === 4){ resultBuffer[2][((location >> 12) -1) >> 3] |= 0x08; }
            if((((location >> 12) -1) & 0x07)  === 5){ resultBuffer[2][((location >> 12) -1) >> 3] |= 0x04; }
            if((((location >> 12) -1) & 0x07)  === 6){ resultBuffer[2][((location >> 12) -1) >> 3] |= 0x02; }
            if((((location >> 12) -1) & 0x07)  === 7){ resultBuffer[2][((location >> 12) -1) >> 3] |= 0x01; }
        }
        yield writeBlock(3, resultBuffer);
    },
    clusterWriteUnCheck : function* (location){

        var dummybuffer = new Buffer(512);

        location=location-4;
        var resultBuffer = yield readBlock((location >> 12) -1 + 4, dummybuffer);

        if(((location & 0x0FFF) & 0x07)  === 0){ resultBuffer[(location & 0x0FFF) >> 3] &= ~0x80; }
        if(((location & 0x0FFF) & 0x07)  === 1){ resultBuffer[(location & 0x0FFF) >> 3] &= ~0x40; }
        if(((location & 0x0FFF) & 0x07)  === 2){ resultBuffer[(location & 0x0FFF) >> 3] &= ~0x20; }
        if(((location & 0x0FFF) & 0x07)  === 3){ resultBuffer[(location & 0x0FFF) >> 3] &= ~0x10; }
        if(((location & 0x0FFF) & 0x07)  === 4){ resultBuffer[(location & 0x0FFF) >> 3] &= ~0x08; }
        if(((location & 0x0FFF) & 0x07)  === 5){ resultBuffer[(location & 0x0FFF) >> 3] &= ~0x04; }
        if(((location & 0x0FFF) & 0x07)  === 6){ resultBuffer[(location & 0x0FFF) >> 3] &= ~0x02; }
        if(((location & 0x0FFF) & 0x07)  === 7){ resultBuffer[(location & 0x0FFF) >> 3] &= ~0x01; }

        yield writeBlock((location >> 12) -1 + 4, resultBuffer);
    },


    filetablecopy : function* (){
        var dummyFirstbuffer = new Buffer(512);
        var dummylittlebuffer = new Buffer(512);

        var self = this;
        var givetablelocation = 1;
        var taketablelocation = 0;
        
        //0번째 0으로 다 만들어준다. 
        yield self.dropfiletable(taketablelocation);
        //서치테이블보고 주소들 0만들어준다.  
        for(var i=0;i<this.endpoint;i++)
            yield self.dropfiletable(this.searchtable[i][1]);
        
        
        var blocksize = this.STRINGSIZE+this.STRINGLENSIZE+this.LOCATIONSIZE;
        var addresslocation;
        var last = givetablelocation;

        var resultFirstBuffer = yield readBlock(last, dummyFirstbuffer);
        var result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultFirstBuffer);
        
        //실제 백업
        while(true){
            var flag = true;
            //해당되는 주소들집합 
            for(var i=0;i<self.CLUSTERSPACESIZE;i+=blocksize){
                var location = yield self.readIntToBinary(last,i+self.STRINGSIZE+self.STRINGLENSIZE,self.LOCATIONSIZE,resultFirstBuffer); 
                if(location === 0)
                    break;
                
                //0번지 
                var dummystring = yield self.readStringToBinary(last,i,self.STRINGSIZE,resultFirstBuffer); //문자 
                var dummyfilelen = yield self.readIntToBinary(last,i+self.STRINGSIZE,self.STRINGLENSIZE,resultFirstBuffer); //바이너리 길이 
                addresslocation = yield self.emptySpaceSearch();
                
                ////////////여기 dummystring////////////////
                yield self.pushAddress(0,self.STRINGSIZE,taketablelocation,dummystring); //문자
                yield self.pushAddress(dummyfilelen,self.STRINGLENSIZE,taketablelocation,"0"); //길이 
                var limit = yield self.pushAddress(addresslocation,self.LOCATIONSIZE,taketablelocation,"0"); //번지 
                
                if(limit >= self.SPACELOCATION){
                    var dummySpace = yield self.emptySpaceSearch();
                    yield self.pushBinary(taketablelocation,dummySpace,self.LOCATIONSIZE,self.NEXTLOCATION); //마지막 위치 넣어주기 
                    taketablelocation = dummySpace;
                    
                    
                    yield self.clusterWriteCheck(taketablelocation); //비어있는공간 찾고 표시 
                }
                

                //주소번지 
                var littlelast = location; 
                console.log(littlelast);
                var resultlittleBuffer = yield readBlock(littlelast, dummylittlebuffer);
                var littleresult = yield self.readIntToBinary(littlelast,self.NEXTLOCATION,self.LOCATIONSIZE,resultlittleBuffer);
                while(true){
                    var resultBuffer = yield readBlock(littlelast, buffer);
                    yield writeBlock(addresslocation, resultBuffer);

                    yield self.clusterWriteCheck(addresslocation); //비어있는공간 찾고 표시 
                    
                    littlelast= littleresult;
                    if(littleresult === 0)
                        break;
                    resultlittleBuffer = yield readBlock(littlelast, dummylittlebuffer);
                    littleresult = yield self.readIntToBinary(littlelast,self.NEXTLOCATION,self.LOCATIONSIZE,resultlittleBuffer);
                    

                    addresslocation = yield self.emptySpaceSearch();
                    
                }
                flag = false;
                
            }
            if(flag)
                break;

            last = result;
            if(result === 0)
                break;
            resultFirstBuffer = yield readBlock(result, dummyFirstbuffer);
            result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultFirstBuffer);
            
        }
        
        
        //바뀐 0번지로 서치테이블 완성 
        yield self.incaseSearchTable();


        
            
    },

    copytableinit : function* (){
        var self = this;
        var tablelocation = 1;
        var addresslocation;
        
         //0으로 만들기 
        var blocksize = this.STRINGSIZE+this.STRINGLENSIZE+this.LOCATIONSIZE;
        var last = tablelocation;
        var result = tablelocation;
        
        while(true){
            var resultBuffer = yield readBlock(last, buffer);

            var flag = true;
            //해당되는 주소들집합 
            for(var i=0;i<self.CLUSTERSPACESIZE;i+=blocksize){
                var location = yield self.readIntToBinary(last,i+self.STRINGSIZE+self.STRINGLENSIZE,self.LOCATIONSIZE,resultBuffer); //번지 
                if(location === 0)
                    break;
                
                //주소번지 
                self.dropfiletable(location);
                
                flag = false;
                
            }
            if(flag)
                break;
            
            result = yield self.readIntToBinary(last,self.NEXTLOCATION,self.LOCATIONSIZE,resultBuffer);
            

            for(var j=self.SPACELOCATION;j<self.CLUSTERSPACESIZE;j++)
                resultBuffer[j] = 0; //비어있는공간 찾고 표시 

            yield writeBlock(last, resultBuffer);

            if(result === 0)
                break;
            last = result;
        }

        
        for(var i=0;i<this.endpoint;i++){
            addresslocation = yield self.emptySpaceSearch();
            
            var beforeaddresslocation = addresslocation;
            console.log(beforeaddresslocation);
            //주소
            result = self.searchtable[i][1]; 
            while(true){
                var resultBuffer = yield readBlock(result, buffer);
                yield writeBlock(addresslocation, resultBuffer);
                yield self.clusterWriteCheck(addresslocation); //비어있는공간 찾고 표시 
                
                result = yield this.readIntToBinary(result,self.NEXTLOCATION,self.LOCATIONSIZE,resultBuffer);
                
                if(result === 0)
                    break;
                
                var dummySpace = yield self.emptySpaceSearch();
                yield self.pushBinary(addresslocation,dummySpace,self.LOCATIONSIZE,self.NEXTLOCATION); //마지막 위치 넣어주기
                addresslocation = dummySpace;
                yield self.clusterWriteCheck(addresslocation); //비어있는공간 찾고 표시 
               
            }
            
            //1번째 
            ////////////여기 searchtable[i][0]////////////////
            yield self.pushAddress(0,self.STRINGSIZE,tablelocation,self.searchtable[i][0]); //문자
            yield self.pushAddress(self.searchtable[i][4],self.STRINGLENSIZE,tablelocation,"0"); //길이 
            var limit = yield self.pushAddress(beforeaddresslocation,self.LOCATIONSIZE,tablelocation,"0"); //번지 
            if(limit >= self.SPACELOCATION){
                var dummySpace = yield self.emptySpaceSearch();
                yield self.pushBinary(tablelocation,dummySpace,self.LOCATIONSIZE,self.NEXTLOCATION); //마지막 위치 넣어주기 
                tablelocation = dummySpace;
                yield self.clusterWriteCheck(tablelocation); //비어있는공간 찾고 표시 
            }

        }
    },
    
    fileInit : function* (binaryString){
        var allAddressSpace =0;
        var self = this;
        
        for(var i=1;i<=1;i++){ //content.length
            var bytearray = new Buffer(binaryString, 'base64');
            //var file = "data:image/gif;base64,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";            
            //var file = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAA1CAYAAADh5qNwAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpCNDAyQzFCNzdBNjNFMjExOUZDQkRFNjAxRTQ0N0MyRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpFQTAzN0NEQ0VBOUIxMUUyQUQ4MUY0RUZFMkFFNkIxNiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpFQTAzN0NEQkVBOUIxMUUyQUQ4MUY0RUZFMkFFNkIxNiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgTWFjaW50b3NoIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDI4MDExNzQwNzIwNjgxMUJFRDRGRDE4QjgyQzEyQUQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QjQwMkMxQjc3QTYzRTIxMTlGQ0JERTYwMUU0NDdDMkUiLz4gPC9yZGY6RGVzY3Jp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";
            //bytearray = this.binaryDataImport(file);
            bytearray = binaryString;
            var emptyCoreAdressSpace = yield self.emptySpaceSearch();
            console.log(bytearray.length);
            //0번째 
            var stringContent = this.content[i];
            //if(this.content[i].length() > 78)
                //stringContent = this.content[i].substring(0,78);
             
            
            ////////////여기 stringContent////////////////
            yield self.pushAddress(0,this.STRINGSIZE,allAddressSpace,stringContent); //문자
            yield self.pushAddress(bytearray.length,this.STRINGLENSIZE,allAddressSpace,"0"); //길이 
            var limit = yield self.pushAddress(emptyCoreAdressSpace,this.LOCATIONSIZE,allAddressSpace,"0"); //번지 
            
            yield self.clusterWriteCheck(emptyCoreAdressSpace); //비어있는공간 찾고 표시 
            if(limit >= this.SPACELOCATION){
                var dummySpace = yield self.emptySpaceSearch();
                yield self.pushBinary(allAddressSpace,dummySpace,LOCATIONSIZE,NEXTLOCATION); //마지막 위치 넣어주기 
                allAddressSpace = dummySpace;
                yield self.clusterWriteCheck(allAddressSpace); //비어있는공간 찾고 표시 
            }
            
            
            var cnt = 0; 
            
            for(var j=0;j<=bytearray.length/(this.CLUSTERSPACESIZE-1);j++){ // size[i] -> bytearray.length
                var emptyCoreSpace = yield self.emptySpaceSearch();
                for(var k=0;k<this.CLUSTERSPACESIZE;k++){
                    if(cnt < bytearray.length){
                        buffer[k] = bytearray[cnt++];
                    }
                }
                yield writeBlock(emptyCoreSpace, buffer);

                yield self.clusterWriteCheck(emptyCoreSpace); //비어있는공간 찾고 표시
                //주소들 값 넣기 
                limit = yield self.pushAddress(emptyCoreSpace,this.LOCATIONSIZE,emptyCoreAdressSpace,"0");
                
                
                if(limit >= this.SPACELOCATION){
                    var dummySpace = yield self.emptySpaceSearch();
                    yield self.pushBinary(emptyCoreAdressSpace,dummySpace,this.LOCATIONSIZE,this.NEXTLOCATION);
                    emptyCoreAdressSpace = dummySpace;
                    yield self.clusterWriteCheck(emptyCoreAdressSpace); //비어있는공간 찾고 표시 
                }
                
            }
        }
    },

    readStringToBinary : function* (location,address,currentlocationsize,resultBuffer){
        //byte -> string
        
        var cnt = 0;
        //var resultBuffer = yield readBlock(location, buffer);

        for(var i=address;i<address+currentlocationsize;i++){
            if(resultBuffer[i] === 0)
                break;
            cnt ++;
        }
        if(cnt === 0)
            return 0;
        
        var binaryByte = new Array(cnt);
        var count = 0;
        for(var i=address;i<address+cnt;i++){     
            binaryByte[count++] = resultBuffer[i];
            //yield writeBlock(location, resultBuffer);
        }

        
        return String.fromCharCode.apply(String, binaryByte);

    },
    readIntToBinary : function* (location,address,currentlocationsize,resultBuffer){
         //byte -> int
        var result = 0;
        //var resultBuffer = yield readBlock(location, buffer);
        //console.log("readBlock " + location);

        for (var i=0; i<currentlocationsize; i++)
        {
            result += ((resultBuffer[address + currentlocationsize-i-1] & 0xFF) << (i*8));
        }

        return result;
    },
    pushStringBinary : function* (location,conversion,currentlocationsize,address){
        //string -> byte
        var self = this;
        var dummybuffer = new Buffer(512);

        var resultBuffer = yield readBlock(location, dummybuffer);

        if(conversion === "0"){
            for(var i=0;i<currentlocationsize;i++)
                resultBuffer[address+i] = 0;
        }
        else{
            var binaryByte = new Array();
            for (var i = 0; i < conversion.length; ++i)
            {
                binaryByte.push(conversion.charCodeAt(i));
            }

            for(var i=0; i<currentlocationsize;i++){
                if(i < binaryByte.length)
                    resultBuffer[address + i] = binaryByte[i];
                else
                    resultBuffer[address + i] = 0x00;
            }
        }

        yield writeBlock(location, resultBuffer);
    },
    pushBinary : function* (location,conversion,currentlocationsize,address){
        //int -> byte
        var dummybuffer = new Buffer(512);
        var resultBuffer = yield readBlock(location, dummybuffer);

        if(conversion === 0){
            for(var i=0;i<currentlocationsize;i++)
                resultBuffer[address+i] = 0;
            
        }
        else{
            for(var i=0;i<currentlocationsize;i++){
                resultBuffer[address + currentlocationsize-i-1] = (conversion >> 8*i);
            }
        }


        yield writeBlock(location, resultBuffer);


    },
    pushAddress : function* (conversion,currentlocationsize,location,stringconversion){
        var self = this;

        var dummybuffer = new Buffer(512);

        var resultBuffer = yield readBlock(location, dummybuffer);
        var address = yield self.readIntToBinary(location,this.SPACELOCATION,this.SPACESIZE,resultBuffer);

        if(stringconversion === "0")
            yield self.pushBinary(location, conversion,currentlocationsize,address);
        else
            yield self.pushStringBinary(location,stringconversion,currentlocationsize,address);
        
        yield self.pushBinary(location, address+currentlocationsize, this.SPACESIZE,this.SPACELOCATION);
        
        return address+currentlocationsize;
    },


    lastReturn : function* (last){
        var self = this;
        var dummybuffer = new Buffer(512);
        var resultBuffer = yield readBlock(last, dummybuffer);
        var result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);
        
        while(result != 0){
            last= result;
            resultBuffer = yield readBlock(last, dummybuffer);
            result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);
        }
        return last;
    },
    addElementPushCopy : function* (){
        //0번지 백업 
        var self = this;
        var last =  yield self.lastHaveSpaceReturn(1);
        var dummystring = this.searchtable[this.endpoint-1][0];
        var dummyfilelen = this.searchtable[this.endpoint-1][4]; //파일의 길이 
        var dummystringaddress = this.searchtable[this.endpoint-1][1]; //마지막 번째 번지 
        
        var addresslocation = yield self.emptySpaceSearch();
        ////////////여기 dummystring////////////////
        yield self.pushAddress(0,this.STRINGSIZE,last[0],dummystring); //문자
        yield self.pushAddress(dummyfilelen,this.STRINGLENSIZE,last[0],"0"); //길이 
        var limit = yield self.pushAddress(addresslocation,this.LOCATIONSIZE,last[0],"0"); //번지 
        
        if(limit >= this.SPACELOCATION){
            var dummySpace = yield self.emptySpaceSearch();
            self.pushBinary(last[0],dummySpace,this.LOCATIONSIZE,this.NEXTLOCATION); //마지막 위치 넣어주기 
            last[0] = dummySpace;
            yield self.clusterWriteCheck(last[0]); //비어있는공간 찾고 표시 
        }
        
        
        //주소들 백업 
        var result = dummystringaddress;
        while(true){
            var resultBuffer = yield readBlock(result, buffer);
            yield writeBlock(addresslocation, resultBuffer);

                
            yield self.clusterWriteCheck(addresslocation); //비어있는공간 찾고 표시 
            

            result = yield self.readIntToBinary(result,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);
            if(result === 0)
                break;
            
            var dummySpace = yield self.emptySpaceSearch();
            yield self.pushBinary(addresslocation,dummySpace,this.LOCATIONSIZE,this.NEXTLOCATION); //마지막 위치 넣어주기
            addresslocation = dummySpace;
            yield self.clusterWriteCheck(addresslocation); //비어있는공간 찾고 표시
        }
        
        /*
        //완료 표시 
        var resultBuffer = yield readBlock(1, buffer);
        resultBuffer[this.ISCOMPLETELOCATION] = 1;
        yield writeBlock(1, resultBuffer);
*/
        console.log("addElementPushcopy success");

    },
    addElementPush : function* (content,binaryString){
        
        var self = this;
        //넣기전에 표시 
        /*
        var resultBuffer = yield readBlock(0, buffer);
        resultBuffer[this.ISCOMPLETELOCATION] = 0;
        yield writeBlock(0, resultBuffer);

        

        var resultBuffer = yield readBlock(1, buffer);
        resultBuffer[this.ISCOMPLETELOCATION] = 0;
        yield writeBlock(1, resultBuffer);

   */
        //var file = "/storage/emulated/0/DCIM/Camera/1.jpg";
        //bytearray = self.binaryDataImport(file);
        var bytearray = new Buffer(binaryString, 'base64');
        
        
        var emptyCoreAdressSpace = yield self.emptySpaceSearch();


        
        // '0'번지 정렬 새롭게 빌드
        var last =  yield self.lastReturn(0);
        
        var stringContent = content;
        //console.log(bytearray)
        //console.log(bytearray.length);
        //if(content.length() > 78)
            //stringContent = content.substring(0,78);
        
        ////////////여기 stringContent////////////////
        yield self.pushAddress(0,this.STRINGSIZE,last,stringContent); //문자
        yield self.pushAddress(bytearray.length,this.STRINGLENSIZE,last,"0"); //길이
        var limit = yield self.pushAddress(emptyCoreAdressSpace,this.LOCATIONSIZE,last,"0");//번지 
        
        yield self.clusterWriteCheck(emptyCoreAdressSpace); //비어있는공간 찾고 표시    
        

        var fristemptyCoreAdressSpace = emptyCoreAdressSpace;
        
        if(limit >= this.SPACELOCATION){
            var dummySpace = yield self.emptySpaceSearch();
            yield self.pushBinary(last,dummySpace,this.LOCATIONSIZE,this.NEXTLOCATION); //마지막 위치 넣어주기 
            yield self.clusterWriteCheck(dummySpace); //비어있는공간 찾고 표시
        }

        
        var cnt=0;
        for(var i=0;i<=bytearray.length/this.CLUSTERSPACESIZE;i++){
            var emptyCoreSpace = yield self.emptySpaceSearch();
            
            for(var j=0;j<this.CLUSTERSPACESIZE;j++){
                if(cnt < bytearray.length){
                    buffer[j] = bytearray[cnt++];   //실제 내용 넣기 
                }
            }
            yield writeBlock(emptyCoreSpace, buffer);

            yield self.clusterWriteCheck(emptyCoreSpace); //비어있는공간 찾고 표시
            

            
            //주소들 값 넣기 (원본) 
            limit = yield self.pushAddress(emptyCoreSpace,this.LOCATIONSIZE,emptyCoreAdressSpace,"0");
            if(limit >= this.SPACELOCATION){
                var dummySpace = yield self.emptySpaceSearch();
                yield self.pushBinary(emptyCoreAdressSpace,dummySpace,this.LOCATIONSIZE,this.NEXTLOCATION);
                emptyCoreAdressSpace = dummySpace;
                yield self.clusterWriteCheck(emptyCoreAdressSpace); //비어있는공간 찾고 표시
            }
            
            
        }   
        //탐색테이블 생성
        this.searchtable[this.endpoint][0] = stringContent; //문자
        this.searchtable[this.endpoint][1] = fristemptyCoreAdressSpace;//번지 
        this.searchtable[this.endpoint][2] = last;//문자의 위치  
        this.searchtable[this.endpoint][3] = limit-this.LOCATIONSIZE-this.STRINGLENSIZE-this.STRINGSIZE;//문자의 주소 
        this.searchtable[this.endpoint][4] = bytearray.length;
        this.endpoint ++;
        console.log(this.endpoint);

        /*
        //완료 표시 
        var resultBuffer = yield readBlock(0, buffer);
        resultBuffer[this.ISCOMPLETELOCATION] = 1;
        yield writeBlock(0, resultBuffer);
*/
        //yield this.addElementPushCopy();

        console.log("addElementPush success");
         //location.reload();

    },
    lastHaveSpaceReturn : function* (last){
        var self = this;
        var sublast = last;
        var dummybuffer = new Buffer(512);
        var resultreturn = new Array(2);

        var resultBuffer = yield readBlock(last, dummybuffer);
        var result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);
        while(result != 0){
            sublast = last;
            last= result;
            
            resultBuffer = yield readBlock(last, dummybuffer);
            result = yield self.readIntToBinary(last,self.NEXTLOCATION,self.LOCATIONSIZE,resultBuffer);               
        }

        
        resultBuffer = yield readBlock(last, dummybuffer);
        var lastResult = yield self.readIntToBinary(last,self.SPACELOCATION,self.SPACESIZE,resultBuffer);

        if( lastResult === 0 ){
            resultreturn[0] = sublast;
            resultreturn[1] = 1;
            return resultreturn;
        }

        resultreturn[0] = last;
        resultreturn[1] = 0;
        return resultreturn;
    },
    deleteCopy : function* (delString){
        console.log("deleteCopy")

        var self = this;
        var blocksize = this.LOCATIONSIZE+this.STRINGLENSIZE+this.STRINGSIZE;
        var last = 1;
        var result;
        
        var dummystringaddress =0;
        
        var location=0;
        var address=0;
        var resultBuffer = yield readBlock(last, buffer);

        var deleteBuffer = new Buffer(512);
        for(var i=0;i<512;i++)
            deleteBuffer[i] = 0;

        //검색 
        while(true){
            for(var i=0;i<self.CLUSTERSPACESIZE;i+=blocksize){
                var dummystring = yield self.readStringToBinary(last,i,self.STRINGSIZE,resultBuffer);
                if(dummystring === delString){
                    location = last;
                    address = i;
                    break;
                }
            }
            result = yield self.readIntToBinary(last,self.NEXTLOCATION,self.LOCATIONSIZE,resultBuffer);
            if(result === 0)
                break;
            last = result;
            resultBuffer = yield readBlock(last, buffer);
        }
        
        //주소값 삭제
        while(dummystringaddress != 0){
            
            var resultBuffer = yield readBlock(dummystringaddress, buffer);
            var dummy =  yield self.readIntToBinary(dummystringaddress,self.NEXTLOCATION,self.LOCATIONSIZE,resultBuffer);
            
            yield writeBlock(dummystringaddress, deleteBuffer);   
            yield self.clusterWriteUnCheck(dummystringaddress); //비어있는 체크된것 해제하기
            dummystringaddress = dummy;

           
        }

        
        
        //0번지 삭제 
        last =  yield self.lastHaveSpaceReturn(1);
        if(last[1] == 1)
            yield self.pushBinary(last[0],0,this.LOCATIONSIZE,this.NEXTLOCATION);
        resultBuffer = yield readBlock(last[0], buffer);
        var lastResult = yield self.readIntToBinary(last[0],this.SPACELOCATION,this.SPACESIZE,resultBuffer);
        
        //변경할값 변수에 넣어주기  
        var changeString = yield self.readStringToBinary(last[0],lastResult-(this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE),this.STRINGSIZE,resultBuffer);
        var changelen = yield self.readIntToBinary(last[0],lastResult-(this.LOCATIONSIZE+this.STRINGLENSIZE),this.STRINGLENSIZE,resultBuffer);
        var changelocation = yield self.readIntToBinary(last[0],lastResult-this.LOCATIONSIZE,this.LOCATIONSIZE,resultBuffer);
        
        for(var j=lastResult-(this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE);j<lastResult;j++)
            resultBuffer[j] = 0;
        yield writeBlock(last[0], resultBuffer);
        yield self.pushBinary(last[0],lastResult-(this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE),this.SPACESIZE,this.SPACELOCATION); //지우고 SPACELOCATION번쨰값 그전으로 변경 
        
        ////////////여기 changeString////////////////
        yield self.pushStringBinary(location,changeString,this.STRINGSIZE,address);//이름 
        yield self.pushBinary(location,changelen,this.STRINGLENSIZE,address+this.STRINGSIZE);//길이 
        yield self.pushBinary(location,changelocation,this.LOCATIONSIZE,address+this.STRINGSIZE+this.STRINGLENSIZE);//번지 
        
        /*
        //완료 표시 
        var resultBuffer = yield readBlock(1, buffer);
        resultBuffer[this.ISCOMPLETELOCATION] = 1;
        yield writeBlock(1, resultBuffer);
*/

        console.log("success1")

    },
    filedelete : function* (delString){

        var self = this;

/*
        //넣기전에 표시 
        var resultBuffer = yield readBlock(0, buffer);
        resultBuffer[this.ISCOMPLETELOCATION] = 0;
        yield writeBlock(0, resultBuffer);

        var resultBuffer = yield readBlock(1, buffer);
        resultBuffer[this.ISCOMPLETELOCATION] = 0;
        yield writeBlock(1, resultBuffer);

*/

        var deleteBuffer = new Buffer(512);
        for(var i=0;i<512;i++)
            deleteBuffer[i] = 0;

        var result = new Array();
        result = yield self.stringSearch(delString);

        //int[] result = stringSearch(delString);
        if(result[0] === -1)
            console.log("값이 잘못들어왔습니다");
        else{
            var resultstringaddress = result[0];
            //int result = readIntToBinary(resultAdress[0],resultAdress[1]+80,LOCATIONSIZE);
           
            var resultBuffer = yield readBlock(resultstringaddress, buffer);
            
            //실제파일과 주소값 삭제
            while(resultstringaddress != 0){
                var endlocation = yield self.readIntToBinary(resultstringaddress,this.SPACELOCATION,this.SPACESIZE,resultBuffer);
                console.log(endlocation);
                for(var i=0;i<endlocation;i+=this.LOCATIONSIZE){
                    var deleteSpace = yield self.readIntToBinary(resultstringaddress,i,this.LOCATIONSIZE,resultBuffer);
                    yield writeBlock(deleteSpace, deleteBuffer);
                    yield self.clusterWriteUnCheck(deleteSpace); //비어있는 체크된것 해제하기
                }
                var dummy =  yield self.readIntToBinary(resultstringaddress,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);
                yield writeBlock(resultstringaddress, deleteBuffer);
                yield self.clusterWriteUnCheck(resultstringaddress); //비어있는 체크된것 해제하기
                resultstringaddress = dummy;    
                resultBuffer = yield readBlock(resultstringaddress, buffer);
            }

            

            //0번째 값 
            var last =  yield self.lastHaveSpaceReturn(0);
            if(last[1] == 1){
                 yield self.pushBinary(last[0],0,this.LOCATIONSIZE,this.NEXTLOCATION);
                 console.log("NEXT")
             }

            console.log(last);
            resultBuffer = yield readBlock(last[0], buffer);
            var lastResult = yield self.readIntToBinary(last[0],this.SPACELOCATION,this.SPACESIZE,resultBuffer);
            
            console.log(last[0]);
            console.log(resultBuffer);
            console.log(lastResult);
            
            
            //변경할값 변수에 넣어주기  
            var changeString = yield self.readStringToBinary(last[0],lastResult-(this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE),this.STRINGSIZE,resultBuffer);
            var changelen = yield self.readIntToBinary(last[0],lastResult-(this.LOCATIONSIZE+this.STRINGLENSIZE),this.STRINGLENSIZE,resultBuffer);
            var changelocation = yield self.readIntToBinary(last[0],lastResult-this.LOCATIONSIZE,this.LOCATIONSIZE,resultBuffer);
            
            console.log("changeString " + changeString);
            
            //0번지의 마지막값 지우기
            for(var j=lastResult-(this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE);j<lastResult;j++)
                resultBuffer[j] = 0; //이름,길이,번지 지우기
            yield writeBlock(last[0], resultBuffer);

            console.log("2");
            
            //탐색테이블 삭제 
            this.searchtable[result[1]][0] = this.searchtable[this.endpoint-1][0]; // 마지막 문자열 
            this.searchtable[result[1]][1] = this.searchtable[this.endpoint-1][1]; // 마지막 번지 
            this.searchtable[result[1]][2] = this.searchtable[this.endpoint-1][2]; // 마지막 위치 
            this.searchtable[result[1]][3] = this.searchtable[this.endpoint-1][3]; // 마지막 주소  
            this.searchtable[result[1]][4] = this.searchtable[this.endpoint-1][4]; // 마지막 파일 길이  
            this.searchtable[this.endpoint-1][0] = "0";
            this.searchtable[this.endpoint-1][1] = "0";
            this.searchtable[this.endpoint-1][2] = "0";
            this.searchtable[this.endpoint-1][3] = "0";
            this.searchtable[this.endpoint-1][4] = "0";
            this.endpoint --;
            
            console.log("sssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss");
            console.log("k " + lastResult);


            yield self.pushBinary(last[0],lastResult-(this.STRINGSIZE + this.STRINGLENSIZE + this.LOCATIONSIZE),this.SPACESIZE,this.SPACELOCATION); //지우고 SPACELOCATION번쨰값 그전으로 변
            //console.log(yield self.readIntToBinary(last[0],this.SPACELOCATION,this.SPACESIZE));
            
            if(changeString != delString){ //마지막값과 찾는값과 같으면 끝낸다 (1개남은상태) 
                //변경할값 실제 넣어주기 
                ////////////여기 changeString////////////////
                yield self.pushStringBinary(result[2],changeString,this.STRINGSIZE,result[3]);//이름 
                yield self.pushBinary(result[2],changelen,this.STRINGLENSIZE,result[3]+this.STRINGSIZE);//길이 
                yield self.pushBinary(result[2],changelocation,this.LOCATIONSIZE,result[3]+this.STRINGSIZE+this.STRINGLENSIZE);//번지 
            }

            console.log("success");

            /*
            //완료 표시 
            var resultBuffer = yield readBlock(0, buffer);
            resultBuffer[this.ISCOMPLETELOCATION] = 1;
            yield writeBlock(0, resultBuffer);
*/
           // yield self.deleteCopy(delString);      
        }
        
        

    },
    stringSearch : function* (delString){
        var flag = true;
        var result = new Array(5);
        
        
        for(var i=0;i<this.endpoint;i++){
            console.log( "delString " + delString);
            console.log( "searchtable[i][0] " + this.searchtable[i][0]);
            if(this.searchtable[i][0] === delString){
                result[0] = this.searchtable[i][1]; //번지수 
                result[1] = i; //탐색테이블 문자열 위치 
                result[2] = this.searchtable[i][2]; //위치 
                result[3] = this.searchtable[i][3]; //주소 
                result[4] = this.searchtable[i][4]; //파일의 길이
                flag = false;
                break;
            }
        }
        if(flag)
            result[0] = -1;
        return result;
    },
    printAllBlock : function* (last){
        var self = this;
        var resultBuffer = yield readBlock(last, buffer);
        var result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);
        
        while(true){

            //0번지
            console.log( (yield self.readStringToBinary(last,0,this.STRINGSIZE,resultBuffer)) + " " + (yield self.readIntToBinary(last,78,this.STRINGLENSIZE,resultBuffer)) + " " + (yield self.readIntToBinary(last,80,this.LOCATIONSIZE,resultBuffer)));
            console.log( (yield self.readStringToBinary(last,84,this.STRINGSIZE,resultBuffer)) + " " + (yield self.readIntToBinary(last,162,this.STRINGLENSIZE,resultBuffer)) + " " + (yield self.readIntToBinary(last,164,this.LOCATIONSIZE,resultBuffer)));
            //console.log( self.readStringToBinary(last,168,this.STRINGSIZE) + " " + readIntToBinary(last,246,this.STRINGLENSIZE) + " " + readIntToBinary(last,248,this.LOCATIONSIZE));
            //console.log( self.readStringToBinary(last,252,this.STRINGSIZE) + " " + readIntToBinary(last,330,this.STRINGLENSIZE) + " " + readIntToBinary(last,332,this.LOCATIONSIZE));
            //console.log( self.readStringToBinary(last,336,this.STRINGSIZE) + " " + readIntToBinary(last,414,this.STRINGLENSIZE) + " " + readIntToBinary(last,416,this.LOCATIONSIZE));
            //console.log( self.readStringToBinary(last,420,this.STRINGSIZE) + " " + readIntToBinary(last,498,this.STRINGLENSIZE) + " " + readIntToBinary(last,500,this.LOCATIONSIZE));
            
            console.log( (yield self.readIntToBinary(last,this.SPACELOCATION,this.SPACESIZE,resultBuffer)) + "");
            console.log( (yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer)) + "");
            
             
            if(result === 0)
                break;
            
            last= result;
            resultBuffer = yield readBlock(last, buffer);
            result = yield self.readIntToBinary(last,this.NEXTLOCATION,this.LOCATIONSIZE,resultBuffer);

        }
    }
    
}


