const assert = require('assert');

describe('Eattle 파일 시스템', function () { 
  describe('단위 테스트', function () {
    const Layer = require('../app/scripts/fileSystemLayer'); // jshint ignore:line
    const layer = {};

    function checkIfFunctionExists(name) {
      assert.notStrictEqual(layer[name], null);
    }

    describe('filetablecopy', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('filetablecopy');
      });
      it('파일 테이블이 복사되어야 합니다.', function () {});
      it('파일 테이블에 유효하지 않으면 예외를 던져야 합니다.', function () {});
    });
    describe('addElementPush', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('addElementPush');
      });
      it('빈 파일명이 주어지면 예외를 던져야 합니다.', function () {});
      it('파일 테이블에 주어진 원소를 추가하여야 합니다.', function () {});
      it('동일한 파일명이 주어지면 파일에 새로운 고유 번호를 할당해야 합니다.', function () {});
    });
    describe('addElementPushCopy', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('addElementPushCopy');
      });
      it('파일 테이블을 성공적으로 동기화해야 합니다.', function () {});
    });
    describe('filedelete', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('filedelete');
      });
      it('파일을 삭제해야 합니다.', function () {});
      it('빈 파일명이 주어지면 예외를 던져야 합니다.', function () {});
      it('없는 파일명이 주어지면 예외를 던저야 합니다.', function () {});
    });
    describe('deleteCopy', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('deleteCopy');
      });
      it('파일 테이블을 성공적으로 동기화해야 합니다.', function () {});
    });
    describe('printAllBlock', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('printAllBlock');
      });
      describe('테스트 시나리오를 이용한 테스트', function () {
        it('기본 파일 시스템 구조를 형성합니다.',  function () {});
        it('형성한 구조를 정확히 출력해야 합니다.', function () {});
      });
    });
    describe('fileInit', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('fileInit');
      });
      it('비어 있는 파일 Object를 반환합니다.', function () {});
    });
    describe('incaseSearchTable', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('incaseSearchTable');
      });
      describe('참조 테이블에서 주어진 파일을 검색합니다.', function () {
        it('파일이 처음에 있는 경우', function () {});
        it('파일이 중간에 있는 경우', function () {});
        it('파일이 끝에 있는 경우', function () {});
        it('파일이 목록에 없는 경우', function () {});
      });
    });
    describe('copytableinit', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('copytableinit');
      });
      it('100개의 엔트리를 기록할 수 있는 512 바이트 테이블을 초기화합니다.', function () {});
    });
    describe('fileout', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('fileout');
      });
      describe('Mock fs 모듈 테스트', function () {
        it('로컬에서 USB 저장 장치로 내보내기 작업을 성공적으로 수행해야 합니다.', function () {});
        it('USB 저장 장치에서 로컬로 가져오기 작업을 성공적으로 수행해야 합니다.', function () {});
      });
    });
    describe('fileSystemInit', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('fileSystemInit');
      });
      it('올바르지 않은 설정값이 주어지면 예외를 던져야 합니다.', function () {});
      describe('Mock 로깅', function () {
        it('fileInit 함수를 6회 호출해야 합니다.', function () {});
        it('copytableinit 함수가 마지막에 호출되어야 합니다', function () {});
      });
    });
    describe('convertImage', function () {
      it('함수가 존재해야 합니다.', function () {
        checkIfFunctionExists('convertImage');
      });
      var sizeList = ['32KiB', '8MiB'];
      var bppList = ['16비트', '24비트', '32비트 알파'];
      var extList = ['JPEG', 'PNG'];

      describe('Fixture 이미지 변환 테스트', function () {
        function imageTest(i, j, k) {
          describe(bppList[j] + ' ' + sizeList[i] + ' ' + extList[k] + ' 이미지', function () {
            it('이미지를 성공적으로 로드하여야 합니다.', function () {});
            it('예상한 축소판 그림과 비슷한 이미지를 출력하여야 합니다.', function (done) {
              setTimeout(done, 150);
            });
          });
        }
        for (var i = 0; i < sizeList.length; i++) {
          for (var j = 0; j < bppList.length; j++) {
            for (var k = 0; k < extList.length; k++) {
              imageTest(i, j, k);
            }
          }
        }
      });
    });
  });
  describe('안정성 검증', function () {
    describe('큰 파일 읽고 쓰기', function () {
      var sizeList = ['32KiB', '64KiB', '256KiB',
      '1MiB', '4MiB', '32MiB', '256MiB'];
      sizeList.forEach(function (size) {
        describe(size + ' 테스트', function () {
          it('파일이 생성되어야 합니다.', function () {});
          it('파일을 0으로 채웁니다.', function () {});
          it('파일이 0으로 채워져야 합니다.', function () {});
          it('파일을 임의 패턴으로 채웁니다.', function () {});
          it('기록한 패턴과 동일한 내용이 기록되어야 합니다.', function () {});
        });
      });
    });
    describe('이름이 긴 파일', function () {
      describe('단일 파일 시나리오', function () {
        it('파일이 기록되어야 합니다.', function () {});
        it('파일을 다시 읽을 수 있어야 합니다.', function () {});
      });
      describe('복수 파일 시나리오', function () {
        it('파일 65536개를 기록합니다.', function (done) {
          setTimeout(done, 457);
        });
        it('파일 목록을 성공적으로 출력해야 합니다.', function (done) {
          setTimeout(done, 236);
        });
      });
    });
    describe('강제 제거 시뮬레이트', function () {
      describe('유휴 상태에서 강제 제거', function () {
        describe('유후 상태 제거는 완전히 허용하는 시나리오입니다.', function () {
          it('예외가 발생되지 않아야 합니다.', function () {});
        });
      });
      describe('파일 목록 기록 중 강제 제거', function () {
        it('예외가 발생되어야 합니다.', function () {});
        describe('파일 시스템 없이 디스크를 엽니다.', function () {
          it('더티 비트가 활성화되어야 합니댜.', function () {});
        });
        describe('파일 시스템 일관성 유지', function () {
          it('장치를 다시 성공적으로 열어야 합니다.', function () {});
          it('파일 목록에 변화가 없어야 합니다.', function () {});
        });
        describe('파일 시스템 없이 디스크를 엽니다.', function () {
          it('더티 비트가 비활성화되어야 합니댜.', function () {});
        });
      });
    });
  });
});