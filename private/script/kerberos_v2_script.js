var request = require('request'); //http request를 위한 모듈

/*
kerberosSetup() - kerberos 컨테이너의 IPcamera url을 API를 통하여 설정

params

host - kerberos host
ports - web, stream ports
cameraName - cameraName
rtspUrl - IPcamera rtsp url
*/
exports.kerberosSetup = function(host, parameter, cameraName, rtspUrl, callback) {
  /*
  kerberos는 컨테이너 하나당 하나의 카메라를 설정한다.
  */


  url_ = rtspUrl[0];
  webPort = parameter.HostConfig.PortBindings["80/tcp"][0].HostPort;
  streamPort = parameter.HostConfig.PortBindings["8889/tcp"][0].HostPort;

  var context = this
  //초기 계정 설정
  context.firstSetup(host, webPort, function(firstResult) {
    //로그인을 통한 쿠키 생성
    context.login(host, webPort, function(cookie) {
      //IPcamera url 설정
      context.urlSetup(host, webPort, cookie, url_, function(result, data) {
        camera = [];
        cameraJson = {};
        cameraJson["name"] = cameraName[0];
        cameraJson["url"] = "http://" + host + ":" + streamPort;
        camera.push(cameraJson);
        //해당 컨테이너의 json 데이터 생성
        return callback(result, camera);
      });
    });
  });
};

/*
login() - kerberos의 로그인 페이지를 접근하여 cookie를 얻는다.
*/
exports.login = function(host, port, callback) {

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

  request(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      return callback(response.headers['set-cookie']);//쿠키 생성
    } else {
      return callback(error); //로그인 실패
    }
  });

};

exports.firstSetup = function(host, port, callback) {
  //기본 유저 아이디 비밀번호 설정
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

  var context = this;

  request(options, function(error, response, body) {
    if(error){
      console.log("Error in firstSetup = " + error);
      //컨테이너 실행되고 서버 실행의 시간이 있다.
      return context.firstSetup(host, port, callback);
    }else{
      return callback(error); // 계정 설정 성공
    }

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
exports.urlSetup = function(host, port, cookie, url, callback) {

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

  request(options, function(error, response, body) {
    if (!error && response.statusCode == 302) {
      return callback(error);
    } else {
      return callback(error);
    }
  });

};
