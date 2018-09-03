/*
  data_script.js - json 데이터를 조회, 수정, 추가, 제거를 위한 함수들을 정의
*/

/*
getData() - json 데이터 전체를 리턴한다.
*/
exports.getData = function(fs, file, callback) {
  fs.readFile(__dirname + "/../../" + file, 'utf8', function(err, data) {
    var data = JSON.parse(data);
    callback(err, data);
  });
};

/*
getOboxList() - obox이름을 json 형식으로 리턴한다.
*/
exports.getOboxList = function(fs, file, callback) {
  this.getData(fs, file, function(err, data) {
    var oboxList = Object.keys(data.Obox);
    callback(err, oboxList);
  });
};

/*
getOboxByName - 해당 obox의 데이터를 리턴한다.
*/
exports.getOboxByName = function(fs, file, oboxName, callback) {
  this.getData(fs, file, function(err, data) {
    var result = {};
    result["success"] = 0;

    if (!data.Obox[oboxName]) {
      callback(err, result); //obox가 없을 경우
      return;
    }
    result["success"] = 1;
    Obox = data.Obox[oboxName];
    result[oboxName] = Obox;
    callback(err, result);
  });
};

/*
getContainerByObox() - 해당 obox에서 실행중인 컨테이너를 리턴한다.
*/
exports.getContainerByObox = function(fs, file, oboxName, callback) {
  this.getOboxByName(fs, file, oboxName, function(err, data) {
    var result = {};
    result["success"] = 0;

    if (!data.success) {
      callback(err, result); //obox가 없을 경우
      return;
    }

    result["success"] = 1;
    result[oboxName] = data[oboxName].container;
    callback(err, result);

  });
};

/*
getCameraByObox() - 해당 obox에서 스트리밍중인  카메라의 이름을 리턴한다.
*/
exports.getCameraByObox = function(fs, file, oboxName, callback) {
  this.getContainerByObox(fs, file, oboxName, function(err, data) {
    var result = {};
    result["success"] = 0;

    if (!data.success) {
      callback(err, result); //obox가 없을 경우
      return;
    }

    result["success"] = 1;
    var containerList = Object.keys(data[oboxName]); //컨테이너 리스트 확인
    var cameras = [];

    for (i = 0; i < containerList.length; i++) {
      cameraList = Object.keys(data[oboxName][containerList[i]].camera); //컨테이너 내의 카메라 확인
      for (j = 0; j < cameraList.length; j++) {
        camera = cameraList[j];
        cameras.push(camera); //카메라 데이터 추가
      }
    }
    result[oboxName] = cameras;
    callback(err, result);
  });
};

/*
getUrlByObox() - obox에서 스트리밍중인 카메라의 이름과 url을 리턴한다.
*/
exports.getUrlByObox = function(fs, file, oboxName, callback) {
  this.getContainerByObox(fs, file, oboxName, function(err, data) {
    var result = {};
    result["success"] = 0;

    if (!data.success) {
      callback(err, result); //해당 obox가 없을 경우
      return;
    }
    result["success"] = 1;
    var containerList = Object.keys(data[oboxName]); //컨테이너 확인
    var cameraUrlList = {};

    for (i = 0; i < containerList.length; i++) {
      cameraList = Object.keys(data[oboxName][containerList[i]].camera); //카메라 확인
      // if (cameraList.length == 0) {
      //   callback(err, result);
      //   return;
      // }
      for (j = 0; j < cameraList.length; j++) {
        cameraUrl = data[oboxName][containerList[i]].camera[cameraList[j]];
        cameraUrlList[cameraList[j]] = cameraUrl; //카메라 url에 추가
      }
    }
    result[oboxName] = cameraUrlList;
    callback(err, result);
  });
};

/*
  getUrlByOboxCamera() - 해당 obox의 입력된 카메라 이름의 데이터를 리턴한다.
*/
exports.getUrlByOboxCamera = function(fs, file, oboxName, cameraName, callback) {
  this.getContainerByObox(fs, file, oboxName, function(err, data) {
    var result = {};
    result["success"] = 0;

    if (!data.success) {
      callback(err, result); //obox가 없을 경우
      return;
    }

    var containerList = Object.keys(data[oboxName]);
    var cameraUrlList = {};

    for (i = 0; i < containerList.length; i++) {
      cameraList = Object.keys(data[oboxName][containerList[i]].camera);

      // if (cameraList.length == 0) {
      //   callback(err, result);
      //   return;
      // }

      for (j = 0; j < cameraList.length; j++) {
        // 해당 카메라를 찾을 경우
        if (cameraList[j] == cameraName) {
          result["success"] = 1;
          result[cameraName] = data[oboxName][containerList[i]].camera[cameraList[j]];
          callback(err, result);
          return;
        }
      }
    }
    callback(err, result); // 해당 카메라가 없을경우
  });
};

/*
getCamera() - obox별 스트리밍 중인 카메라와 url을 리턴한다.
*/
exports.getCamera = function(fs, file, callback) {
  this.getData(fs, file, function(err, data) {
    var oboxList = Object.keys(data.Obox);
    var result = {};

    for (i = 0; i < oboxList.length; i++) {
      camera = {}; //obox별 카메라 데이터를 담을 json 변수
      var containerList = Object.keys(data.Obox[oboxList[i]].container);
      for (j = 0; j < containerList.length; j++) {
        var cameraList = Object.keys(data.Obox[oboxList[i]].container[containerList[j]].camera);
        for (k = 0; k < cameraList.length; k++) {
          url = data.Obox[oboxList[i]].container[containerList[j]].camera[cameraList[k]];
          camera[cameraList[k]] = url;
        }
      }
      result[oboxList[i]] = camera;
    }

    callback(err, result);
  });
};

/*
addObox() - 새로운 obox를 추가한다.
parameter : oboxName, oboxHost, oboxPort
*/
exports.addObox = function(fs, file, oboxName, host, port, callback) {
  this.getData(fs, file, function(err, data) {
    var result = {};

    if (data.Obox[oboxName]) {
      // DUPLICATION FOUND
      result["success"] = 0;
      callback(err, result);
      return;
    }

    // ADD TO DATA
    newObox = {
      "host": host,
      "port": port,
      "container": {}
    };

    data.Obox[oboxName] = newObox;

    fs.writeFile(__dirname + "/../../" + file, JSON.stringify(data, null, '\t'), "utf8", function(err, data) {
      result = {
        "success": 1
      };
      callback(err, result);
    });

  });
};

/*
addContainer() - 새로운 컨테이너를 추가한다.
parameter : oboxName, containerName, container
container는 해당 컨테이너의 type, port, camera{} 를 가진 json 형식의 데이터이다.
*/
exports.addContainer = function(fs, file, oboxName, containerName, container, callback) {
  this.getData(fs, file, function(err, data) {
    result = {};
    //obox가 없을 경우
    if (!data.Obox[oboxName]) {
      result["success"] = 0;
      callback(err, result);
      return;
    }
    // 컨테이너 중복
    if (data.Obox[oboxName].container[containerName]) {
      result["success"] = 0;
      callback(err, result);
      return;
    }

    data.Obox[oboxName].container[containerName] = container;

    fs.writeFile(__dirname + "/../../" + file, JSON.stringify(data, null, '\t'), "utf8", function(err, data) {
      result = {
        "success": 1
      };
      callback(err, result); // 추가 성공
    });

  });
};

/*
makeContainerData() 컨테이너 데이터를 자동으로 생성해 주는 함수
*/
exports.makeContainerData = function(fs, file, containerName, port, camera, callback) {

};
