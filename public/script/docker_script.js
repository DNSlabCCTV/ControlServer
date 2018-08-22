// Obox버튼이 생성이되고 해당 obox를 클릭 하게 될 경우
// Obox의 이름을 div modal input tag에 value값으로 추가한다.
$(document).on("click", "#obx", function() {
  obox = $(this).val();
  $('#obox').val(obox);
})

//createContainer - 클라이언트에서 Container이름, OpenCCTV 종류, RTSP url 을 입력받아
// Container의 중복 여부와 컨테이너에서 사용될 포트를 중복하지 않게 생성하여
// Server에 Container생성을 요청한다.
// Server에 Create Container를 요청하기 위해선
// docker_host, docker_port, docker_name, container_name, rtsp, port값이 필요하다.
// docker_host - docker remote api를 사용할 docker_server_host이다.
// docker_port - docker remote api를 사용한 docker_server의 개방 port이다.
// docker_name - json 파일에 카메라가 추가될 type obox이름이다.
// container_name - 생성할 container의 이름이다.
// rtsp - 컨테이너에서 영상을 스트리밍할 rtsp url 주소이다. (배열)
// port - OpenCCTV컨테이너 마다 사용하게될 포트이다.

function createContainer() {

  headers = {}; //request header의 데이터를 담을 배열
  body = {}; //request body의 데이터를 담을 배열
  body["name"] = $('#obox').val(); //Container
  obox = getData("./getTypeOboxByName", "POST", headers, body); //docker_host를 받아온다.
  body = {}; // body 데이터 reset

  docker_host = obox.host; //docker host
  docker_port = obox.port; //docker port
  image = $(":input:radio[name=image]:checked").val(); //선택된 OpenCCTV
  name = $('#name').val(); //container name
  /*
   다중 url 부분을 구현해야 한다.
  */
  rtsp = $('#rtsp').val(); //rtsp url

  /*
  body data 생성
  */
  body["docker_host_name"] = $('#obox').val();
  body["docker_host"] = docker_host;
  body["docker_port"] = docker_port;
  body["image"] = image;
  body["rtsp"] = [rtsp]; //

  /*name 중복 여부 체크
  checkContainerName() - host, port, name를 입력받아 해당 서버에서 실행중인
  container의 이름을 입력받아 중복 될경우 false 중복 되지 않을 경우 true를
  리턴한다.
  */
  checkContainerName(docker_host, docker_port, name, function(result) {

    //중복 여부 검사
    if (!result) {
      alert("중복됩니다");
      return;
    } else {
      //request body 데이터 추가
      body["name"] = name;
      /*port 생성
      getport() - host, port를 입력 받아 해당 docker_server에서
      실행중인 컨테이너들이 사용하고 있는 port를 배열로 리턴 받는다.
      */
      getPort(docker_host, docker_port, function(result) {
        /* 이미지에 따른 포트 갯수를 지정해주어야 한다.
        shinobi, zoneminder 마다 포트 확인 필요!
        */
        //kerberos의 경우
        if (image == "kerberos") {
          num = 2;
        } else {
          num = 1;
        }
        /*
        newPort() - num(원하는 port갯수)와 result(사용중인 포트 배열)
        을 입력받아 중복 되지 않는 포트를 num 갯수 만큼 return 한다.
        */
        newPort(num, result, function(ports) {
          //body에 데이터 추가
          body["container_port"] = ports;
          //서버에 컨테이너 실행을 요청한다.
          result = getData("./createContainer", "POST", headers, body);
          if (result == true) {
            console.log("success");
          } else {
            console.log(result);
          }
          return;
        });
      });
    }
  });
}

/*
checkContainerName()
도커 호스트의 컨테이너 이름과 사용자가 입력한 컨테이너의
중복 여부를 확인하는 함수이다.
host - 접근할 docker_server의 host
port - 접근할 docker_server의 port
name - 사용자가 입력한 컨테이너 이름

중복이 없을경우 true 중복될 경우 false를 return 한다.
*/
function checkContainerName(host, port, name, callback) {
  //docker host url과 사용자 입력 컨테이너 이름을 받아온다.
  var flag = true;

  //getContainerName(host, port)함수를 사용하여 해당 docker host의 컨테이너 정보를 가져온다.
  getContainerName(host, port, function(names) {

    //중복 확인
    for (i = 0; i < names.length; i++) {
      if (name == names[i]) {
        flag = false;
      }
    }

    if (callback === undefined) {
      return flag;
    } else {
      callback(flag);
    }
  });

}

/*
getContainerName()
도커 호스트의 컨테이너 이름을 가져온다.

host - 접근할 docker_server의 host
port - 접근할 docker_server의 port
*/
function getContainerName(host, port, callback) {
  var headers = {};
  var body = {};
  //body data 작성
  body["docker_host"] = host;
  body["docker_port"] = port;
  //server에 해당 도커서버의 컨테이너 이름을 요청한다.
  var containers = getData("./getContainer", "POST", headers, body);
  if (callback === undefined) {
    return containers;
  } else {
    callback(containers);
  }

}

/*
getPort() - docker server에 접근하여 내부 컨테이너가 사용중인 포트번호를 가져온다.
host, port - 컨테이너 정보를 가져올 docker host ip, port
*/
function getPort(host, port, callback) {
  var headers = new Array();
  var body = {};
  body["docker_host"] = host;
  body["docker_port"] = port;
  var ports = getData("./getPort", "POST", headers, body);
  if (callback === undefined) {
    return ports;
  } else {
    callback(ports);
  }
}


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
}

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
    return json_data
  } else {
    callback(json_data);
  }
}
