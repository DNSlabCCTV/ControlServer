var fs = require("fs");

exports.initSetup = function(fileName, oboxList) {

  return new Promise(function(resolve, reject) {

    fs.exists(fileName, function(exists) {
      if (!exists) {

        initData = {
          "Obox": []
        };

        for(i = 0; i < oboxList.length; i++){
          obox = {
            "name": oboxList[i],
            "container":[]
          };
          initData.Obox.push(obox);
        }

        fs.open(fileName, 'w', function(err, fd) {
          fs.writeFile(fileName, JSON.stringify(initData, null, '\t'), "utf8", function(err, data) {
            resolve("ok");
          });
        });

      }
      
    });
  });

};
