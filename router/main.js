module.exports = function(app, fs, docker, json) {

  var file_path = "data/data.json" //data 파일의 주소 (프로젝트 폴더를 기준으로)

  app.get('/', function(req, res) {
    fs.readFile(__dirname + "/../data/data.json", 'utf8', function(err, data) {
      var data = JSON.parse(data);
      res.render('index', {
        "data": data
      })
    });
  });

  app.get('/test', function(req, res) {

  });

  /*
  RESTful API Routing
  - data.json 파일에 저장된 Type Obox및 Obox에 연결된 Camera 데이를 Json형식으로 return 한다.
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
    var obox = req.params.oboxName;
    var host = req.body.host;
    var port = req.body.port;

    // CHECK REQ VALIDITY
    if (!req.body["host"] || !req.body["port"]) {
      result["success"] = 0;
      result["error"] = "invalid request";
      res.json(result);
      return;
    }

    json.addObox(fs, file_path, obox, host, port, function(err, result) {
      res.json(result);
      return;
    });
  });

  app.post('/addCamera/:oboxname', function(req, res) {

    var result = {};

    // CHECK REQ VALIDITY
    if (!req.body["name"] || !req.body["url"]) {
      result["success"] = 0;
      result["error"] = "invalid request";
      res.json(result);
      return;
    }

    var obox = req.params.oboxname;
    var name = req.body.name;
    var url = req.body.url;

    json.addCamera(fs, file_path, obox, name, url, function(err, result) {
      res.json(result);
    });

  });

  app.delete('/deleteCamera/:oBox/:cameraName', function(req, res) {
    var result = {};
    //LOAD DATA
    fs.readFile(__dirname + "/../data/data.json", "utf8", function(err, data) {
      var data = JSON.parse(data);

      // IF NOT FOUND
      if (!data.Obox[req.params.oBox].camera[req.params.cameraName]) {
        result["success"] = 0;
        result["error"] = "not found";
        res.json(result);
        return;
      }

      json.deleteCamera(fs, file_path, req.params.oBox, req.params.cameraName, function(result) {
        res.json(result);
        return;
      })
    });
  });

  /*
  RESTful API
  Docker Server의 Host와 Port를 입력 받아
  해당 Docker Server의 Remot API를 사용한다.
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
