var Docker = require('dockerode'); //docker remoteapi를 사용할 수 있는 Nodejs Module
var DOCKER_SOCKET_PATH = "/var/run/docker.sock";
var openCCTV = require(__dirname + "/cameraSetup_v1_script"); //kerberos 컨테이너 실행을위한 함수 모듈
var json = require(__dirname + "/data_v2_script");

exports.deleteContainer = function(data, callback) {

  var dockerHost = new Docker({
    socketPath: DOCKER_SOCKET_PATH
  });

  if (data.delete == "container") {
    var container = dockerHost.getContainer(data.name);

    container.stop(function(err, data) {
      console.log(err);
      container.remove(function(err, data) {
        if (err) {
          console.log("is err");
        }
        return callback(err);
      });
    });


    json.deleteContainer(data.path, data.obox, data.name);

  } else if (data.delete == "camera") {
    /*
    zoneminder
    */
    //openCCTV.deleteCamer(data.obox)
    console.log(data);

    //json.deleteCamera(data.path, data.obox, data.name);
  }

};

exports.makeCCTVContainer = function(image, cameraNames, rtspUrls, callback) {
  result = {
    "success": 1
  };

  var dockerHost = new Docker({
    socketPath: DOCKER_SOCKET_PATH
  });
  /*
  컨테이너 생성을 위한  json parameter 생성
  */
  this.makeConfig(image, dockerHost, function(parameter, containerJson) {
    console.log(containerJson);
    dockerHost.createContainer(parameter).then(function(container) {
      return container.start(); // 생성된 컨테이너 실행
    }).then(function(container) {

      container.inspect(function(err, data) {

        containerJson["name"] = data.Name.substring(1);

        /**
        이더넷 카드
        **/
        var ipAddresses = [];

        var interfaces = require('os').networkInterfaces();

        for (var devName in interfaces) {
          var iface = interfaces[devName];
          for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            //ipAddresses를 이더넷카드로 부터 받는다.
            if (devName != "docker0" && alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
              ipAddresses.push(alias.address);
            }
          }
        }

        host = ipAddresses[0]; //ip얻기

        openCCTV.cameraSetup(image, host, parameter, cameraNames, rtspUrls).then(function(data) {
          containerJson["camera"] = data;
          result["result"] = containerJson;
          return callback(result);
        });

      });

    }).catch(function(err) {
      console.log(err);
      result["success"] = 0;
      return callback(result);
    });
  });
};

/*
newPorts() - 기존의 포트와 중복되지 않는 포트를 리턴한다.

num - 생성할 포트의 갯수
ports - 중복여부를 검사할 기존의 포트 배열
newPort - 생성된 포트를 담는 배열
*/
exports.newPort = function(image, ports, callback) {
  MAX = 20000;
  MIN = 10000;

  newPorts = new Array();

  switch (image) {
    case "kerberos":
      num = 2;
      break;
    case "zoneminder":
      num = 1;
      break;
    case "shinobi":
      num = 1;
  }
  //난수 생성
  for (i = 0; i < num;) {
    port = Math.floor(Math.random() * MAX) + MIN;
    flag = true;

    for (j = 0; j < ports.length; j++) {
      if (port == ports[j]) {
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
  getPort() - dockerode 모듈을 사용하여 컨테이너의 정보를 받아오고 해당 데이터를 파싱하여 사용중인 포트값을 배열로 리턴한다.

  params:
  host - docker host or ip
  port - docker port
*/
exports.getPort = function(dockerHost, callback) {

  dockerHost.listContainers({
    "all": "true"
  }, function(err, containers) {
    var ports = new Array();
    if (err) {
      return callback([]);
    }
    for (i = 0; i < containers.length; i++) {
      for (j = 0; j < containers[i].Ports.length; j++) {
        ports.push(containers[i].Ports[j].PublicPort)
      }
    }

    if (callback === undefined)
      console.log(ports);
    else
      callback(ports);

  });
};

/*
dockerConfig() - 도커 컨테이너 생성시 필요한 params를 이미지 별로 자동으로 생성하는 함수

params
image - 이미지 이름
container - 컨테이너 이름
ports - 사용할 포트
*/
exports.makeConfig = function(image, dockerHost, callback) {
  configData = {}; //컨테이너 생성 params을 담을 변수
  containerJson = {
    "name": ""
  };

  var context = this;
  //OpenCCTV별 이미지 값
  var IMAGES = {
    "kerberos": "kerberos/kerberos",
    "zoneminder": "dlandon/zoneminder",
  };

  //이미지별 컨테이너 사용 포트
  var EXPOSEDPORTS = {
    "kerberos": {
      "80/tcp": {},
      "8889/tcp": {}
    },
    "zoneminder": {
      "80/tcp": {}
    }
  };

  //이미지별 바인딩 포트
  var HOSTCONFIG = {
    "kerberos": {
      "PortBindings": {
        "80/tcp": [{
          "HostPort": 0
        }],
        "8889/tcp": [{
          "HostPort": 0
        }]
      }
    },
    "zoneminder": {
      "PortBindings": {
        "80/tcp": [{
          "HostPort": 0
        }]
      }
    }
  };

  configData["Image"] = IMAGES[image];
  configData["ExposedPorts"] = EXPOSEDPORTS[image];
  containerJson["type"] = image;

  context.getPort(dockerHost, function(ports) {
    context.newPort(image, ports, function(newPort) {
      //입력된 포트와 컨테이너 내부 포트 바인딩
      switch (image) {
        case "kerberos":
          webPort = newPort[0];
          streamPort = newPort[1];
          HOSTCONFIG[image].PortBindings["80/tcp"][0].HostPort = webPort;
          HOSTCONFIG[image].PortBindings["8889/tcp"][0].HostPort = streamPort;
          containerJson["webport"] = webPort;
          break;
        case "zoneminder":
          webPort = newPort[0];
          HOSTCONFIG[image].PortBindings["80/tcp"][0].HostPort = webPort;
          containerJson["webport"] = webPort;
          break;
      }

      configData["HostConfig"] = HOSTCONFIG[image];

      callback(configData, containerJson); // parameter json 리턴
    });
  });

};
