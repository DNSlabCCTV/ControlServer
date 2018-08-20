exports.getData = function(fs, file, callback) {
  fs.readFile(__dirname + "/../../" + file, 'utf8', function(err, data) {
    var data = JSON.parse(data);
    callback(err, data);
  });
};

exports.getOboxList = function(fs, file, callback) {
  this.getData(fs, file, function(err, data) {
    var oboxList = Object.keys(data.Obox);
    callback(err, oboxList);
  });
};

exports.getTypeOboxByName = function(fs, file, oboxName, callback) {
  this.getData(fs, file, function(err, data) {
    Obox = data.Obox[oboxName];
    callback(err, Obox);
  });
};

exports.getCameraByObox = function(fs, file, oboxName, callback) {
  this.getData(fs, file, function(err, data) {
    camera = data.Obox[oboxName].camera;
    callback(err, camera);
  });
};

exports.getCameraUrlByCamera = function(fs, file, cameraName, callback) {
  this.getData(fs, file, function(err, data) {
    var oboxList = Object.keys(data.Obox);
    var cameras = new Array();

    for (i = 0; i < oboxList.length; i++) {
      oboxCamera = data.Obox[oboxList[i]].camera;
      oboxCameraName = Object.keys(oboxCamera);
      for (j = 0; j < oboxCameraName.length; j++) {
        if (cameraName == oboxCameraName[j])
          cameras.push(oboxCamera[oboxCameraName[j]]);
      }
    }
    callback(err, cameras);
  });
};


exports.addObox = function(fs, file, oboxName, host, port, callback) {
  this.getData(fs, file, function(err, data) {
    var result = {};

    if (data.Obox[oboxName]) {
      // DUPLICATION FOUND
      result["success"] = 0;
      result["error"] = "duplicate";
      callback(err, result);
      return;
    }

    // ADD TO DATA
    newObox = {
      "host": host,
      "port": port,
      "camera": {}
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


exports.addCamera = function(fs, file, oboxName, cameraName, cameraUrl, callback) {
  this.getData(fs, file, function(err, data) {
    result={};
    if (!data.Obox[oboxName]) {
      // DUPLICATION FOUND
      result["success"] = 0;
      result["error"] = "no obox";
      callback(err, result);
      return;
    }

    if (data.Obox[oboxName].camera[cameraName]) {
      // DUPLICATION FOUND
      result["success"] = 0;
      result["error"] = "duplicate";
      callback(err, result);
      return;
    }

    newCamera = {};
    // ADD TO DATA
    for (i = 0; i < cameraUrl.length; i++) {
      newCamera["url" + (i + 1)] = cameraUrl[i];
    }
    data.Obox[oboxName].camera[cameraName] = newCamera;
    fs.writeFile(__dirname + "/../../" + file, JSON.stringify(data, null, '\t'), "utf8", function(err, data) {
      result = {
        "success": 1
      };
      callback(err, result);
    });
  });
};

exports.deleteCamera = function(fs, file, oboxName, cameraName, callback) {
  this.getData(fs, file, function(err, data) {
    var result = {};
    delete data.Obox[oboxName].camera[cameraName];
    fs.writeFile(__dirname + "/../../" + file, JSON.stringify(data, null, '\t'), "utf8", function(err, data) {
      result["success"] = 1;
      callback(result);
      return;
    });
  });
};
