var kerberos = require(__dirname + "/cameraSetup/kerberos");
var zoneminder = require(__dirname + "/cameraSetup/zoneminder");

KERBEROS_INTERBER_TIME = 2000;
ZONEMINDER_INTERBER_TIME = 1000 * 30;

exports.cameraSetup = function(image, host, parameter, cameraNames, rtspUrls) {

  webPort = parameter.HostConfig.PortBindings["80/tcp"][0].HostPort;

  return new Promise(function(resolve, reject) {
    switch (image) {

      case "kerberos":

        setTimeout(function() {
          streamPort = parameter.HostConfig.PortBindings["8889/tcp"][0].HostPort;
          cameraName = cameraNames[0];
          rtspUrl = rtspUrls[0];
          kerberos.kerberosSetup(host, webPort, streamPort, cameraName, rtspUrl).then(function(camera) {
            resolve(camera);
          });
        }, KERBEROS_INTERBER_TIME);

        break;

      case "zoneminder":

        setTimeout(function() {
          requestArray = [];
          cameraArray = [];

          zoneminder.checkServer(host, webPort).then(function(state_code) {
            for (i = 0; i < cameraNames.length; i++) {
              requestArray.push(
                zoneminder.zoneminderSetup(host, webPort, cameraNames[i], rtspUrls[i]).then(function(camera) {
                  cameraArray.push(camera);
                })
              );
            }

            Promise.all(requestArray).then(function() {
              resolve(cameraArray);
            });

          });
        }, ZONEMINDER_INTERBER_TIME);

        break;

    }
  });
};

exports.deleteZoneminderCamera = function(host, port, name) {

  return new Promise(function(resolve, reject) {
    zoneminder.deleteCamera(host, port, name).then(function(){
      resolve(name);
    });
  });

};
