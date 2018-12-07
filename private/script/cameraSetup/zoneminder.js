var util = require('util');
var exec = require('child_process').exec;
var request = require('request'); //http request를 위한 모듈
/*
ZoneminderSetup() - kerberos 컨테이너의 IPcamera url을 API를 통하여 설정
params
host - kerberos host
ports - web, stream ports
cameraName - cameraName
rtspUrl - IPcamera rtsp url
*/

INTERVER_TIME = 5000;

module.exports.checkServer = function(host, port) {
  return new Promise(function(resolve, reject) {
    var interval = setInterval(function() {
      url = "http://" + host + ":" + port + "/zm";
      request(url, function(error, response, body) {
        if (error) {
          console.log(error);
        } else {
          code = response.statusCode;
          if (code >= 200 && code < 300) {
            clearInterval(interval);
            resolve(code);
          }
        }
      });
    }, INTERVER_TIME);
  });
}



module.exports.deleteCamera = function(host, port, name) {

  context = this;

  return new Promise(function(resolve, reject) {
    context.getMonitorId(host, port, name, function(id) {

      var options = {
        url: "http://" + host + ":" + port + "/zm/api/monitors/" + id + ".json",
        method: "DELETE"
      }

      request(options, function(error, response, body) {
        if (error) {
          console.log(error);
        } else {
          code = response.statusCode;
          console.log(code);
          resolve(code);
        }
      });

    });
  });
};

module.exports.zoneminderSetup = function(host, port, cameraName, rtspUrl) {
  //기본 유저 아이디 비밀번호 설정
  var context = this;

  return new Promise(function(resolve, reject) {
    Monitor = {};

    Monitor["Name"] = cameraName;
    Monitor["Function"] = "Modect";
    Monitor["Type"] = "Ffmpeg";
    Monitor["Format"] = 255;
    Monitor["Method"] = "rtpRtsp";
    Monitor["SaveJPEGs"] = 0;
    Monitor["VideoWriter"] = 1;
    Monitor["Path"] = rtspUrl;
    Monitor["Port"] = 80;
    Monitor["Width"] = 704;
    Monitor["Height"] = 480;
    Monitor["Colours"] = 4;
    Monitor["StorageId"] = 1;
    Monitor["Device"] = "/dev/video0";
    Monitor["V4LCapturesPerFrame"] = 1;
    Monitor["Orientation"] = 0;
    Monitor["RTSPDescribe"] = false;
    Monitor["ImageBufferCount"] = 20;
    Monitor["WarmupCount"] = 0;
    Monitor["PreEventCount"] = 0;
    Monitor["PostEventCount"] = 5;
    Monitor["StreamReplayBuffer"] = 0;
    Monitor["MaxFPS"] = 30.00;
    Monitor["AlarmMaxFPS"] = 30.00;
    Monitor["FPSReportInterval"] = 100;
    Monitor["Sequence"] = 2;
    Monitor["ZoneCount"] = 1;

    body_ = {
      "Monitor": Monitor
    };


    // 초기 설정 api
    path = "http://" + host + ":" + port + "/zm/api/monitors.json";

    var options = {
      url: path,
      method: 'POST',
      form: body_
    };


    request(options, function(error, response, body) {

      if (error) {
        console.log("Error in firstSetup = " + error);
      } else {

        context.getMonitorId(host, port, cameraName, function(id) {
          cameraJson = {};
          cameraJson["name"] = cameraName;
          url = "http://" + host + ":" + port + "/zm/cgi-bin/nph-zms?mode=jpeg&monitor=" + id + "&scale=100&maxfps=30&buffer=1000";
          cameraJson["url"] = url;
          resolve(cameraJson);
        });

      }
    });

  });
};


module.exports.getMonitorId = function(host, port, cameraName_, callback) {

  // 초기 설정 api
  path = "http://" + host + ":" + port + "/zm/api/monitors.json";

  var options = {
    url: path,
    method: 'GET'
  };

  request(options, function(error, response, body) {

    if (error) {
      console.log("Error in firstSetup = " + error);
    } else {
      data = JSON.parse(body);
      id = "";
      monitorArray = data.monitors;
      for (i = 0; i < monitorArray.length; i++) {

        if (cameraName_ == monitorArray[i].Monitor.Name) {
          id = monitorArray[i].Monitor.Id;
          return callback(id);
        }
      }
    }
  });
};
