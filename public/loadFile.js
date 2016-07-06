var ipcRenderer = require('electron').ipcRenderer;
var app = angular.module("loadFile",[])

app.controller('formLoadFile', function ($scope) {
  $scope.path = "data/dataSaved.json";

  $scope.setDataPath = function(){
      var status = ipcRenderer.sendSync('setDataPath',$scope.path);

  };

});