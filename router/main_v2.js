var kerberos = require(__dirname + "/../private/script/kerberos_script"); //kerberos 컨테이너 실행을위한 함수 모듈
var Docker = require('dockerode'); //docker remote api를 사용할 수 있는 Nodejs Module
//var file_path = "data/data.json" //data 파일의 주소 (프로젝트 폴더를 기준으로)
//var file_path = "data/sample_data.json" //data 파일의 주소 (프로젝트 폴더를 기준으로)
var file_path = "data/data_v2.json" //data 파일의 주소 (프로젝트 폴더를 기준으로)

//Server의 라우팅 메소드
module.exports = function(app, fs, docker, json) {

  /*
    타대학에서의 HTTP Proxy URL을 받기위한 Restful API
  */

  /*
  GET /Data
  서버에 저장된 obox, container, camera 정보를 가지고 있는 json 형식의 데이터를 리턴한다.
  */
  app.get('/Data', function(req, res) {
    json.getData(fs, file_path, function(err, data) {
      res.send(data);
    });
  });

  app.get('/getOboxList', function(req, res) {
    json.getOboxList(fs, file_path, function(err, data) {
      res.send(data);
    });
  });

  app.get('/getCamera', function(req, res) {
    json.getCamera(fs, file_path, function(err, data) {
      res.send(data);
    });
  });

  app.get('/getCameraByObox/:oboxName', function(req, res) {
    var oboxName = req.params.oboxName;
    json.getCameraByObox(fs, file_path, oboxName, function(err, data) {
      res.send(data);
    });
  });

  app.get('/getCameraByOboxAndCamera/:oboxName/:cameraName', function(req, res) {
    var oboxName = req.params.oboxName;
    var cameraName = req.params.cameraName;

    json.getCameraByOboxAndCameraName(fs, file_path, oboxName, cameraName, function(err, data) {
      res.send(data);
    });

  });




  /*
  POST /createContainer
  image type(kerbero, shinobi, zoneminder), cameras, rtspURLs, containerPorts, obox이름을
  입력 받아 해당 obox에 지정된 openCCTV 컨테이너를 생성 실행하고
  컨테이너에 RTSP URL을 자동으로 설정한다.

  Shinobi, Zoneminder는 컨테이너 생성, 자동화 부분을 함수를 추가 개발 하여야 한다.
  */
  app.post('/createContainer', function(req, res) {

    var docker = require(__dirname + "/../private/script/docker_script"); // 이미지에 따른 컨테이너 설정 파라메터 자동 생성 모듈
    var image = req.body.image; //이미지 이름 kerberos, shinobi, zoneminder
    var cameras = req.body.cameras; //cameras 카메라 이름 배열
    var rtsp = req.body.rtsp; //rtsp주소 배열
    /*
    포트는 이미지에 따라 갯수가 다르다.
    kerberos = 2개 container_port[0] = webPort, container_port[1] = streamPort
    */
    var container_port = req.body.container_port; // 사용할 포트
    var obox = req.body.obox; //컨테이너를 생성할 obox

    //data.json에 저장된 obox의 host와 port를 가져온다.
    json.getOboxByName(fs, file_path, obox, function(err, data) {

      if (!data.success)
        return res.send(result); //해당 obox가 없을 경우

      docker_host = data[obox].host; //obox host
      docker_port = data[obox].port; //obox port
      container_name = cameras[0]; //컨테이너 이름은 입력된 카메라 이름중 첫번쨰 이름으로 컨테이너를 생성한다.
      container_port = ["80", "8889"]; //Test를 위한 80, 8889포트 사용( 외부 포트 )

      /*
      Dockerode라이브러리를 사용한 docker API사용
      */
      var dockerHost = new Docker({
        host: docker_host,
        port: docker_port
      });

      //docker API사용을 위한 parameter데이터 생성 함수
      docker.dockerConfig(image, container_name, container_port, function(parameter) {
        //Dockerode를 사용하여 도커 컨테이너 생성
        dockerHost.createContainer(parameter).then(function(container) {
          return container.start(); // 생성된 컨테이너 실행
        }).then(function(container) {

          /*
            Todo
            Zoneminder, Shinobi 컨테이너에 따른 자동화 함수 구현
          */

          //실행된 kerberos의 ipcamera url 설정
          kerberos.kerberosSetup(docker_host, container_port, container_name, rtsp, function(result, data) {
            //카메라 설정 실패시
            if (result) {
              return res.send(false);
              /*
                컨테이너 제거 함수 추가
              */
            }
            //data.json에 컨테이너와 카메라 추가
            json.addContainer(fs, file_path, obox, container_name, data, function(err, result) {
              return res.send(true); // 컨테이너 생성, 실행 및 json데이터 추가 성공;
            });
          });

        }).catch(function(err) {
          /*
          todo : 에러처리
          */
          console.log(err);
        });
      });
    });
  });

  /*
  GET /getPort/?oboxName
  oboxName을 path로 받아 해당 obox에서 컨테이너가 사용하는 Port의 값을 넘겨준다.

  dockerode를 통한 컨테이너 정보 조회시 정지된 컨테이너는 확인 할 수 없다.

  2018/09/03 - docker api를 dockerode 모듈을 통하여 사용
  */
  app.get('/getPort/:oboxName', function(req, res) {
    var result = {};
    result["success"] = 0;

    var obox = req.params.oboxName; //oboxName
    json.getOboxByName(fs, file_path, obox, function(err, data) {

      if (!data.success)
        return res.send(result); //obox가 없을 경우

      host = data[obox].host;
      port = data[obox].port;

      docker.getPort(host, port, function(ports) {
        result["success"] = 1;
        result[obox] = ports;
        res.send(result); //getPort
      });

    });
  });

}
