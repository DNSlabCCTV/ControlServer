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

//host = 192.168.1.104 고정
//port = 컨테이너 포트
//cameraName = containername
//rtspUrl = 예시 rtsp://192.168.1.106:8555/unicast

//Add monitors 변수
//HOST- 고정 , PORT- ??, NAME- Test1,2,3~, RTSPURL- 고정

module.exports.zoneminderSetup_v2 = function(host, ports, cameraName, rtspUrl, callback) {
  //기본 유저 아이디 비밀번호 설정

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
  path = "http://" + host + ":" + ports + "/zm/api/monitors.json";

  var options = {
    url: path,
    method: 'POST',
    form: body_
  };

  var context = this;

  request(options, function(error, response, body) {

    if (error) {
      console.log("Error in firstSetup = " + error);
      //컨테이너 실행되고 서버 실행의 시간이 있다.
      return context.zoneminderSetup_v2(host, ports, cameraName, rtspUrl, callback);
    } else {
      return callback(cameraName); // 계정 설정 성공
    }

  });

};


module.exports.ZoneminderDeleteMonitor = function(host, ports, cameraName, callback) {
  // curl -XDELETE http://server/zm/api/monitors/1.json
  // http://192.168.1.104:8180/zm/api/monitors.json
  var id_value;
  var command = 'curl -XGET http://' + host + ':' + ports + '/zm/api/monitors.json'

  function getData(callback) {
    child = exec(command, function(error, stdout, stderr) {
      console.log('stderr: ' + stderr);
      var obj = JSON.parse(stdout);
      console.log("확인", obj["monitors"][0]["Monitor"]["Name"]);
      console.log("길이 확인", Object.keys(obj.monitors).length);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      for (var i = 0; i < Object.keys(obj.monitors).length; i++) {
        if (obj["monitors"][i]["Monitor"]["Name"] == cameraName) {
          id_value = obj["monitors"][i]["Monitor"]["Id"];
          callback(id_value);
          console.log(id_value);
          break;
        }
        console.log(i);
      }
    });
  }

  getData(function(id) {
    var command = 'curl -XDELETE http://' + host + ':' + ports + '/zm/api/monitors/' + id + '.json';
    console.log(command);
    child = exec(command, function(error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
  });
};
/*

this.zoneminderSetup_v2(host, ports, cameraName, rtspUrl, function(data) {
  console.log(data);
});



this.ZoneminderSetup(host, ports, cameraName, rtspUrl, function(result,data){
	if (result){
	    console.log(result);
	}
});
*/
