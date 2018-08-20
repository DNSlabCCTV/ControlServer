$(document).on("click", "#obx", function() {
  obox = $(this).val();
  $('#obox').val(obox);
})

function createContainer() {

  headers = {};
  body = {};
  body["name"] = $('#obox').val();
  obox = getData("./getTypeOboxByName", "POST", headers, body);
  body = {};

  docker_host = obox.host;
  docker_port = obox.port;
  image = $(":input:radio[name=image]:checked").val();
  name = $('#name').val();
  rtsp = $('#rtsp').val();

  body["docker_host_name"] = $('#obox').val();
  body["docker_host"] = docker_host;
  body["docker_port"] = docker_port;
  body["image"] = image;
  body["rtsp"] = [rtsp];

  /*name 중복 여부 체크*/
  checkContainerName(docker_host, docker_port, name, function(result) {

    if (!result) {
      alert("중복됩니다");
      return;
    } else {
      body["name"] = name;
      /*port 생성*/
      getPort(docker_host, docker_port, function(result) {
        /* 이미지에 따른 포트 갯수를 지정해주어야 한다.*/
        if (image == "kerberos") {
          num = 2;
        } else {
          num = 1;
        }
        ports = newPort(num, result);
        body["container_port"] = ports;
        console.log(body);
        result = getData("./createContainer", "POST", headers, body);
        if (result == true) {
          console.log("success");
        } else {
          console.log(result);
        }
        return;

      });
    }
  });
}

/*
callback = true, false를 파라미터로 실행 할 콜백 함수

checkContainerName()
도커 호스트의 컨테이너 이름과 사용자가 입력한 컨테이너의
중복 여부를 확인하는 함수이다.

input - 사용자 입력 컨테이너 이름 저장변수
        id가 name인 input tag로 부터 값을 가져온다.

url -

flag - 중복 여부를 나타내는 변수
        true 중복 없음, false 중복

*/
function checkContainerName(host, port, name, callback) {
  //docker host url과 사용자 입력 컨테이너 이름을 받아온다.
  var flag = true;

  //getContainerName()함수를 사용하여 해당 docker host의 컨테이너 정보를 가져온다.
  getContainerName(host, port, function(names) {

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
url - 컨테이너 정보를 가져올 docker host ip, url
callback = 컨테이너 이름 배열을 파라미터로 실행 할 콜백 함수

getContainerName()
도커 호스트의 컨테이너 이름을 가져온다.

containers - 도커 호스트의 컨테이너 정보를 저장하는 변수
names - containers로부터 컨테이너 이름을 추출하여 이름을 저장하는 변수

*/
function getContainerName(host, port, callback) {
  var headers = {};
  var body = {};
  body["docker_host"] = host;
  body["docker_port"] = port;
  var containers = getData("./getContainer", "POST", headers, body);
  if (callback === undefined) {
    return containers;
  } else {
    callback(containers);
  }

}

/*
host, port - 컨테이너 정보를 가져올 docker host ip, port
callback = 컨테이너 이름 배열을 파라미터로 실행 할 콜백 함수

getPort()
도커 호스트에서 사용중인 포트를 가져온다.

ports - 도커 호스트의 사용중인 포트를 담는 변수

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
num - 생성할 포트의 갯수
ports - 중복여부를 검사할 기존의 포트 배열
callback = 컨테이너 이름 배열을 파라미터로 실행 할 콜백 함수

newPorts()
기존의 포트와 중복되지 않는 포트를 리턴한다.

newPort - 생성된 포트를 담는 배열
*/
function newPort(num, ports, callback) {
  count = 0;
  newPorts = new Array();

  for (i = 0; i < num;) {
    port = Math.floor(Math.random() * 10000) + 80;
    flag = true;

    for (j = 0; j < ports.length; j++) {
      if (port == ports[j]) {
        console.log(port)
        flag = false;
        break;
      }
    }

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
url = requset를 보낼 host inspect
type = request의 방식 ex) GET, POST, DELETE
data_ = 파라미터
callback = response를 파라미터로 실행 할 콜백 함수

getData(...) - Restful API의 결과를 받는 함수이다.
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
