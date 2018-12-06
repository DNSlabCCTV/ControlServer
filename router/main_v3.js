var docker = require(__dirname + "/../private/script/docker_v3_script");
var json = require(__dirname + "/../private/script/data_v2_script");
var file_path = "data/cbox_data.json" //data 파일의 주소 (프로젝트 폴더를 기준으로)
var request = require('request'); //http request를 위한 모듈


/*
Server 라우팅 함수
*/

module.exports = function(host_address, app) {

  /*
    Restful API 정의
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

  /*
  GET /getOboxList
  서버에 저장된 obox정보를 json 형식의 데이터를 리턴한다.
  */
  app.get('/getOboxList', function(req, res) {
    json.getOboxList(file_path, function(err, data) {
      res.json(data);
    });
  });

  /*
  GET /getCamera
  서버에 저장된 camera정보를 json 형식의 데이터를 리턴한다.
  */
  app.get('/getCamera', function(req, res) {
    json.getCamera(file_path, function(err, data) {
      res.json(data);
    });
  });

  /*
  GET /getCameraByObox/:oboxName
  oboxName을 parameter로 받아 해당 obox의 정보를 리턴한다.
  */
  app.get('/getCameraByObox/:oboxName', function(req, res) {
    var oboxName = req.params.oboxName;
    json.getCameraByObox(file_path, oboxName, function(err, data) {
      res.json(data);
    });
  });

  /*
  GET /getCameraByOboxAndCamera/:oboxName/:cameraName
  oboxName을 parameter로 받아 해당 obox의 정보를 리턴한다.
  */
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

    docker.makeCCTVContainer(host_address, image, cameras, rtsp, file_path, obox, function(data) {
      containerJson = data.result;
      //data.json에 컨테이너와 카메라 추가
      json.addContainer(file_path, obox, containerJson, function(err, result) {
        emitData = {};
        emitData["oboxName"] = obox;
        emitData["cameraArray"] = containerJson.camera;

        req.app.io.emit('addCamera', emitData);

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
      get_result["host"] = host_address;

      docker.deleteContainer(get_result, function(function_result) {
        //console.log(result);
        emitData = {};
        emitData["oboxName"] = oboxName;
        emitData["cameraName"] = cameraName;
        req.app.io.emit('deleteCamera', emitData);

      });
    });
  });

  app.get('/openCCTVWeb/:oboxName/:cameraName', function(req, res) {

    var oboxName = req.params.oboxName;
    var cameraName = req.params.cameraName;

    json.getWebPort(file_path, oboxName, cameraName, function(result) {
      openCCTVUrl = "http://" + host_address + ":" + result.webPort;

      if (result.type == 'kerberos') {
        path = openCCTVUrl + "/api/v1/login/login"; // login page

        body_ = {
          "username": "root", //default id
          "password": "root" //default passwd
        };

        var options = {
          url: path,
          method: 'POST',
          form: body_
        };

        request(options, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            cookie = response.headers['set-cookie']; //쿠키 생성
            res.cookie(cookie);
            res.redirect(openCCTVUrl);
          }
        });

      } else if(result.type = 'zoneminder'){
        openCCTVUrl += "/zm";
        res.redirect(openCCTVUrl);
      }

    });
  });

  /*
  POST /addObox
  obox 이름, obox host, obox port를 body parameter로 입력 받아
  data.json 파일에 새로운 Obox를 추가한다.
  */
  app.post('/addObox', function(req, res) {

    var result = {};
    var obox = req.body.name; //obox이름
    var host = req.body.host; //obox host
    var port = req.body.port; //obox docker_port

    // host와 port가 입력 받지 않았을 경우에러
    if (!req.body["host"] || !req.body["port"]) {
      result["success"] = 0;
      result["error"] = "invalid request";
      res.json(result);
      return;
    }

    //data.json 파일에 추가한다.
    json.addObox(fs, file_path, obox, host, port, function(err, result) {
      res.json(result);
      return;
    });

  });
}
