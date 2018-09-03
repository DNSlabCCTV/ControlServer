var Docker = require('dockerode'); //docker remoteapi를 사용할 수 있는 Nodejs Module

/*
  getPort() - dockerode 모듈을 사용하여 컨테이너의 정보를 받아오고 해당 데이터를 파싱하여 사용중인 포트값을 배열로 리턴한다.

  params:
  host - docker host or ip
  port - docker port
*/
exports.getPort = function(host, port, callback) {

  var docker_host = new Docker({
    host: host,
    port: port
  });

  docker_host.listContainers({
    "all": "true"
  }, function(err, containers) {
    var ports = new Array();
    if (err) {
      console.log(err);
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
exports.dockerConfig = function(image, container, ports, callback) {
  configData = {}; //컨테이너 생성 params을 담을 변수

  //OpenCCTV별 이미지 값
  var IMAGES = {
    "kerberos": "kerberos/kerberos",
    "shinobi": "todo",
    "zoneminder": "todo"
  };

  //이미지별 컨테이너 사용 포트
  var EXPOSEDPORTS = {
    "kerberos": {
      "80/tcp": {},
      "8889/tcp": {}
    },
    "shinobi": {
      "todo/tcp": {},
      "todo/tcp": {}
    },
    "zoneminder": {
      "todo/tcp": {},
      "todo/tcp": {}
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
    "shinobi": {
      "PortBindings": {
        "todo/tcp": [{
          "HostPort": ""
        }],
        "todo/tcp": [{
          "HostPort": ""
        }]
      }
    },
    "zoneminder": {
      "PortBindings": {
        "todo/tcp": [{
          "HostPort": ""
        }],
        "todo/tcp": [{
          "HostPort": ""
        }]
      }
    }
  };

  configData["Image"] = IMAGES[image];
  configData["name"] = container;
  configData["ExposedPorts"] = EXPOSEDPORTS[image];

  //입력된 포트와 컨테이너 내부 포트 바인딩
  switch (image) {
    case "kerberos":
      webPort = ports[0];
      streamPort = ports[1];
      HOSTCONFIG[image].PortBindings["80/tcp"][0].HostPort = webPort;
      HOSTCONFIG[image].PortBindings["8889/tcp"][0].HostPort = streamPort;
      break;
    case "shinobi":
      // webPort = ports[0];
      // streamPort = ports[1];
      // HOSTCONFIG[image].PortBindings["80/tcp"][0].HostPort = webPort;
      // HOSTCONFIG[image].PortBindings["8889/tcp"][0].HostPort = webPort;

      break;
    case "zoneminder":
      // webPort = ports[0];
      // streamPort = ports[1];
      // HOSTCONFIG[image].PortBindings["80/tcp"][0].HostPort = webPort;
      // HOSTCONFIG[image].PortBindings["8889/tcp"][0].HostPort = webPort;
      break;
  }

  configData["HostConfig"] = HOSTCONFIG[image];

  callback(configData); // parameter json 리턴

};
