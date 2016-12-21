'use strict';
const fs = require('fs');
const path = require('path');

const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const dialog = require('dialog');

var parseString = require('xml2js').parseString;
var debug = require('debug')('index');

var wifiLogAnalyser = require('./wifiLogAnalyser');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let logoWindow;
let dataPath;
let logoHasDisplayed = false;

function createWindow() {
  debug("[+] createWindow is called")

  // Create the browser window.
  logoWindow = new BrowserWindow({ width: 500, height: 500, transparent: true, frame: false });
  logoWindow.loadURL('file://' + __dirname + '/public/logo.html');

  setTimeout(function () {
    logoWindow.close();
    logoWindow = null;
    logoHasDisplayed = true;

    dialog.showOpenDialog(function (fileNames) {
      debug("[!] Dialog box open")
      if (fileNames === undefined) {
        debug("[-] No file choose. Quit!");
        app.quit();

      } else {
        var fileName = fileNames[0];
        dataPath = fileName;

        debug("[!] dataPath = " + dataPath);

        // Create the browser window.
        mainWindow = new BrowserWindow({ width: 1500, height: 800 });

        // and load the index.html of the app.
        mainWindow.loadURL('file://' + __dirname + '/public/index.html');

        // Open the DevTools.
        //mainWindow.webContents.openDevTools();

        // Emitted when the window is closed.
        mainWindow.on('closed', function () {
          mainWindow = null;
        });
      }
    });


  }, 4000);



}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin' && logoHasDisplayed) {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});


ipcMain.on('getCoord', function (event, arg) {
  debug("[+] getCoord is called");

  var data = wifiLogAnalyser.getPoints(dataPath);

  debug("[+] data is set to: " + typeof (data));
  event.returnValue = data;
});

ipcMain.on('getResultFromMergingMultipleScan', function(event, arg){
  mergeMultipleScan(function(wifiArray){
    
    wifiArray ? event.returnValue = wifiArray : event.returnValue = null;

  })
});

ipcMain.on('compareData', function (event, arg) {
  compareData();
  event.returnValue = "";
});

function mergeMultipleScan(callback){
  console.log("[!] Choosing files to merge");
  dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }, function (fileNames) {
    if (fileNames === undefined) {
      debug("[-] No file choose. Quit!");
      callback();

    } else {
      
      var data = [];

      // Merge scan
      for(var i=0; i < fileNames.length; i++){
        console.log("[!] Merging file " + fileNames[i]);
        var wifiFromFile = wifiLogAnalyser.getPoints(fileNames[i]);
        console.log("Length: " + wifiFromFile.length);  
        data = data.concat(wifiFromFile);
      }
      console.log("Merge array's length: " + data.length);
      
      callback(data);
    }

    
  });
}

/**
 * Check if some Wifi are present in two different scan
 */
function compareData() {
  var fileName1, fileName2;
  dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }, function (fileNames) {
    if (fileNames === undefined) {
      debug("[-] No file choose. Quit!");
      app.quit();

    } else {
      fileName1 = fileNames[0];
      fileName2 = fileNames[1];

      console.log("Difference between\n" + fileName1 + "\n");


      var data1 = wifiLogAnalyser.getPoints(fileName1);

      var wifiList;

      if(fileName2){
        console.log(fileName2);
        var data2 = wifiLogAnalyser.getPoints(fileName2);
        wifiList = findIdenticWifiOnMultipleScan(data1, data2);
      }else{
        wifiList = identifyWifi(data1);
      }
      

      wifiList.print();
      console.log("Length of list: " + wifiList.list.length);
      console.log("Number of hidden network: " + wifiList.indexHidden);
      app.quit();

    }
  });

}

function WifiDataSet() {
  this.list = [];
  this.indexHidden = 0;

  this.add = function (wifiToAdd) {
    var wifiExist = false;

    // Filter Wifi to remove duplicate
    for (var i = 0; i < this.list.length; i++) {
      if (wifiToAdd.SSID == this.list[i].SSID && wifiToAdd.BSSID == this.list[i].BSSID) {
        wifiExist = true;
        i = this.list.length; // stop the for
      }
    }

    if (!wifiExist && wifiToAdd.BSSID != "00:c0:ca:8f:68:24") {


      if (wifiToAdd.SSID == "") {
        //wifiToAdd.SSID = "hidden" + this.indexHidden;
        this.indexHidden++;
      }

      this.list.push(wifiToAdd);

    }
  }

  this.print = function () {
    this.list.forEach(function (wifi) {
      console.log("SSID:" + wifi.SSID + "   BSSID: " + wifi.BSSID);
    });
  }

}

function findIdenticWifiOnMultipleScan(data1, data2) {
  var wifiList = new WifiDataSet();

  data1.forEach(function (wifi1) {
    if (wifi1.Lat && typeof wifi1.Lon) {
      data2.forEach(function (wifi2) {
        if (wifi2.Lat && wifi2.Lon && wifi2.Signal > 0 && wifi1.SSID == wifi2.SSID && wifi1.BSSID == wifi2.BSSID) {
          wifiList.add(wifi1);
        }

      })
    }

  }, this);

  return wifiList;
}

function identifyWifi(data){
  var wifiList = new WifiDataSet();

  data.forEach(function (wifi1) {
    if (wifi1.Lat && typeof wifi1.Lon) {
      wifiList.add(wifi1);
    }

  }, this);

  return wifiList;
}
