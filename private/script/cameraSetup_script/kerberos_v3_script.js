var request = require('request'); //http request를 위한 모듈
var INTERVER_TIME = 1000;

/*
kerberosSetup() - kerberos 컨테이너의 IPcamera url을 API를 통하여 설정

params

host - kerberos host
ports - web, stream ports
cameraName - cameraName
rtspUrl - IPcamera rtsp url
*/

exports.kerberosSetup = function(host, webPort, streamPort, cameraName, rtspUrl) {
  /*
  kerberos는 컨테이너 하나당 하나의 카메라를 설정한다.
  */
  //return new Promise(function(resolve, reject) {
  var context = this
  //초기 계정 설정
  return new Promise(function(resolve, reject) {

    console.log("kerberos setup start");
    context.checkServer(host, webPort).then(function(code) {
      context.firstSetup(host, webPort).then(function(success) {
        //setTimeout(function)
        context.login(host, webPort).then(function(cookie) {
          context.urlSetup(host, webPort, cookie, rtspUrl).then(function() {
            camera = [];
            cameraJson = {};
            cameraJson["name"] = cameraName;
            cameraJson["url"] = "http://" + host + ":" + streamPort;
            camera.push(cameraJson);
            console.log("kerberos setup finish");
            resolve(camera);
          });
        });
      });
    });
  });
};


/*
login() - kerberos의 로그인 페이지를 접근하여 cookie를 얻는다.
*/
exports.login = function(host, port) {

  return new Promise(function(resolve, reject) {

    path = "http://" + host + ":" + port + "/api/v1/login/login"; // login page

    body_ = {
      "username": "root", //default id
      "password": "root" //default passwd
    };

    var options = {
      url: path,
      method: 'POST',
      form: body_
    };


    var interval = setInterval(function() {
      request(options, function(error, response, body) {

        if (!error && response.statusCode == 200) {
          resolve(response.headers['set-cookie']); //쿠키 생성
          clearInterval(interval);
        }
      });
    }, INTERVER_TIME);
    
  });
};

exports.firstSetup = function(host, port) {
  //기본 유저 아이디 비밀번호 설정
  return new Promise(function(resolve, reject) {

    body_ = {
      "username": "root",
      "password1": "root",
      "password2": "root",
      "language": "en"
    };
    // 초기 설정 api
    path = "http://" + host + ":" + port + "/api/v1/user/install";

    var options = {
      url: path,
      method: 'POST',
      form: body_
    };

    var interval = setInterval(function() {
      request(options, function(error, response, body) {

        if (error) {
          console.log("Error in firstSetup = " + error);
        } else {
          resolve(error); // 계정 설정 성공
          clearInterval(interval);
        }
      });
    }, INTERVER_TIME);
  });
};

/*
urlSetup() - 컨테이너의 IPCamer setting을 하는 함수

paramas

host - kerberos host
port - kerberos webport
cookie - login cookie
url - IPcamera rtsp url
*/
exports.urlSetup = function(host, port, cookie, url) {

  return new Promise(function(resolve, reject) {

    path = "http://" + host + ":" + port + "/settings/update";

    body_ = {
      "config__instance__capture": "IPCamera",
      "capture__IPCamera__url": url
    };

    var options = {
      url: path,
      method: 'POST',
      headers: {
        'Cookie': cookie,
      },
      form: body_
    };

    var interval = setInterval(function() {
      request(options, function(error, response, body) {

        if (!error && response.statusCode == 302) {
          resolve();
          clearInterval(interval);
        } else {
          console.log("fail to setup url");
        }
      });
    }, INTERVER_TIME);

  });
};

exports.checkServer = function(host, port) {

  return new Promise(function(resolve, reject) {

    path = "http://" + host + ":" + port;


    var options = {
      url: path,
      method: 'GET'
    };


    var interval = setInterval(function() {
      request(options, function(error, response, body) {

        if (!error && response.statusCode == 200) {
          resolve(response.statusCode);
          clearInterval(interval);
        }

      });
    }, INTERVER_TIME);

  });
};
