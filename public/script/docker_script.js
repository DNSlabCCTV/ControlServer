// Obox버튼이 생성이되고 해당 obox를 클릭 하게 될 경우
// Obox의 이름을 div modal input tag에 value값으로 추가한다.
$(document).on("click", "#obx", function() {
  obox = $(this).val();
  $('#obox').val(obox);
})

/*
createContainer() - 입력 받은 값으로 컨테이너 생성 request를 보내느 함수

oboxName, cameraName, rtspURLs, Ports 값을 params로 서버에 request를 보낸다.

oboxName = JNU, KKU, NUC
cameraName = 카메라 이름들의 배열
rtspURLs = 카메라의 RTSP url 배열
Ports = 컨테이너가 사용할 포트 (난수 생성으로 기존의 사용 포트와 중복 되지 않게 생성한다.)
*/
function createContainer() {

  headers = {}; //request header의 데이터를 담을 객체
  body = {}; //request body의 데이터를 담을 객체

  image = $(":input:radio[name=image]:checked").val(); //선택된 OpenCCTV
  obox = $('#obox').val(); //obox
  /*
  다중 입력 처리
  */
  cameras = [$('#name').val()]; //container name
  rtsp = [$('#rtsp').val()]; //rtsp url

  /*
  body data 생성
  */
  body["obox"] = obox;
  body["image"] = image;
  body["rtsp"] = rtsp;
  body["cameras"] = cameras;

  //해당 obox의 사용중인 카메라 이름들을 받아 중복 여부를 확인한다.
  getCameras(obox, function(data) {
    //중복 체크
    dufilcateCheck(cameras, data, function(dufilcate) {

      if (!dufilcate)
        return false; // 중복 될 경우

      //obox에서 사용중이 포트 확인
      getPort(obox, function(ports) {
        var numberOfPorts = 0;

        //OpenCCTV별 사용할 port 갯수 설정
        switch (image) {
          case "kerberos":
            numberOfPorts = 2;
            break;
          case "shinobi":
            numberOfPorts = 1;
            break;
          case "zoneminder":
            numberOfPorts = 1;
            break;
          default:
            return false;
        }

        //중복되지 않는 포트를 생성
        newPort(numberOfPorts, ports, function(newPort) {
          body["container_port"] = newPort;
          //createContainer request를 보낸다.
          getData("./createContainer", "POST", headers, body, function(result) {
            if (result) {
              console.log("success"); // 성공
            } else {
              console.log(result); //실패
            }
            return;
          });
        });
      });
    });
  });
};

/*
dufilcateCheck() - 입력된 두 배열의 중복 데이터 값 여부를 확인
*/
function dufilcateCheck(inputs, origins, callback) {

  //docker host url과 사용자 입력 컨테이너 이름을 받아온다.
  for (i = 0; i < origins.length; i++) {
    for (j = 0; j < inputs.length; j++) {
      if (inputs[j] == origins[i])
        return callback(false); //중복
    }
  }
  return callback(true);
};

/*
getPort() - docker server에 접근하여 내부 컨테이너가 사용중인 포트번호를 가져온다.
host, port - 컨테이너 정보를 가져올 docker host ip, port
*/
function getPort(obox, callback) {
  var headers = new Array();
  var body = {};
  getData("./getPort/" + obox, "GET", headers, body, function(ports) {
    if (callback === undefined) {
      return ports;
    } else {
      callback(ports[obox]);
    }
  });
};


/*
newPorts() - 기존의 포트와 중복되지 않는 포트를 리턴한다.

num - 생성할 포트의 갯수
ports - 중복여부를 검사할 기존의 포트 배열
newPort - 생성된 포트를 담는 배열
*/
function newPort(num, ports, callback) {
  MAX = 10000;
  MIN = 80;
  newPorts = new Array();
  //난수 생성
  for (i = 0; i < num;) {
    port = Math.floor(Math.random() * MAX) + MIN;
    flag = true;

    for (j = 0; j < ports.length; j++) {
      if (port == ports[j]) {
        console.log(port)
        flag = false;
        break;
      }
    }
    //중복 되지 않을 경우 새로운 포트로 추가
    if (flag) {
      ports.push(port);
      newPorts.push(port.toString());
      i++;
    }
  }

  if (callback === undefined) {
    return newPorts;
  } else {
    callback(newPorts);
  }
};

/*
getData(...) - Server에 Restful API의 결과를 받는 함수

url = Restful API url
type = request의 방식 ex) GET, POST, DELETE
header = request에 작성할 header배열
body = request에 작성할 body 배열
*/

var getData = function(url, type, header, body, callback) {
  var json_data;
  $.ajax({
    type: type, //Post방식
    url: url, //login API url
    headers: header,
    crossDomain: true, //크로스 도메인 허용
    dataType: "json",
    data: body, //Post data설정
    async: false,
    //request 성공시
    success: function(result) {
      json_data = result;
    },
    error: function(result) {
      console.log(result)
      alert('fail to login');
    }
  })

  if (callback === undefined) {
    return json_data;
  } else {
    callback(json_data);
  }
};
