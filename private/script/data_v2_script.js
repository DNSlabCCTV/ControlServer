var fs = require("fs")
/*
  data_script.js - json 데이터를 조회, 수정, 추가, 제거를 위한 함수들을 정의
*/

/*
getData() - json 데이터 전체를 리턴한다.
*/
exports.getData = function(file, callback) {
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
exports.getOboxList = function(file, callback) {
  this.getData(file, function(err, data) {
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
exports.getCamera = function(file, callback) {
  this.getData(file, function(err, data) {

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

exports.getCameraByObox = function(file_path, oboxName, callback) {
  this.getCamera(file_path, function(err, data) {
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
        result["result"] = cameraArray;
        return callback(err, result);
      }

    }
    result["result"] = null;
    return callback(err, result);


  });
};

exports.getCameraByOboxAndCameraName = function(file_path, oboxName, cameraName, callback) {
  this.getCameraByObox(file_path, oboxName, function(err, data) {
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


exports.addContainer = function(file_path, oboxName, containerJson, callback) {
  this.getData(file_path, function(err, data) {

    result = data.result;

    for (i = 0; i < result.length; i++) {
      if (result[i].name == oboxName) {
        containerList = result[i].container
        containerList.push(containerJson);
      }
    }

    data = {
      "Obox": result
    };

    fs.writeFile(__dirname + "/../../" + file_path, JSON.stringify(data, null, '\t'), "utf8", function(err, data) {
      result = {
        "success": 1
      };

      callback(err, result); // 추가 성공
    });

  });
};

exports.deleteCamera = function(file_path, oboxName, cameraName, callback) {

};

exports.deleteContainer = function(file_path, oboxName, containerName, callback) {
  this.getData(file_path, function(err, data_) {
    oboxList = data_.result;

    out:
      for (i = 0; i < oboxList.length; i++) {
        if (oboxList[i].name == oboxName) {
          for (j = 0; j < oboxList[i].container.length; j++) {
            if (oboxList[i].container[j].name == containerName) {
              break out;
            }
          }
        }
      }

    oboxList[i].container.splice(j, 1);

    data = {
      "Obox": oboxList
    };



    fs.writeFile(__dirname + "/../../" + file_path, JSON.stringify(data, null, '\t'), "utf8");

  });
};

exports.getContainerName = function(file_path, oboxName, cameraName, callback) {
  this.getData(file_path, function(err, data) {
    result = {
      "success":0,
      "delete": "no camera"
    }

    outer:
      for (i = 0; i < data.result.length; i++) {
        if (oboxName == data.result[i].name) { //해당 obox찾
          containerArray = data.result[i].container; //각 obox의 컨테이너
          for (j = 0; j < containerArray.length; j++) { //Container의 카메라확인
            for (k = 0; k < containerArray[j].camera.length; k++) {
              if (containerArray[j].camera[k].name == cameraName) {
                result.success = 1;
                result.delete = "container";
                break outer;
              }

            }
          }
        }
      }

    if(!result.success)
      return callback(result);

    type = containerArray[j].type;
    result["obox"] = oboxName;
    result["type"] = type;
    result["name"] = containerArray[j].name;

    switch (type) {
      case "zoneminder":
        if (containerArray[j].camera.length > 1) {
          result["delete"] = "camera";
          result["name"] = cameraName;
          result["webport"] = containerArray[j].webport;
        }
        break;
    }

    callback(result);

  });
};



exports.makeContainerJsonData = function(containerName, type, webPort, cameraNames, cameraUrls) {

  containerJson = {};
  containerJson["name"] = containerName;
  containerJson["type"] = type;
  containerJson["webport"] = webPort;
  cameraArray = [];

  for (i = 0; i < cameraNames.length; i++) {
    cameraJson = {};
    cameraJson["name"] = cameraNames[i];
    cameraJson["url"] = cameraUrls[i];
    cameraArray.push(cameraJson);
  }

  containerJson["camera"] = cameraArray;

  return containerJson;

};
