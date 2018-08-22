module.exports = function(app, fs, docker, json) {
  //docker, json은 docker와 json데이터관리를 하는 함수 모듈이다.

  var file_path = "data/data.json" //data 파일의 주소 (프로젝트 폴더를 기준으로)

  /*
  컨트롤 페이지 렌더링 함수
  */
  app.get('/', function(req, res) {
    fs.readFile(__dirname + "/../data/data.json", 'utf8', function(err, data) {
      var data = JSON.parse(data);
      res.render('index', {
        "data": data
      })
    });
  });

  /*
  RESTful API Routing
  - data.json 파일에 저장된 Type Obox및 Obox에 연결된 Camera 데이를 Json형식으로 return 한다.

  1. /Data get방식 obox, name, host, port, camera등의 데이터를 리턴한다.
  2. /getOboxList get방식 koren망에 연결된 obox의 리스트를 리턴한다.
  3. /getTypeOboxByName post방식 obox의 이름을 받아 해당 obox에 host, port, camrea정보를 리턴한다.
  4. /getCameraByObox/:oboxname get방식 obox의 이름을 입력받아 해당 오박스에 연결된 camera정보를 리턴한다.
  5. /getCameraUrlByCamera/:cameraName get방식 Camera의 이름(컨테이너 이름)을 입력받아 해당 컨테이너의 스트림 url을 리턴한다.
  6. /addObox/:oboxName post방식 이름과 host, port를 입력 받아 새로운 Obox를 추가한다.
  7. /addCamera/:oboxName obox이름을 입력받아 해당 obox에 카메라 정보(컨테이너) 정보를 추가한다.
  */

  /*
  /Data - data.json에 포함된 데이터 전체를 리턴한다.
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

  app.post('/getTypeOboxByName', function(req, res) {
    var oboxName = req.body.name;
    json.getTypeOboxByName(fs, file_path, oboxName, function(err, data) {
      res.send(data);
    });
  })

  app.get('/getCameraByObox/:oboxName', function(req, res) {
    var oboxName = req.params.oboxName;
    json.getCameraByObox(fs, file_path, oboxName, function(err, data) {
      res.send(data);
    });
  });

  app.get('/getCameraUrlByCamera/:cameraName', function(req, res) {
    var cameraName = req.params.cameraName;
    json.getCameraUrlByCamera(fs, file_path, cameraName, function(err, data) {
      res.send(data);
    });
  });

  app.post('/addObox/:oboxName', function(req, res) {

    var result = {};
    var obox = req.params.oboxName; //obox이름
    var host = req.body.host; //obox host
    var port = req.body.port; //obox docker_port

    // host와 port가 입력 받지 않았을 경우
    if (!req.body["host"] || !req.body["port"]) {
      result["success"] = 0;
      result["error"] = "invalid request";
      res.json(result);
      return;
    }

    //obox추가
    json.addObox(fs, file_path, obox, host, port, function(err, result) {
      res.json(result);
      return;
    });

  });

  app.post('/addCamera/:oboxname', function(req, res) {

    var result = {};

    // 이름과 url 입력 받지 않았을 경우
    if (!req.body["name"] || !req.body["url"]) {
      result["success"] = 0;
      result["error"] = "invalid request";
      res.json(result);
      return;
    }

    var obox = req.params.oboxname;
    var name = req.body.name;
    var url = req.body.url;

    //camera 추가
    json.addCamera(fs, file_path, obox, name, url, function(err, result) {
      res.json(result);
    });

  });

  app.delete('/deleteCamera/:oBox/:cameraName', function(req, res) {
    var result = {};
    //json 데이터 가져오기
    fs.readFile(__dirname + "/../data/data.json", "utf8", function(err, data) {
      var data = JSON.parse(data);

      // obox, 혹은 camera가 없을 경우 실패
      if (!data.Obox[req.params.oBox].camera[req.params.cameraName]) {
        result["success"] = 0;
        result["error"] = "not found";
        res.json(result);
        return;
      }

      //파일 update
      json.deleteCamera(fs, file_path, req.params.oBox, req.params.cameraName, function(result) {
        res.json(result);
        return;
      });

    });
  });

  /*
  RESTful API
  Docker Server의 Host와 Port를 입력 받아
  해당 Docker Server의 Remot API를 사용하여 컨테이너 정보를 받아와
  port와 name을 파싱한다.
  */

  app.post('/createContainer', function(req, res) {

    var docker = require(__dirname + "/../private/script/docker_script");
    var image = req.body.image;
    var name = req.body.name;
    var rtsp = req.body.rtsp;
    var docker_host_name = req.body.docker_host_name;
    var docker_host = req.body.docker_host;
    var docker_port = req.body.docker_port;
    var container_port = req.body.container_port;

    docker.createContainer(image, docker_host, docker_port, container_port, name, function(err, container) {

      container.start(function(err, data) {
        if (err) {
          res.send(false);
          return;
        } else {
          json.addCamera(fs, file_path, docker_host_name, name, rtsp, function(err, result) {
            res.send(true);
            return;
          });
        }
      });

    });

  });


  app.post('/getContainer', function(req, res) {
    var host = req.body.docker_host;
    var port = req.body.docker_port;

    docker.getContainerName(host, port, function(names) {
      res.send(names);
    });

  });

  app.post('/getPort', function(req, res) {
    var host = req.body.docker_host;
    var port = req.body.docker_port;

    docker.getPort(host, port, function(ports) {
      res.send(ports);
    });

  });

}
