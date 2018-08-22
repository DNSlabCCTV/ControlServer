var Docker = require('dockerode');

exports.createContainer = function(image_, docker_host_, docker_port, container_port, name, callback) {
  var configData = {};

  var docker_host = new Docker({
    host: docker_host_,
    port: docker_port
  });

  if (image_ == "kerberos") {

    image = 'kerberos/kerberos';
    var webPort = container_port[0];
    var streamPort = container_port[1];

    Object.assign(configData, {
      Image: image,
      name: name
    });

    Object.assign(configData, {
      ExposedPorts: {
        "80/tcp": {},
        "8889/tcp": {}
      }
    });

    Object.assign(configData, {
      HostConfig: {
        "PortBindings": {
          "80/tcp": [{
            "HostPort": webPort
          }],
          "8889/tcp": [{
            "HostPort": streamPort
          }]
        }
      }
    });

  }

  docker_host.createContainer(configData, function(err, container) {
    callback(err,container);
  });

}

exports.getContainerName = function(host, port, callback) {

  var docker_host = new Docker({
    host: host,
    port: port
  });

  docker_host.listContainers({
    all: true
  }, function(err, containers, res) {
    var names = new Array();

    if (!err) {

      for (i = 0; i < containers.length; i++) {
        var container_name = containers[i].Names[0];
        container_name = container_name.substring(1);
        names.push(container_name);
      }

      if (callback === undefined) {
        console.log(names);
      } else {
        return callback(names);
      }

    } else {
      console.log("Something error")
    }
  });

}


exports.getPort = function(host, port, callback) {

  var docker_host = new Docker({
    host: host,
    port: port
  });

  docker_host.listContainers({
    all: true
  }, function(err, containers) {
    var ports = new Array();

    for (i = 0; i < containers.length; i++) {
      for (j = 0; j < containers[i].Ports.length; j++) {
        ports.push(containers[i].Ports[j].PublicPort)
      }
    }

    if (callback === undefined)
      console.log(ports);
    else
      callback(ports);
  });
}
