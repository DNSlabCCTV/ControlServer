var docker = require(__dirname + "/../private/script/docker_v3_script");
var json = require(__dirname + "/../private/script/data_v2_script");
var file_path = "data/data_testbed.json" //data 파일의 주소 (프로젝트 폴더를 기준으로)

//Server의 라우팅 메소드
module.exports = function(app) {
  /*
    타대학에서의 HTTP Proxy URL을 받기위한 Restful API
  */

  /*
  GET /Data
  서버에 저장된 obox, container, camera 정보를 가지고 있는 json 형식의 데이터를 리턴한다.
  */
  app.get('/Data', function(req, res) {
    json.getData(file_path, function(err, data) {
      res.json(data);
    });
  });

  app.get('/getOboxList', function(req, res) {
    json.getOboxList(file_path, function(err, data) {
      res.json(data);
    });
  });

  app.get('/getCamera', function(req, res) {
    json.getCamera(file_path, function(err, data) {
      res.json(data);
    });
  });

  app.get('/getCameraByObox/:oboxName', function(req, res) {
    var oboxName = req.params.oboxName;
    json.getCameraByObox(file_path, oboxName, function(err, data) {
      res.json(data);
    });
  });

  app.get('/getCameraByOboxAndCamera/:oboxName/:cameraName', function(req, res) {
    var oboxName = req.params.oboxName;
    var cameraName = req.params.cameraName;

    json.getCameraByOboxAndCameraName(file_path, oboxName, cameraName, function(err, data) {
      res.json(data);
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

    var result = {
      "success": 1
    };

    var image = req.body.image; //이미지 이름 kerberos, shinobi, zoneminder
    var cameras = req.body.cameras; //cameras 카메라 이름 배열
    var rtsp = req.body.rtsp; //rtsp주소 배열
    var obox = req.body.obox; //컨테이너를 생성할 obox

    if (!image || !cameras || !rtsp || !obox) {

      result["success"] = 0;
      result["result"] = "has no input";

      return res.json(result);

    }
    result["result"] = "making container";

    res.json(result);

    docker.makeCCTVContainer(image, cameras, rtsp, function(data) {
      containerJson = data.result;
      //data.json에 컨테이너와 카메라 추가
      json.addContainer(file_path, obox, containerJson, function(err, result) {
        console.log(result);
      });

    });
  });

  /*
  DELETE /deleteCamera/:oboxName/:cameraName
  */
  app.delete('/deleteCamera/:oboxName/:cameraName', function(req, res) {

    var send_result = {
      "success": 1
    };

    var oboxName = req.params.oboxName;
    var cameraName = req.params.cameraName;

    json.getContainerName(file_path, oboxName, cameraName, function(get_result) {

      if (!get_result.success) {
        send_result.success = 0;
        send_result["result"] = "there is no camera";
        return res.json(send_result);
      }

      send_result["result"] = get_result;
      res.json(send_result);

      get_result["path"] = file_path;
      docker.deleteContainer(get_result, function(function_result) {
        //console.log(result);
      });

    });

  });
}
