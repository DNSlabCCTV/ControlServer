/*
  data_script.js - json 데이터를 조회, 수정, 추가, 제거를 위한 함수들을 정의
*/

/*
getData() - json 데이터 전체를 리턴한다.
*/
exports.getData = function(fs, file, callback) {
  fs.readFile(__dirname + "/../../" + file, 'utf8', function(err, data) {
    result = {
      "success": 1
    };
    if (err) {
      result["success"] = 0;
      return callback(err, result);
    }
    var data = JSON.parse(data);
    result["result"] = data.Obox;
    callback(err, result);
  });
};

/*
getOboxList() - obox이름을 json 형식으로 리턴한다.
*/
exports.getOboxList = function(fs, file, callback) {
  this.getData(fs, file, function(err, data) {
    result = {
      "success": 1
    };

    if (err) {
      result["success"] = 0;
    }

    oboxName = [];
    for (i = 0; i < data.result.length; i++) {
      oboxName.push(data.result[i].name)
    }
    result["result"] = oboxName;
    callback(err, result);
  });
};

/*
getCamera() - 모든 Obox 설정된 모니터를 camera_name:url 형식으로 리턴한다.
*/
exports.getCamera = function(fs, file, callback) {
  this.getData(fs, file, function(err, data) {

    result = {
      "success": 1
    };

    if (err) {
      result["success"] = 0;
    }

    oboxArray = data.result;
    output = [];
    for (i = 0; i < oboxArray.length; i++) {
      json = {};
      json["name"] = oboxArray[i].name;
      cameraList = []; //추가 할 카메라 배열
      containerArray = oboxArray[i].container; //실행중인 컨테이너 리스트
      for (j = 0; j < containerArray.length; j++) {
        cameraArray = containerArray[j].camera; //컨테이너 안에 추가된 모니터 리스트
        type = containerArray[j].type;

        for (k = 0; k < cameraArray.length; k++) {
          addCamera = {};
          addCamera["name"] = cameraArray[k].name;
          addCamera["url"] = cameraArray[k].url;
          addCamera["type"] = type;
          cameraList.push(addCamera);
        }
      }
      json["camera"] = cameraList;
      output.push(json);
    }
    result["result"] = output;
    callback(err, result);
  });
};

exports.getCameraByObox = function(fs, file_path, oboxName, callback) {
  this.getCamera(fs, file_path, function(err, data) {
    result = {
      "success": 1
    };

    if (err) {
      result["success"] = 0;
      return callback(err, result);
    }


    oboxArray = data.result;
    cameraList = [];

    for (i = 0; i < oboxArray.length; i++) {

      if (oboxName == oboxArray[i].name) {
        cameraArray = oboxArray[i].camera; //컨테이너 안에 추가된 모니터 리스트
        for (j = 0; j < cameraArray.length; j++) {
          addCamera = {};
          addCamera["name"] = cameraArray[j].name;
          addCamera["url"] = cameraArray[j].url;
          cameraList.push(addCamera);
        }
        result["result"] = cameraList;
        return callback(err, result);
      }

    }
    result["result"] = null;
    return callback(err, result);


  });
};

exports.getCameraByOboxAndCameraName = function(fs, file_path, oboxName, cameraName, callback) {
  this.getCameraByObox(fs, file_path, oboxName, function(err, data) {
    result = {
      "success": 1
    };
    result["result"] = null;

    if (err) {
      result["success"] = 0;
      return callback(result);
    }

    cameraArray = data.result;

    if (cameraArray == null) {
      return callback(err, result);
    }

    for (i = 0; i < cameraArray.length; i++) {
      if (cameraArray[i].name == cameraName) {
        result["result"] = cameraArray[i];
        break;
      }
    }

    return callback(err, result);

  });
};
